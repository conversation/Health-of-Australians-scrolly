gsap.registerPlugin(ScrollTrigger);

function createScrollFades() {
  gsap.utils.toArray(".pinned_section").forEach((pinnedSection) => {
    const bgArr = pinnedSection.querySelector(".pinned_media").children;

    const parTriggersArr = pinnedSection.querySelectorAll(".step");

    parTriggersArr.forEach((par, index) => {
      ScrollTrigger.create({
        fastScrollEnd: true,
        trigger: par,
        start: `top ${par.classList.contains("delay") ? "70" : "90"}%`,
        onEnter: () => {
          bgArr[par.dataset.imageIndex || index + 1].classList.add(
            "make_visible"
          );
        },
        onLeaveBack: () => {
          bgArr[par.dataset.imageIndex || index + 1].classList.remove(
            "make_visible"
          );
        },
      });
    });
  });
}

class D3Chart {
  constructor(
    selector,
    data,
    currentDemographic,
    allDemographics,
    frameRate,
    breakPoint
  ) {
    this.data = data;
    this.currentDemographic = currentDemographic;
    this.allDemographics = allDemographics;
    this.selector = selector;
    this.parent = d3.select(this.selector);
    this.width = parseInt(this.parent.style("width"));
    this.height = parseInt(this.parent.style("height"));
    this.svg = this.parent
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", "circle_chart");
    this.xRange;
    this.yRange;
    this.xScale = d3.scaleOrdinal();
    this.yScale = d3.scaleOrdinal();
    this.stroke = 4;
    this.radius = 10 - this.stroke / 2;
    this.circles;
    this.frameRate = frameRate;
    this.statisticForce;
    this.populationForce;
    this.simulation;
    this.breakPoint = breakPoint;
    this.FNtoggle = false;
    this.titleMain = document.querySelector(".title_one");
    this.titleStat = document.querySelector(".title_two");
    this.build();
  }

  getDimensions() {
    this.width = parseInt(this.parent.node().getBoundingClientRect().width);
    this.height = parseInt(this.parent.node().getBoundingClientRect().height);
  }

  getRanges() {
    if (
      this.currentDemographic === "empty set" ||
      this.currentDemographic === "single circle" ||
      this.currentDemographic === "empty set FN"
    ) {
      this.xRange =
        window.innerWidth <= this.breakPoint
          ? [this.width / 2, this.width / 2] // arrange horizontally in the middle
          : [(this.width / 4) * 3, (this.width / 4) * 3]; // float right

      this.yRange = [this.height / 2, this.height / 2]; // arrange vertically in the middle
    } else {
      this.xRange =
        window.innerWidth <= this.breakPoint
          ? [this.width / 2, this.width / 2] // arrange horizontally in the middle
          : [(this.width / 4) * 3, (this.width / 4) * 3]; // float 3/4 right

      this.yRange = [(this.height / 4) * 3, this.height / 3]; // split upper 1/4 and lower 3/4
    }
  }

  randomPosition() {
    var outerRadius = this.width * 2; // outer range
    var innerRadius = this.width / 2; // inner range
    var startCenter =
      window.innerWidth <= this.breakPoint
        ? [this.width / 2, this.height / 2]
        : [(this.width / 4) * 3, this.height / 2]; // randomised around center point

    var angle = Math.random() * Math.PI * 2;
    var distance = Math.random() * (outerRadius - innerRadius) + innerRadius;
    var x = Math.cos(angle) * distance + startCenter[0];
    var y = Math.sin(angle) * distance + startCenter[1];

    return { x, y };
  }

  randomiseNodes() {
    this.data = this.data.map((node, index) => {
      let XY = this.randomPosition();
      return {
        ...node,
        x: index === 0 ? (node.x ? node.x : this.width / 2) : XY.x,
        y: index === 0 ? (node.y ? node.y : this.height / 2) : XY.y,
      };
    });
  }

