console.log("IT'S ALIVE!");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

const pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "resume/", title: "Resume" },
    { url: "https://github.com/hannahhuangh", title: "GitHub" }
];

const BASE_PATH =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
        ? "/"
        : "/Portfolio-Hannah-Huang/";

document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
`
);

const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
    let url = p.url;

    if (!url.startsWith("http")) {
        url = BASE_PATH + url;
    }

    const a = document.createElement("a");
    a.href = url;
    a.textContent = p.title;

    a.classList.toggle(
        "current",
        a.host === location.host && a.pathname === location.pathname
    );

    if (a.host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }

    nav.append(a);
}

const select = document.querySelector(".color-scheme select");

function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty("color-scheme", colorScheme);
    select.value = colorScheme;
    localStorage.colorScheme = colorScheme;
}

if ("colorScheme" in localStorage) {
    setColorScheme(localStorage.colorScheme);
}

select.addEventListener("input", function (event) {
    setColorScheme(event.target.value);
});

const form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
  event.preventDefault();

  const data = new FormData(form);
  const params = [];

  for (const [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${params.join("&")}`;
  location.href = url;
});