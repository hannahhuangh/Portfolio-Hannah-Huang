export function renderProjects(projects, containerElement, headingLevel = "h2") {
  if (!containerElement) {
    console.error("Missing container element");
    return;
  }

  containerElement.innerHTML = "";

  if (!projects || projects.length === 0) {
    containerElement.innerHTML = "<p>No projects available yet.</p>";
    return;
  }

  for (const project of projects) {
    const article = document.createElement("article");

    const title = project.url
      ? `<${headingLevel}><a href="${project.url}" target="_blank" rel="noopener noreferrer">${project.title}</a></${headingLevel}>`
      : `<${headingLevel}>${project.title}</${headingLevel}>`;

    const imageURL = project.image.startsWith("http")
      ? project.image
      : BASE_PATH + project.image;

    article.innerHTML = `
      ${title}
      <img src="${imageURL}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  }
}