  createCircles() {
    this.circles = this.svg
      .selectAll("circle")
      .data(
        // only provide the first data node for single circle
        this.currentDemographic === "single circle"
          ? [this.data[0]]
          : this.data,
        (d) => d.id
      )
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", (d) =>
              d[this.currentDemographic] > 0
                ? "circle active"
                : "circle inactive"
            )
            .attr("fill", (d) =>
              d[this.currentDemographic] > 0 ? "#d8352a" : "#62626a"
            )
            .attr("opacity", 0)
            .attr("r", 0)
            .attr("stroke-width", this.stroke)
            .transition()
            .duration(100)
            .delay((_, i) => i * 5)
            .attr("opacity", 1)
            .attr("r", this.radius)
            .attr("stroke", (d) =>
              d[this.currentDemographic] > 0 ? "#d8352a" : "#62626a"
            ),

        (update) =>
          update
            .attr("class", (d) =>
              d[this.currentDemographic] > 0
                ? "circle active"
                : "circle inactive"
            )
            .attr("stroke", (d) =>
              d[this.currentDemographic] > 0 ? "#d8352a" : "#62626a"
            ),

        (exit) =>
          exit
            .attr("opacity", 1)
            .transition()
            .duration(300)
            .delay((_, i) => i * 2)
            .attr("opacity", 0)
            .attr("r", 0)
            .remove()
      );
  }

  handleTitles() {
    if (this.currentDemographic === "single circle") {
      this.svg.node().classList.add("make_visible");
      this.titleMain.classList.remove("make_visible", "transform_center");
      this.titleStat.classList.remove("make_visible", "transform_center");
    } else if (
      this.currentDemographic === "empty set" ||
      this.currentDemographic === "empty set FN"
    ) {
      this.svg.node().classList.add("make_visible");
      this.titleMain.classList.add(
        "make_visible",
        "transform_center",
        "label_center"
      );
      this.titleMain.classList.remove("label_left");
      this.titleStat.classList.remove("make_visible", "transform_center");
      this.titleMain.innerHTML = this.allDemographics[this.currentDemographic];
    } else {
      this.svg.node().classList.add("make_visible");
      this.titleMain.classList.remove("label_center");
      this.titleMain.classList.add(
        "make_visible",
        "transform_center",
        "label_left"
      );
      this.titleStat.classList.add(
        "make_visible",
        "transform_center",
        "label_right"
      );

      this.titleStat.innerHTML = this.currentDemographic;
      this.titleMain.innerHTML = this.allDemographics[this.currentDemographic];
    }
  }

  colourSubCircles(
    colourPercentages,
    selection = d3.selectAll(".circle.active"),
    defaultColour = "#d8352a"
  ) {
    selection.attr("fill", (d, i, nodes) => {
      const totalElements = nodes.length;

      // Calculate cumulative thresholds
      let cumulativeEndIndex = 0;
      const cumulativePercentages = colourPercentages.map((d) => {
        cumulativeEndIndex += Math.round(d.percentage * totalElements);
        return {
          color: d.color,
          endIndex: cumulativeEndIndex,
        };
      });

      // Determine the color based on the index
      for (let j = 0; j < cumulativePercentages.length; j++) {
        if (i < cumulativePercentages[j].endIndex) {
          return cumulativePercentages[j].color;
        }
      }

      return defaultColour; // Default stroke for elements that do not match any color range
    });
  }

  handleSubCategories() {
    d3.selectAll(".circle")
      .attr("fill", (d) =>
        d[this.currentDemographic] > 0 ? "#d8352a" : "#62626a"
      )
      .attr("stroke", (d) =>
        d[this.currentDemographic] > 0 ? "#d8352a" : "#62626a"
      );

    if (
      this.currentDemographic === "At least one childhood chronic condition"
    ) {
      this.colourSubCircles([
        { color: "#505aaf", percentage: 0.28 }, // allergic rhinitis (13%) (28% of sub)
        { color: "#40bf95", percentage: 0.18 }, // asthma (8.2%) (18% of sub)
      ]);
    } else if (
      this.currentDemographic === "At least one long-term health condition"
    ) {
      this.colourSubCircles([
        { color: "#505aaf", percentage: 0.62 }, // 38% with two or more chronic conditions
      ]);
    } else if (this.currentDemographic === "Overweight or obese") {
      this.colourSubCircles([
        { color: "#505aaf", percentage: 0.52 }, // 34% are living with overweight
        { color: "#40bf95", percentage: 0.48 }, // 32% with obesity
      ]);
    } else if (this.currentDemographic === "Childhood obestity 2022") {
      this.colourSubCircles([
        { color: "#505aaf", percentage: 0.89 }, // 25% are in 2017-18
      ]);
    } else if (
      this.currentDemographic ===
      "Experience physical and/or sexual violence since the age of 15"
    ) {
      this.colourSubCircles([{ color: "#505aaf", percentage: 0.487 }]);
    } else if (this.currentDemographic === "First Nations") {
      d3.selectAll(".circle").attr("fill", "#62626a").attr("stroke", "#62626a");

      this.colourSubCircles(
        [{ color: "#d8352a", percentage: 0.286 }],
        d3.selectAll(".circle.active"),
        "#62626a"
      );
      this.colourSubCircles(
        [{ color: "#d8352a", percentage: 0.514 }],
        d3.selectAll(".circle.inactive"),
        "#62626a"
      );
    } else if (this.currentDemographic === "empty set FN") {
      this.FNtoggle = false;

      this.colourSubCircles(
        [
          { color: "#505aaf", percentage: 0.38 },
          { color: "#feaa01", percentage: 0.16 },
          { color: "#29a37a", percentage: 0.14 },
          { color: "#33a8cc", percentage: 0.13 },
          { color: "#e9928c", percentage: 0.1 },
        ],
        d3.selectAll(".circle.inactive"),
        "#62626a"
      );
    }
    this.FNtoggle = false;
  }

  defineCustomForces() {
    this.statisticForce;
    this.populationForce;

    // Custom implementation of a force applied to only every second node
    this.statisticForce = d3
      .forceManyBody()
      .strength(-200)
      .theta(0)
      .distanceMax(150);

    // Save the default initialization method
    let initStatForce = this.statisticForce.initialize;

    // a subset of nodes
    this.statisticForce.initialize = (nodes) => {
      const demo = this.currentDemographic;
      // Filter subset of nodes and delegate to saved initialization.
      initStatForce(
        nodes.filter(function (d) {
          return d[demo] > 0;
        })
      ); // Apply to every 2nd node
    };

    // Custom implementation of a force applied to only every second node
    this.populationForce = d3
      .forceManyBody()
      .strength(-200)
      .theta(0)
      .distanceMax(250);

    // Save the default initialization method
    let initPopForce = this.populationForce.initialize;

    // Custom implementation of .initialize() calling the saved method with only
    // a subset of nodes
    this.populationForce.initialize = (nodes) => {
      const demo = this.currentDemographic;
      // Filter subset of nodes and delegate to saved initialization.
      initPopForce(
        nodes.filter(function (d) {
          return d[demo] < 1;
        })
      ); // Apply to every 2nd node
    };
  }

  build() {
    this.getDimensions();

    this.getRanges();

    this.xScale.domain([0, 1]).range(this.xRange);

    this.yScale.domain([0, 1]).range(this.yRange);

    // Append the defs element
    const defs = this.svg.append("defs");

    // Append the filter element
    const filter = defs.append("filter").attr("id", "inner-stroke");

    // Append the feMorphology element
    filter
      .append("feMorphology")
      .attr("in", "SourceAlpha")
      .attr("operator", "dilate")
      .attr("radius", 4)
      .attr("result", "dilated");

    // Append the feComposite element
    filter
      .append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "dilated")
      .attr("operator", "in");

    this.randomiseNodes();

    this.createCircles();

    this.defineCustomForces();

    this.simulation = d3
      .forceSimulation()
      // .alphaDecay(0.01) // Default is 0.0228, lower it to slow the cooling down
      .alphaTarget(0.005) // Stay hot
      .velocityDecay(0.09) // Friction
      // .velocityDecay(this.frameRate > 100 ? 0.11 : 0.09) // Friction
      .nodes(
        this.currentDemographic === "single circle" ? [this.data[0]] : this.data
      )
      .force(
        // prevent overlap
        "collide",
        d3
          .forceCollide()
          .strength(1)
          .radius((d) => this.radius * 0.5)
          .iterations(3)
      )
      .force("pickyStatistic", this.statisticForce)
      .force("pickyPopulation", this.populationForce)
      .force(
        // position y-axis
        "y",
        d3
          .forceY()
          .strength(0.6)
          .y((d) => this.yScale(d[this.currentDemographic]))
      )
      .force(
        // position x-axis
        "x",
        d3
          .forceX()
          .strength(0.6)
          .x((d) => this.xScale(d[this.currentDemographic]))
      )
      .on("tick", () => {
        this.circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      })
      .tick(300);

    this.render();
  }

  update(newchartDemographic = this.currentDemographic) {
    this.currentDemographic = newchartDemographic;

    // if (this.currentDemographic === "single circle") {
    //   // this.randomiseNodes();
    // }

    if (this.currentDemographic === "empty set FN") {
      this.FNtoggle = true;
    }

    if (this.currentDemographic === "start") {
      this.randomiseNodes();
      this.titleMain.classList.remove("make_visible", "transform_center");
    } else {
      this.createCircles();
      this.handleTitles();
      this.render();
    }
  }

  render() {
    this.getDimensions();

    this.getRanges();

    this.handleSubCategories();

    this.svg.attr("width", this.width).attr("height", this.height);

    this.xScale.domain([0, 1]).range(this.xRange);

    this.yScale.domain([0, 1]).range(this.yRange);

    this.simulation
      .nodes(
        this.currentDemographic === "single circle" ? [this.data[0]] : this.data
      )
      .restart();
  }

  pause() {
    // this.svg.selectAll("circle").remove();
    this.simulation.stop();
  }
}

