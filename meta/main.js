import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";

let data = [];
let commits = [];
let filteredCommits = [];

let commitProgress = 100;
let commitMaxTime;
let timeScale;

let svg;
let dots;
let xScale;
let yScale;
let rScale;
let xAxis;
let yAxis;
let usableArea;

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 40 };

const colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url:
          "https://github.com/hannahhuangh/Portfolio-Hannah-Huang/commit/" +
          commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    })
    .sort((a, b) => d3.ascending(a.datetime, b.datetime));
}

function renderCommitInfo(data, commits) {
  const container = d3.select("#stats");

  container.html("");

  const dl = container.append("dl").attr("class", "stats");

  const lines = commits.flatMap((d) => d.lines);
  const files = d3.group(lines, (d) => d.file).size;
  const maxDepth = d3.max(lines, (d) => d.depth) ?? 0;
  const longestLine = d3.max(lines, (d) => d.length) ?? 0;
  const maxLines = d3.max(commits, (d) => d.totalLines) ?? 0;

  dl.append("dt").text("Commits");
  dl.append("dd").text(commits.length);

  dl.append("dt").text("Files");
  dl.append("dd").text(files);

  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(lines.length);

  dl.append("dt").text("Max Depth");
  dl.append("dd").text(maxDepth);

  dl.append("dt").text("Longest Line");
  dl.append("dd").text(longestLine);

  dl.append("dt").text("Max Lines");
  dl.append("dd").text(maxLines);
}

function updateFilesDisplay(commits) {
  const lines = commits.flatMap((d) => d.lines);

  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = d3
    .select("#files")
    .selectAll("div")
    .data(files, (d) => d.name)
    .join((enter) => {
      const div = enter.append("div");

      const dt = div.append("dt");
      dt.append("code");
      dt.append("small");

      div.append("dd");

      return div;
    });

  filesContainer.select("dt code").text((d) => d.name);

  filesContainer.select("dt small").text((d) => `${d.lines.length} lines`);

  filesContainer
    .select("dd")
    .selectAll("div")
    .data((d) => d.lines)
    .join("div")
    .attr("class", "loc")
    .style("--color", (d) => colors(d.type));
}

function renderTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("commit-time");
  const author = document.getElementById("commit-author");
  const lines = document.getElementById("commit-lines");

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
  });

  time.textContent = commit.datetime?.toLocaleTimeString("en", {
    timeStyle: "short",
  });

  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

function renderScatterPlot(data, commits) {
  svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  rScale = d3
    .scaleSqrt()
    .domain(d3.extent(commits, (d) => d.totalLines))
    .range([4, 30]);

  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3
      .axisLeft(yScale)
      .tickFormat("")
      .tickSize(-usableArea.width)
  );

  xAxis = d3.axisBottom(xScale);

  yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  dots = svg.append("g").attr("class", "dots");

  svg.call(d3.brush().on("start brush end", brushed));

  updateScatterPlot(data, commits);
}

function updateScatterPlot(data, commits) {
  if (commits.length === 0) {
    dots.selectAll("circle").remove();
    return;
  }

  xScale.domain(d3.extent(commits, (d) => d.datetime)).nice();

  svg.select("g.x-axis").selectAll("*").remove();
  svg.select("g.x-axis").call(xAxis);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll("circle")
    .data(sortedCommits, (d) => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove", (event) => {
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });

  svg.selectAll(".dots, .overlay ~ *").raise();
}

function setupSlider() {
  const slider = document.querySelector("#commit-progress");
  slider.addEventListener("input", onTimeSliderChange);
}

function onTimeSliderChange() {
  const slider = document.querySelector("#commit-progress");
  const time = document.querySelector("#commit-date-display");

  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);

  time.textContent = commitMaxTime.toLocaleString("en", {
    dateStyle: "long",
    timeStyle: "short",
  });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateFilesDisplay(filteredCommits);
  renderCommitInfo(data, filteredCommits);
  updateScatterPlot(data, filteredCommits);
}

function renderCommitStory(commits) {
  d3.select("#scatter-story")
    .selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html((d, i) => {
      const date = d.datetime.toLocaleString("en", {
        dateStyle: "full",
        timeStyle: "short",
      });

      const files = d3.rollups(
        d.lines,
        (v) => v.length,
        (line) => line.file
      );

      const filesText = files
        .map(([file, count]) => `${file} (${count} lines)`)
        .join(", ");

      return `
        <p>
          On <strong>${date}</strong>, I made
          <a href="${d.url}" target="_blank" rel="noopener noreferrer">
            commit ${i + 1}
          </a>.
        </p>

        <p>
          This commit edited <strong>${d.totalLines}</strong> lines across:
          ${filesText}.
        </p>
      `;
    });
}

function setupScrollytelling() {
  const scroller = scrollama();

  scroller
    .setup({
      container: "#scrolly-1",
      step: "#scrolly-1 .step",
      offset: 0.5,
    })
    .onStepEnter((response) => {
      const commit = response.element.__data__;

      commitMaxTime = commit.datetime;
      commitProgress = timeScale(commitMaxTime);

      const slider = document.querySelector("#commit-progress");
      slider.value = commitProgress;

      const time = document.querySelector("#commit-date-display");
      time.textContent = commitMaxTime.toLocaleString("en", {
        dateStyle: "long",
        timeStyle: "short",
      });

      filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

      updateFilesDisplay(filteredCommits);
      renderCommitInfo(data, filteredCommits);
      updateScatterPlot(data, filteredCommits);
    });

  window.addEventListener("resize", scroller.resize);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector("#selection-count");

  if (!countElement) return selectedCommits;

  countElement.textContent = `${
    selectedCommits.length || "No"
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById("language-breakdown");

  if (!container) return;

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = "";

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1%")(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines<br>(${formatted})</dd>
    `;
  }
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll("circle").classed("selected", (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

data = await loadData();
commits = processCommits(data);
filteredCommits = commits;

timeScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, 100]);

commitMaxTime = timeScale.invert(commitProgress);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
updateFilesDisplay(commits);
renderCommitStory(commits);
setupSlider();
setupScrollytelling();
onTimeSliderChange();