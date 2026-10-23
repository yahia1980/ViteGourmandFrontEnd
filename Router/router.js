import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

const route404 = new Route("/404", "Page introuvable", "/pages/404.html");
const mainPage = document.querySelector("#main-page");

const getRouteByUrl = (url) => {
    const normalizedUrl = url.toLowerCase();
    return allRoutes.find((route) => route.url.toLowerCase() === normalizedUrl) || route404;
};

const removePageAssets = () => {
    document.querySelectorAll('link[data-page-css="true"], script[data-page-js="true"]')
        .forEach((element) => element.remove());
};

const loadPage = async () => {
    const actualRoute = getRouteByUrl(window.location.pathname);
    try {
        const response = await fetch(actualRoute.pathHtml);
        if (!response.ok) throw new Error(`Impossible de charger ${actualRoute.pathHtml}`);
        mainPage.innerHTML = await response.text();
        removePageAssets();
        const stylesheets = Array.isArray(actualRoute.pathCSS)
    ? actualRoute.pathCSS
    : [actualRoute.pathCSS];

stylesheets.forEach((cssPath) => {
    if (cssPath) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssPath;
        link.dataset.pageCss = "true";
        document.head.appendChild(link);
    }
});
        const scripts = Array.isArray(actualRoute.pathJS)
    ? actualRoute.pathJS
    : [actualRoute.pathJS];

for (const scriptPath of scripts) {
    if (scriptPath) {
        const script = document.createElement("script");
        script.type = "module";
        script.src = scriptPath;
        script.dataset.pageJs = "true";
        document.body.appendChild(script);
    }
}
        document.title = `${actualRoute.title} - ${websiteName}`;
    } catch (error) {
        console.error(error);
        mainPage.innerHTML = "<p>Une erreur est survenue lors du chargement de la page.</p>";
    }
};

const routeEvent = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", event.currentTarget.href);
    loadPage();
};

document.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", routeEvent));
window.addEventListener("popstate", loadPage);
window.route = routeEvent;
loadPage();