function createInteractive() {
  d3.csv("../assets/data.csv")
    .then((rawData) => {
      let circleNum = 100;
      let data = Array.from({ length: circleNum }, () => ({}));
      let allKeys = {};

      rawData.forEach((statistic) => {
        let keys = Object.keys(statistic);

        for (let i = 1; i < keys.length; i++) {
          let demographic = keys[i];
          let shuffledIndexes = d3.shuffle([...Array(circleNum).keys()]);

          if (Math.round(statistic[demographic]) > 0) {
            let statisticKey = statistic.type;

            let populationKey = statistic.population;

            data = data.map((row, index) => {
              row.id = index;
              row[statisticKey] = 0;
              row["empty set"] = 0;
              row["empty set FN"] = 0;
              row["single circle"] = index === 0 ? 1 : 0;

              return row;
            });

            if (
              [
                "Overweight or obese",
                "Anxiety",
                "Back problems",
                "Depression",
                "Asthma",
                "Deafness or hearing loss",
                "Mental disorder among females in the last 12 months (2007)",
                "Mental disorder among females in the last 12 months (2020-2022)",
              ].includes(statisticKey)
            ) {
              // Non randomised circles
              for (
                let ind = 0;
                ind < Math.round(statistic[demographic]);
                ind++
              ) {
                data[ind][statisticKey] = 1;
              }
            } else {
              // Randomise circles
              shuffledIndexes
                .slice(0, Math.round(statistic[demographic]))
                .forEach((index) => {
                  data[index][statisticKey] = 1;
                });
            }

            allKeys[statisticKey] = populationKey;
          }
        }

        allKeys["empty set"] = "Australia";
        allKeys["empty set FN"] = "First Nations chonic conditions";
        allKeys["single circle"] = null;
      });

      let chartDemographic = "single circle";

      const chart = new D3Chart(
        ".chart_wrapper",
        data,
        chartDemographic,
        allKeys,
        60, // Set interval based on refresh rate,
        599
      );

      const resizeObserver = new ResizeObserver((entries) => {
        chart.render();
      });

      resizeObserver.observe(document.querySelector(".chart_wrapper"));

      const chartElement = document.querySelector(".circle_chart");

      gsap.utils
        .toArray(".interactive1 .chapter")
        .forEach((step, index, arr) => {
          ScrollTrigger.create({
            trigger: step,
            start: `top 80%`,
            onToggle: (self) => {
              if (index === 0 && self.direction < 0) {
                chart.update("start");
                chartElement.classList.remove("make_visible");
              }

              if (self.isActive) {
                chart.update(step.dataset.stat);
              }
            },
            // onLeave: () => {
            //   if (index === arr.length - 1) {
            //     // chart.pause();
            //   }
            // },
          });
        });
    })
    .catch((error) => console.log(error));
}

