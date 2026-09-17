import Route from "./Route.js";

//Définir ici vos routes
export const allRoutes = [
    new Route("/", "Accueil", "/pages/Accueil.html"),
    new Route("/404", "Page introuvable", "/pages/404.html")
];

//Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "Vite Gourmand";