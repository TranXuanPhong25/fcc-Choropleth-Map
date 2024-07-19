// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// import * as d3 from "d3"

import * as topojson from "https://cdn.skypack.dev/topojson@3.0.2";

const TOOLTIP_PADDING = 20;
const LEGEND_POS = 100;
const LEGEND_RECT_SIZE = 30;
const US_EDUCATION_DATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const US_COUNTIES_DATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

const padding = 60;
const width = 1000;
const height = 600;
const svg = d3.select("svg").attr("width", width).attr("height", height);
const tooltip = d3.select("#tooltip");

const fetchData = () => {
   const requests = [fetch(US_EDUCATION_DATA_URL), fetch(US_COUNTIES_DATA_URL)];

   return Promise.all(requests)
      .then(responses => Promise.all(responses.map(res => res.json())))
      .catch(error => console.error("Failed to fetch data:", error));
}

const getColor = (percentage) => {
   if (percentage <= 15) {
      return "#f7f7f7";
   } else if (percentage <= 30) {
      return "#d9f0a3";
   } else if (percentage <= 45) {
      return "#addd8e";
   } else if (percentage <= 60) {
      return "#78c679";
   } else if (percentage <= 75) {
      return "#31a354";
   } else {
      return "#006837";
   }
}

fetchData().then((data) => {
   const [educationData, countiesData] = data;
   console.log(data);
   const maxEducation = d3.max(educationData, d => d.bachelorsOrHigher);
   const colorScale = d3.scaleSequential(d3.interpolateGreens)
      .domain([0,75]);
   //county map
   svg.append("g")
      .selectAll("path")
      .data(topojson.feature(countiesData, countiesData.objects.counties).features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", d3.geoPath())
      .attr("data-fips", d => d.id)
      .attr("data-education", d => {
         const county = educationData.find(county => county.fips === d.id);
         return county.bachelorsOrHigher;
      })
      .attr("fill", d => {
         const county = educationData.find(county => county.fips === d.id);
         return colorScale(county.bachelorsOrHigher);
      })
      .on("mousemove", (event, d) => {
         const county = educationData.find(county => county.fips === d.id);
         tooltip
            .style("opacity", 0.9)
            .style("left", `${event.pageX + TOOLTIP_PADDING}px`)
            .style("top", `${event.pageY + TOOLTIP_PADDING}px`)
            .attr("data-education", county.bachelorsOrHigher)
            .html(`
               <p>${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%</p>
            `);
      })
      .on("mouseout", () => {
         tooltip.style("opacity", 0);
      });
   // state boundary
   svg.append("g")
      .selectAll("path")
      .data(topojson.feature(countiesData, countiesData.objects.states).features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath())
      .attr("fill", d => {
         return "none";
      })
      .attr("stroke", "white")
      .attr("stroke-width", 1);

   //legend rect
   const legend = svg.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${width - LEGEND_POS}, ${height - 200})`)
      .selectAll("rect")
      .data([75, 60, 45, 30, 15])
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * LEGEND_RECT_SIZE)
      .attr("width", LEGEND_RECT_SIZE)
      .attr("height", LEGEND_RECT_SIZE)
      .attr("fill", d => getColor(d));
   //legend axis
   const legendAxis = d3.axisRight(d3.scaleLinear().domain([75,0]).range([0, 150]))
      .tickValues([0, 15, 30, 45, 60, 75])
      .tickFormat(d => `${d}%`);
   svg.append("g")
      .attr("transform", `translate(${width - LEGEND_POS+LEGEND_RECT_SIZE}, ${height - 200})`)
      .call(legendAxis)
      .attr("id", "legend-axis")
      .attr("font-size", 14);


});
