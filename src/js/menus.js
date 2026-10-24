
/* ==========================================
   VITE & GOURMAND - MENUS + GALERIE
   ========================================== */

const listeMenus = document.querySelector("#liste-menus");
const detailsMenu = document.querySelector("#details-menu");

const filtreTheme = document.querySelector("#filtreTheme");
const filtreRegime = document.querySelector("#filtreRegime");
const resetFiltres = document.querySelector("#resetFiltres");
const menusResultats = document.querySelector("#menusResultats");

const galerieMenus = document.querySelector("#galerie-menus");

/* ==========================================
   LES MENUS AVEC LES PRIX
   ========================================== */

const menus = [
    {
        titre: "Bœuf au soja",
        description: "Bœuf mariné au soja & gingembre, légumes croquants au wok, riz jasmin parfumé.",
        personnesMin: 6,
        prix: 147,
        image: "/images/imagesGaleries/img4.jpg",
        theme: "Pâques",
        regime: "Classique"
    },
    {
        titre: "Salade au saumon",
        description: "Saumon fumé, avocat, pamplemousse rose et jeunes pousses, vinaigrette au citron vert & aneth.",
        personnesMin: 5,
        prix: 66,
        image: "/images/imagesGaleries/img3.jpg",
        theme: "Classique",
        regime: "Pescétarien"
    },
    {
        titre: "Poulet rôti",
        description: "Poulet fermier rôti au thym frais, jus corsé et pommes grenailles confites.",
        personnesMin: 4,
        prix: 85,
        image: "/images/imagesGaleries/img1.jpg",
        theme: "Noël",
        regime: "Classique"
    }
];

/* ==========================================
   FONCTIONS UTILITAIRES
   ========================================== */

function creerElement(tag, texte, classe = "") {
    const element = document.createElement(tag);
    element.textContent = texte;

    if (classe) {
        element.className = classe;
    }

    return element;
}

function creerImage(src, alt) {
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.loading = "lazy";
    image.className = "image-menu";
    return image;
}

/* ==========================================
   AFFICHER LES CARTES DES MENUS
   ========================================== */

function creerCarteMenu(menu) {
    const carte = document.createElement("article");
    carte.className = "carte-menu";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "menuImageWrapper";

    const image = creerImage(menu.image, menu.titre);
    const badge = creerElement("span", menu.theme, "menuBadge");

    imageWrapper.append(image, badge);

    const contenu = document.createElement("div");
    contenu.className = "menuCarteContenu";

    const titre = creerElement("h3", menu.titre);

    const description = creerElement(
        "p",
        menu.description,
        "menuDescription"
    );

    const infos = document.createElement("div");
    infos.className = "menuInfos";

    const personnes = creerElement(
        "span",
        `${menu.personnesMin} personnes minimum`
    );

    const regime = creerElement("span", menu.regime);

    infos.append(personnes, regime);

    const bas = document.createElement("div");
    bas.className = "menuCarteBas";

    const prix = creerElement(
        "strong",
        `${menu.prix} €`,
        "menuPrix"
    );

    const bouton = creerElement(
        "button",
        "Découvrir",
        "btnMenu"
    );

    bouton.type = "button";

    bouton.addEventListener("click", () => {
        afficherDetailMenu(menu);
    });

    bas.append(prix, bouton);
    contenu.append(titre, description, infos, bas);
    carte.append(imageWrapper, contenu);

    return carte;
}

/* ==========================================
   DÉTAILS D'UN MENU
   ========================================== */

function fermerDetails() {
    if (!detailsMenu) return;

    detailsMenu.replaceChildren();
    detailsMenu.classList.remove("detailMenu");
}

