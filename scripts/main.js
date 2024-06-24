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
    this.title1;
    this.title2;
    this.xRange;
    this.yRange;
    this.xScale = d3.scaleOrdinal();
    this.yScale = d3.scaleOrdinal();
    this.radius = 10;
    this.circles;
    this.frameRate = frameRate;
    this.simulation;
    this.breakPoint = breakPoint;
    this.build();
  }

  getDimensions() {
    this.width = parseInt(this.parent.node().getBoundingClientRect().width);
    this.height = parseInt(this.parent.node().getBoundingClientRect().height);
  }

  getRanges() {
    if (
      this.currentDemographic === "empty set" ||
      this.currentDemographic === "single circle"
    ) {
      this.xRange =
        this.width < this.breakPoint
          ? [this.width / 2, this.width / 2] // arrange vertically in the middle
          : [(this.width / 3) * 2, (this.width / 3) * 2]; // float right

      this.yRange = [this.height / 2, this.height / 2];

      // this.xRange = [this.width / 2, this.width / 2]
      // this.yRange = [this.height / 2, this.height / 2];
      // this.xRange = [(this.width / 3) * 2, (this.width / 3) * 2]; // float right
    } else {
      this.xRange =
        this.width < this.breakPoint
          ? [this.width / 2, this.width / 2] // arrange vertically in the middle
          : [(this.width / 3) * 2, (this.width / 3) * 2]; // float right
      // : [this.width / 3, (this.width / 3) * 2];

      this.yRange =
        this.width < this.breakPoint
          ? [(this.height / 3) * 2, this.height / 3] // arrange vertically in the middle
          : [(this.height / 3) * 2, this.height / 3]; // float right
      // : [this.height / 2, this.height / 2];
    }
  }

  randomPosition() {
    var outerRadius = this.width > this.height ? this.width : this.height; // outer range
    var innerRadius =
      this.width > this.height ? (this.width / 3) * 2 : (this.height / 3) * 2; // inner range
    var startCenter = [(this.width / 3) * 2, (this.height / 3) * 2]; // randomised around center point

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
            .attr("width", "10px")
            .attr("height", "10px")
            .attr("viewBox", "0 0 477.141 477.141")
            .attr("class", (d) =>
              d[this.currentDemographic] > 0
                ? "circle active"
                : this.currentDemographic === "single circle"
                ? "circle hidden"
                : "circle inactive"
            )

            .attr("opacity", 0)
            .attr("r", 0)
            .transition()
            .duration(500)
            .delay((_, i) => i * 5)
            .attr("opacity", 1)
            .attr("r", this.radius),
        (update) =>
          update.attr("class", (d) =>
            d[this.currentDemographic] > 0
              ? "circle active"
              : this.currentDemographic === "single circle"
              ? "circle hidden"
              : "circle inactive"
          ),

        (exit) =>
          exit
            .attr("opacity", 1)
            .transition()
            .duration(500)
            .delay((_, i) => i * 5)
            .attr("opacity", 0)
            .attr("r", 0)
            .remove()
      );
  }

  build() {
    this.getDimensions();

    this.getRanges();

    this.xScale.domain([0, 1]).range(this.xRange);

    this.yScale.domain([0, 1]).range(this.yRange);

    this.randomiseNodes();

    this.createCircles();

    this.simulation = d3
      .forceSimulation()
      // .alphaDecay(0.02) // Default is 0.0228, lower it to slow the cooling down
      .alphaTarget(0.005) // Stay hot
      .velocityDecay(this.frameRate > 100 ? 0.11 : 0.099) // Friction
      .nodes(
        this.currentDemographic === "single circle" ? [this.data[0]] : this.data
      )
      .force(
        // prevent overlap
        "collide",
        d3
          .forceCollide()
          .strength(0.1)
          .radius((d) => this.radius)
          .iterations(3)
      )
      .force(
        // create spacing
        "charge",
        d3.forceManyBody().strength(-200).theta(0).distanceMax(200)
      )
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

    if (this.currentDemographic === "single circle") {
      this.randomiseNodes();
      this.createCircles();
    } else {
      this.createCircles();
    }

    this.render();
  }

  render() {
    this.getDimensions();

    this.getRanges();

    this.svg.attr("width", this.width).attr("height", this.height);

    this.xScale.domain([0, 1]).range(this.xRange);

    this.yScale.domain([0, 1]).range(this.yRange);

    this.simulation
      .nodes(
        this.currentDemographic === "single circle" ? [this.data[0]] : this.data
      )
      .restart();
  }
}

