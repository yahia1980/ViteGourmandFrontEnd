const listMenus = document.querySelector("#liste-menus");
const detailMenu = document.querySelector("#details-menu");

const menus = [
    { titre: "Bœuf au soja", description: "Bœuf mariné au soja & gingembre, légumes croquants au wok, riz jasmin parfumé.", personnesMin: 6, prix: 147, image: "/images/imagesGaleries/img4.jpg", theme: "Pâques", regime: "Classique" },
    { titre: "Salade au saumon", description: "Saumon fumé, avocat, pamplemousse rose et jeunes pousses, vinaigrette au citron vert & aneth.", personnesMin: 5, prix: 66, image: "/images/imagesGaleries/img3.jpg", theme: "Classique", regime: "Végétarien" },
    { titre: "Poulet rôti", description: "Poulet fermier rôti au thym frais, jus corsé et pommes grenailles confites.", personnesMin: 4, prix: 85, image: "/images/imagesGaleries/img1.jpg", theme: "Noël", regime: "Classique" }
];

const createTextElement = (tagName, text) => {
    const element = document.createElement(tagName);
    element.textContent = text;
    return element;
};

const createImage = (menu) => {
    const image = document.createElement("img");
    image.src = menu.image;
    image.alt = menu.titre;
    image.loading = "lazy";
    image.decoding = "async";
    image.classList.add("image-menu");
    return image;
};

const fermerDetails = () => {
    detailMenu.replaceChildren();
    detailMenu.classList.remove("detailMenu");
};

const afficherDetailMenu = (menu) => {
    detailMenu.replaceChildren();
    detailMenu.classList.add("detailMenu");
    const fermer = document.createElement("button");
    fermer.type = "button";
    fermer.classList.add("btnMenu");
    fermer.textContent = "Fermer";
    fermer.addEventListener("click", fermerDetails);
    detailMenu.append(
        createImage(menu), createTextElement("h2", menu.titre),
        createTextElement("p", menu.description),
        createTextElement("p", `Nombre de personnes minimum : ${menu.personnesMin}`),
        createTextElement("p", `Prix par menu : ${menu.prix} €`),
        createTextElement("p", `Thème : ${menu.theme}`),
        createTextElement("p", `Régime : ${menu.regime}`), fermer
    );
};

const afficherCarteMenu = (menu) => {
    const carte = document.createElement("article");
    carte.classList.add("carte-menu");
    const voirMenu = document.createElement("button");
    voirMenu.type = "button";
    voirMenu.classList.add("btnMenu");
    voirMenu.textContent = "Voir le menu";
    voirMenu.addEventListener("click", () => afficherDetailMenu(menu));
    carte.append(
        createImage(menu), createTextElement("h3", menu.titre),
        createTextElement("p", menu.description),
        createTextElement("p", `Nombre de personnes minimum : ${menu.personnesMin}`),
        createTextElement("p", `Prix par menu : ${menu.prix} €`),
        createTextElement("p", `Thème : ${menu.theme}`),
        createTextElement("p", `Régime : ${menu.regime}`), voirMenu
    );
    return carte;
};

if (listMenus && detailMenu) {
    const fragment = document.createDocumentFragment();
    menus.forEach((menu) => fragment.appendChild(afficherCarteMenu(menu)));
    listMenus.appendChild(fragment);
}