function afficherDetailMenu(menu) {
    if (!detailsMenu) return;

    fermerDetails();
    detailsMenu.classList.add("detailMenu");

    const image = creerImage(menu.image, menu.titre);

    const titre = creerElement("h2", menu.titre);
    const description = creerElement("p", menu.description);

    const personnes = creerElement(
        "p",
        `Nombre de personnes minimum : ${menu.personnesMin}`
    );

    const prix = creerElement(
        "p",
        `Prix du menu : ${menu.prix} €`
    );

    const theme = creerElement(
        "p",
        `Thème : ${menu.theme}`
    );

    const regime = creerElement(
        "p",
        `Régime alimentaire : ${menu.regime}`
    );

    const fermer = creerElement(
        "button",
        "Fermer",
        "btnMenu"
    );

    fermer.type = "button";
    fermer.addEventListener("click", fermerDetails);

    detailsMenu.append(
        image,
        titre,
        description,
        personnes,
        prix,
        theme,
        regime,
        fermer
    );

    detailsMenu.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* ==========================================
   FILTRER ET AFFICHER LES MENUS
   ========================================== */

function afficherMenus() {
    if (!listeMenus) return;

    const theme = filtreTheme?.value || "tous";
    const regime = filtreRegime?.value || "tous";

    const resultats = menus.filter((menu) => {
        const themeValide =
            theme === "tous" || menu.theme === theme;

        const regimeValide =
            regime === "tous" || menu.regime === regime;

        return themeValide && regimeValide;
    });

    const fragment = document.createDocumentFragment();

    resultats.forEach((menu) => {
        fragment.appendChild(creerCarteMenu(menu));
    });

    listeMenus.replaceChildren(fragment);
    fermerDetails();

    if (menusResultats) {
        menusResultats.textContent =
            `${resultats.length} menu(s) disponible(s)`;
    }

    if (resultats.length === 0) {
        listeMenus.appendChild(
            creerElement(
                "p",
                "Aucun menu ne correspond à vos critères."
            )
        );
    }
}

if (listeMenus) {
    afficherMenus();

    filtreTheme?.addEventListener("change", afficherMenus);
    filtreRegime?.addEventListener("change", afficherMenus);

    resetFiltres?.addEventListener("click", () => {
        if (filtreTheme) filtreTheme.value = "tous";
        if (filtreRegime) filtreRegime.value = "tous";

        afficherMenus();
    });
}

/* ==========================================
   GALERIE DES 11 PHOTOGRAPHIES
   ========================================== */

const photosGalerie = [
    {
        image: "/images/imagesGaleries/photo1.jpg",
        titre: "Tartelettes aux fruits"
    },
    {
        image: "/images/imagesGaleries/photo2.jpg",
        titre: "Dessert aux fraises"
    },
    {
        image: "/images/imagesGaleries/photo3.jpg",
        titre: "Notre chef pâtissier"
    },
    {
        image: "/images/imagesGaleries/photo4.jpg",
        titre: "Bouchées apéritives"
    },
    {
        image: "/images/imagesGaleries/photo5.jpg",
        titre: "Saumon gastronomique"
    },
    {
        image: "/images/imagesGaleries/photo6.jpg",
        titre: "Dessert raffiné"
    },
    {
        image: "/images/imagesGaleries/photo7.jpg",
        titre: "Cuisine généreuse"
    },
    {
        image: "/images/imagesGaleries/photo8.jpg",
        titre: "Réception gastronomique"
    },
    {
        image: "/images/imagesGaleries/photo9.jpg",
        titre: "Nos créations culinaires"
    },
    {
        image: "/images/imagesGaleries/photo10.jpg",
        titre: "Dressage gastronomique"
    },
    {
        image: "/images/imagesGaleries/photo11.jpg",
        titre: "Viande gastronomique"
    }
];

/* ==========================================
   AFFICHER LA GALERIE
   ========================================== */

function afficherGalerie() {
    if (!galerieMenus) return;

    const fragment = document.createDocumentFragment();

    photosGalerie.forEach((photo) => {
        const figure = document.createElement("figure");
        figure.className = "menusGalerieItem";

        const image = document.createElement("img");
        image.src = photo.image;
        image.alt = photo.titre;
        image.loading = "lazy";
        image.decoding = "async";

        const legende = document.createElement("figcaption");
        legende.textContent = photo.titre;

        figure.append(image, legende);
        fragment.appendChild(figure);
    });

    galerieMenus.replaceChildren(fragment);
}

afficherGalerie();

