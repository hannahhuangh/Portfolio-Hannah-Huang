import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects, BASE_PATH } from "../global.js";

let selectedIndex = -1;
let query = "";

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);
const projectsContainer = document.querySelector(".projects");
const titleElement = document.querySelector(".projects-title");
const searchInput = document.querySelector(".searchBar");

if (titleElement && projects) {
  titleElement.textContent = `${projects.length} Projects`;
}

renderProjects(projects, projectsContainer, "h2");
renderPieChart(projects);

searchInput.addEventListener("input", (event) => {
  query = event.target.value;
  selectedIndex = -1;

  const filteredProjects = filterProjectsBySearch(projects);

  renderProjects(filteredProjects, projectsContainer, "h2");
  renderPieChart(filteredProjects);
});

function filterProjectsBySearch(projectList) {
  return projectList.filter((project) => {
    const values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function renderPieChart(projectsGiven) {
  const svg = d3.select("#projects-pie-plot");
  const legend = d3.select(".legend");

  svg.selectAll("path").remove();
  legend.selectAll("li").remove();

  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => {
    return {
      value: count,
      label: year
    };
  });

  const sliceGenerator = d3.pie().value((d) => d.value);

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const arcData = sliceGenerator(data);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, idx) => {
    svg
      .append("path")
      .attr("d", arcGenerator(d))
      .attr("fill", colors(idx))
      .classed("selected", selectedIndex === idx)
      .on("click", () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        const searchFilteredProjects = filterProjectsBySearch(projects);

        const finalProjects =
          selectedIndex === -1
            ? searchFilteredProjects
            : searchFilteredProjects.filter(
                (project) => project.year === data[selectedIndex].label
              );

        renderProjects(finalProjects, projectsContainer, "h2");
        renderPieChart(finalProjects);
      });
  });

  data.forEach((d, idx) => {
    legend
      .append("li")
      .attr("style", `--color: ${colors(idx)}`)
      .classed("selected", selectedIndex === idx)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        const searchFilteredProjects = filterProjectsBySearch(projects);

        const finalProjects =
          selectedIndex === -1
            ? searchFilteredProjects
            : searchFilteredProjects.filter(
                (project) => project.year === data[selectedIndex].label
              );

        renderProjects(finalProjects, projectsContainer, "h2");
        renderPieChart(finalProjects);
      });
  });
}