function createTitle() {
  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const parent = d3.select(".title_media");
  let width = parent.node().getBoundingClientRect().width;
  let height = parent.node().getBoundingClientRect().height;

  const svg = d3
    .select("#title_animation")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  let nodes, circles, simulation, randomCircle;

  function clip() {
    let clipPath = d3.selectAll(".aus_clip");
    let ausOutline = d3.selectAll(".aus_outline");

    if (width > 599) {
      let scale = 0.4;
      ausOutline.attr("opacity", 1);

      clipPath.attr("transform", `scale(${scale})`);
      ausOutline.attr("transform", `scale(${scale})`);

      let bbox = ausOutline.node().getBoundingClientRect();

      let translateX = (width - bbox.width) / 2;
      let translateY = (height - bbox.height) / 1.7;

      clipPath.attr(
        "transform",
        `translate(${translateX},${translateY}) scale(${scale})`
      );
      ausOutline.attr(
        "transform",
        `translate(${translateX},${translateY}) scale(${scale})`
      );
    } else {
      ausOutline.attr("opacity", 0);
    }
  }

  function build() {
    clip();
    svg.select(".title_circle_group").remove();

    nodes = Array.from({ length: 250 }, (_, index) => {
      return {
        id: index,
        x: randomIntFromInterval(width * -2, width * 2) + width / 2, // Random value between -width * 2 and +width * 2
        y: randomIntFromInterval(height * -2, height * 2) + height / 2, // Random value between -height * 2 and +height * 2
        radius: width > 599 ? 18 : 13,
      };
    });

    randomCircle = Math.floor(Math.random() * 200);

    circles = svg
      .append("g")
      .classed("title_circle_group", true)
      .attr("clip-path", width > 599 ? "url(#ausCutout)" : "")
      .selectAll("circle")
      .data(nodes)
      .join(
        (enter) =>
          enter
            .append("circle")
            .classed("title_circle", true)
            .attr("fill", (_, i) =>
              i === randomCircle ? "#d8352a" : "#62626a"
            )
            .attr("r", 0)
            .call((enter) =>
              enter
                .transition()
                .duration(500)
                .attr("r", (d) => d.radius)
            ),
        (update) => update,
        (exit) => exit.remove()
      );

    simulation = d3
      .forceSimulation()
      .alphaDecay(0.1)
      .alphaTarget(0.1)
      .velocityDecay(0.9)
      .nodes(nodes)
      .force(
        // prevent overlap
        "collide",
        d3
          .forceCollide()
          .strength(1)
          .radius((d) => d.radius * 0.5)
          .iterations(3)
      )
      .force(
        "forceCharge",
        d3.forceManyBody().strength(width > 599 ? -500 : -400)
      )
      .force(
        // position y-axis
        "y",
        d3
          .forceY()
          .strength(0.6)
          .y(window.innerHeight / 2)
      )
      .force(
        // position x-axis
        "x",
        d3
          .forceX()
          .strength(0.6)
          .x(window.innerWidth / 2)
      )
      .on("tick", () => {
        circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });
  }

  build();

  const resizeObserver = new ResizeObserver((entries) => {
    width = parent.node().getBoundingClientRect().width;
    height = parent.node().getBoundingClientRect().height;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    circles.attr("clip-path", width > 599 ? "url(#ausCutout)" : "");
    clip();

    simulation.force("y").y(window.innerHeight / 2);
    simulation.force("x").x(window.innerWidth / 2);
  });

  resizeObserver.observe(document.querySelector(".title_media"));

  ScrollTrigger.create({
    trigger: ".title_section",
    start: "bottom top",
    onLeaveBack: () => {
      build();
    },
    onLeave: () => {
      svg.selectAll(".title_circle_group").remove();
      simulation.stop();
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  createInteractive();

  createTitle();

  // createScrollFades();

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  });
});