function createInteractive() {
  d3.csv("../assets/data.csv")
    .then((rawData) => {
      let circleNum = 100;
      let data = Array.from({ length: circleNum }, () => ({}));
      let allKeys = [];

      rawData.forEach((statistic) => {
        let keys = Object.keys(statistic);

        for (let i = 1; i < keys.length; i++) {
          let demographic = keys[i];
          let shuffledIndexes = d3.shuffle([...Array(circleNum).keys()]);

          if (Math.round(statistic[demographic]) > 0) {
            let newKey = `${statistic.type} ${
              demographic.split(" proportion")[0]
            }`;

            data = data.map((row, index) => {
              row.id = index;
              row[newKey] = 0;
              row["empty set"] = 0;
              row["single circle"] = index === 0 ? 1 : 0;

              return row;
            });

            shuffledIndexes
              .slice(0, Math.round(statistic[demographic]))
              .forEach((index) => {
                data[index][newKey] = 1;
              });

            allKeys.push(newKey);
          }
        }
      });

      allKeys.push("empty set", "single circle");

      function estimateRefreshRate(callback) {
        let start, end;
        let frameCount = 0;
        const samples = 10; // Number of frames to sample for the estimation

        function step(timestamp) {
          if (start === undefined) {
            start = timestamp;
          }
          end = timestamp;
          frameCount++;

          if (frameCount < samples) {
            requestAnimationFrame(step);
          } else {
            const duration = end - start;
            const estimatedRefreshRate = (frameCount / duration) * 1000;
            callback(estimatedRefreshRate);
          }
        }

        requestAnimationFrame(step);
      }

      estimateRefreshRate((estimatedRefreshRate) => {
        let chartDemographic = "single circle";

        const chart = new D3Chart(
          ".chart_wrapper",
          data,
          chartDemographic,
          allKeys,
          estimatedRefreshRate, // Set interval based on refresh rate,
          599
        );

        const resizeObserver = new ResizeObserver((entries) => {
          chart.render();
        });

        resizeObserver.observe(document.querySelector(".chart_wrapper"));

        const title1 = document.querySelector(".title_one");
        const title2 = document.querySelector(".title_two");
        const chartElement = document.querySelector(".circle_chart");

        gsap.utils.toArray(".interactive1 .chapter").forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 80%",
            onToggle: (self) => {
              if (index === 0 && self.direction < 0) {
                chartElement.classList.remove("make_visible");
              }

              if (self.isActive) {
                if (index === 0) {
                  chart.update("single circle");
                  chartElement.classList.add("make_visible");
                  title1.classList.remove("make_visible", "transform_center");
                  title2.classList.remove("make_visible", "transform_center");
                } else if (index === 1) {
                  chart.update("empty set");
                  chartElement.classList.add("make_visible");
                  title1.classList.add(
                    "make_visible",
                    "transform_center",
                    "label_center"
                  );
                  title1.classList.remove("label_left");
                  title2.classList.remove("make_visible", "transform_center");
                } else {
                  chartElement.classList.add("make_visible");
                  title1.classList.remove("label_center");
                  title1.classList.add(
                    "make_visible",
                    "transform_center",
                    "label_left"
                  );
                  title2.classList.add(
                    "make_visible",
                    "transform_center",
                    "label_right"
                  );
                  title2.innerHTML = allKeys[index];
                  chart.update(allKeys[index]);
                }
              }
            },
          });
        });
      });
    })
    .catch((error) => console.log(error));
}

document.addEventListener("DOMContentLoaded", () => {
  // Lazy load videos
  new LazyLoad({
    threshold: 800,
  });

  createInteractive();

  // createScrollFades();

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  });
});
