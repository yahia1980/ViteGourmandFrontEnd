import Route from "./Route.js";

//Définir ici vos routes
export const allRoutes = [
    new Route("/", "Accueil", "/pages/Accueil.html"),
    new Route("/404", "Page introuvable", "/pages/404.html"),
    new Route("/Menus", "Menus", "/pages/menus.html","/src/js/menus.js"),
    new Route("/Contact", "Contact", "/pages/contact.html"),
    new Route("/Connexion", "Connexion", "/pages/connexion.html")
];

//Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "Vite Gourmand";