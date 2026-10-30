
/* ==========================================
   1. SÉLECTION DES ÉLÉMENTS HTML
========================================== */

const listeMenus = document.querySelector("#liste-menus");

const filtreTheme = document.querySelector("#filtreTheme");
const filtreRegime = document.querySelector("#filtreRegime");
const filtrePrixMin = document.querySelector("#filtrePrixMin");
const filtrePrixMax = document.querySelector("#filtrePrixMax");
const filtrePersonnes = document.querySelector("#filtrePersonnes");

const resetFiltres = document.querySelector("#resetFiltres");
const menusResultats = document.querySelector("#menusResultats");

const galerieMenus = document.querySelector("#galerie-menus");


/* ==========================================
   2. DONNÉES LOCALES COMPLÉMENTAIRES
========================================== */

const menusLocaux = [

    /* MENU 1 : BŒUF AU SOJA */

    {
        titre: "Bœuf au soja",

        description:
            "Bœuf mariné au soja & gingembre, légumes croquants au wok, riz jasmin parfumé.",

        personnesMin: 6,
        prix: 147,

        image: "/images/imagesGaleries/img4.jpg",

        theme: "Pâques",
        regime: "Classique",

        plats: {
            entrees: [
                "Entrée à définir"
            ],
            principaux: [
                "Bœuf au soja, légumes croquants et riz jasmin"
            ],
            desserts: [
                "Dessert à définir"
            ]
        },

        allergenes: [
            "Soja"
        ],

        conditions: [
            "Délai de commande à définir",
            "Conditions de conservation à définir",
            "Conditions de livraison à définir"
        ],

        stock: null,

        galerie: [
            "/images/imagesGaleries/img4.jpg"
        ]
    },

    /* MENU 2 : SALADE AU SAUMON */

    {
        titre: "Salade au saumon",

        description:
            "Saumon fumé, avocat, pamplemousse rose et jeunes pousses, vinaigrette au citron vert & aneth.",

        personnesMin: 5,
        prix: 66,

        image: "/images/imagesGaleries/img3.jpg",

        theme: "Classique",
        regime: "Pescétarien",

        plats: {
            entrees: [
                "Entrée à définir"
            ],
            principaux: [
                "Salade au saumon fumé, avocat et pamplemousse"
            ],
            desserts: [
                "Dessert à définir"
            ]
        },

        allergenes: [
            "Poisson"
        ],

        conditions: [
            "Délai de commande à définir",
            "Conservation au frais : modalités à définir",
            "Conditions de livraison à définir"
        ],

        stock: null,

        galerie: [
            "/images/imagesGaleries/img3.jpg"
        ]
    },

    /* MENU 3 : POULET RÔTI */

    {
        titre: "Poulet rôti",

        description:
            "Poulet fermier rôti au thym frais, jus corsé et pommes grenailles confites.",

        personnesMin: 4,
        prix: 85,

        image: "/images/imagesGaleries/img1.jpg",

        theme: "Noël",
        regime: "Classique",

        plats: {
            entrees: [
                "Entrée à définir"
            ],
            principaux: [
                "Poulet fermier rôti au thym et pommes grenailles"
            ],
            desserts: [
                "Dessert à définir"
            ]
        },

        allergenes: [],

        conditions: [
            "Délai de commande à définir",
            "Conditions de réchauffage à définir",
            "Conditions de livraison à définir"
        ],

        stock: null,

        galerie: [
            "/images/imagesGaleries/img1.jpg"
        ]
    }

];


/* ==========================================
   3. CHARGEMENT DES MENUS DEPUIS SYMFONY
========================================== */

let menus = [];

async function chargerMenus() {

    if (!listeMenus) return;

    listeMenus.textContent = "Chargement des menus...";

    try {

        const response = await fetch("/api/menus", {
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const donneesAPI = await response.json();

        if (!Array.isArray(donneesAPI)) {
            throw new Error("Format des données invalide.");
        }

        menus = donneesAPI.map((menuAPI) => {

            // Association des anciennes données locales
            // avec les données provenant de Symfony.

            const menuLocal = menusLocaux.find(
                (menu) => menu.titre === menuAPI.titre
            );

            // Les images enregistrées dans Symfony
            // sont prioritaires.

            const imagesAPI = Array.isArray(menuAPI.galerie)
                ? menuAPI.galerie.filter(
                    (chemin) =>
                        typeof chemin === "string" &&
                        chemin.trim() !== ""
                )
                : [];

            const imagePrincipale =
                menuAPI.image ||
                imagesAPI[0] ||
                menuLocal?.image ||
                "";

            const galerie =
                imagesAPI.length > 0
                    ? imagesAPI
                    : menuAPI.image
                        ? [menuAPI.image]
                        : (menuLocal?.galerie || []);

            // Plats provenant de Symfony en priorité.

            const plats = menuAPI.plats || menuLocal?.plats || {
                entrees: [],
                principaux: [],
                desserts: []
            };

            // Allergènes provenant de Symfony.

            const allergenes = Array.isArray(menuAPI.allergenes)
                ? menuAPI.allergenes
                : (menuLocal?.allergenes || []);

            // Symfony renvoie normalement un tableau
            // pour les conditions.

            let conditions = [];

            if (Array.isArray(menuAPI.conditions)) {
                conditions = menuAPI.conditions;
            } else if (
                typeof menuAPI.conditions === "string" &&
                menuAPI.conditions.trim() !== ""
            ) {
                conditions = [menuAPI.conditions];
            } else {
                conditions = menuLocal?.conditions || [];
            }

            return {

                ...menuLocal,
                ...menuAPI,

                image: imagePrincipale,

                galerie: galerie,

                plats: plats,

                allergenes: allergenes,

                conditions: conditions

            };

        });

        afficherMenus();

        console.log(
            "Menus chargés depuis Symfony :",
            menus
        );

    } catch (erreur) {

        console.error(
            "Erreur de chargement des menus :",
            erreur
        );

        listeMenus.textContent =
            "Impossible de charger les menus. Veuillez réessayer.";

        if (menusResultats) {
            menusResultats.textContent = "";
        }

    }

}


/* ==========================================
   4. FONCTIONS UTILITAIRES
========================================== */

function creerElement(tag, texte = "", classe = "") {

    const element = document.createElement(tag);

    element.textContent = texte ?? "";

    if (classe) {
        element.className = classe;
    }

    return element;
}


function creerImage(src, alt) {

    const image = document.createElement("img");

    image.alt = alt || "Image du menu";
    image.loading = "lazy";
    image.className = "image-menu";

    if (src && typeof src === "string") {

        image.src = src;

    } else {

        // Aucune image enregistrée pour ce menu.
        image.alt = `Aucune image disponible pour ${alt}`;

    }

    image.addEventListener("error", () => {

        console.warn(
            "Impossible de charger l'image :",
            image.src
        );

    });

    return image;
}


/* ==========================================
   5. CRÉATION DES CARTES
========================================== */

function creerCarteMenu(menu) {

    const carte = document.createElement("article");
    carte.className = "carte-menu";


    /* IMAGE ET BADGE */

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "menuImageWrapper";

    const image = creerImage(
        menu.image,
        menu.titre
    );

    const badge = creerElement(
        "span",
        menu.theme,
        "menuBadge"
    );

    imageWrapper.append(image, badge);


    /* CONTENU */

    const contenu = document.createElement("div");
    contenu.className = "menuCarteContenu";

    const titre = creerElement(
        "h3",
        menu.titre
    );

    const description = creerElement(
        "p",
        menu.description,
        "menuDescription"
    );


    /* INFORMATIONS */

    const infos = document.createElement("div");
    infos.className = "menuInfos";

    const personnes = creerElement(
        "span",
        `${menu.personnesMin} personnes minimum`
    );

    const regime = creerElement(
        "span",
        menu.regime
    );

    infos.append(personnes, regime);


    /* PRIX ET BOUTON DÉCOUVRIR */

    const bas = document.createElement("div");
    bas.className = "menuCarteBas";

    const prix = creerElement(
        "strong",
        `${menu.prix} €`,
        "menuPrix"
    );

    const bouton = creerElement(
        "a",
        "Découvrir",
        "btnMenu"
    );

    bouton.href = "/detail-menu";

    bouton.addEventListener("click", () => {

        sessionStorage.setItem(
            "menuSelectionne",
            JSON.stringify(menu)
        );

    });


    /* ASSEMBLAGE DE LA CARTE */

    bas.append(prix, bouton);

    contenu.append(
        titre,
        description,
        infos,
        bas
    );

    carte.append(
        imageWrapper,
        contenu
    );

    return carte;
}


/* ==========================================
   6. FILTRER ET AFFICHER LES MENUS
========================================== */

function afficherMenus() {

    if (!listeMenus) return;


    /* RÉCUPÉRATION DES FILTRES */

    const theme = filtreTheme?.value || "tous";
    const regime = filtreRegime?.value || "tous";

    const prixMin = filtrePrixMin?.value
        ? Number(filtrePrixMin.value)
        : 0;

    const prixMax = filtrePrixMax?.value
        ? Number(filtrePrixMax.value)
        : Infinity;

    const personnes = filtrePersonnes?.value
        ? Number(filtrePersonnes.value)
        : null;


    /* FILTRAGE */

    const resultats = menus.filter((menu) => {

        const themeValide =
            theme === "tous" ||
            menu.theme === theme;

        const regimeValide =
            regime === "tous" ||
            menu.regime === regime;

        const prixValide =
            menu.prix >= prixMin &&
            menu.prix <= prixMax;

        const personnesValide =
            personnes === null ||
            menu.personnesMin <= personnes;

        return (
            themeValide &&
            regimeValide &&
            prixValide &&
            personnesValide
        );

    });


    /* AFFICHAGE DES CARTES */

    const fragment = document.createDocumentFragment();

    resultats.forEach((menu) => {

        fragment.appendChild(
            creerCarteMenu(menu)
        );

    });

    listeMenus.replaceChildren(fragment);


    /* NOMBRE DE RÉSULTATS */

    if (menusResultats) {

        menusResultats.textContent =
            `${resultats.length} menu(s) trouvé(s)`;

    }


    /* AUCUN RÉSULTAT */

    if (resultats.length === 0) {

        const message = creerElement(
            "p",
            "Aucun menu ne correspond à vos critères."
        );

        listeMenus.appendChild(message);

    }

}


/* ==========================================
   7. INITIALISATION DES FILTRES
========================================== */

if (listeMenus) {

    // Chargement initial depuis Symfony.

    chargerMenus();


    /* FILTRES SELECT */

    filtreTheme?.addEventListener(
        "change",
        afficherMenus
    );

    filtreRegime?.addEventListener(
        "change",
        afficherMenus
    );


    /* FILTRES NUMÉRIQUES */

    filtrePrixMin?.addEventListener(
        "input",
        afficherMenus
    );

    filtrePrixMax?.addEventListener(
        "input",
        afficherMenus
    );

    filtrePersonnes?.addEventListener(
        "input",
        afficherMenus
    );


    /* RÉINITIALISATION */

    resetFiltres?.addEventListener("click", () => {

        if (filtreTheme) {
            filtreTheme.value = "tous";
        }

        if (filtreRegime) {
            filtreRegime.value = "tous";
        }

        if (filtrePrixMin) {
            filtrePrixMin.value = "";
        }

        if (filtrePrixMax) {
            filtrePrixMax.value = "";
        }

        if (filtrePersonnes) {
            filtrePersonnes.value = "";
        }

        afficherMenus();

    });

}


/* ==========================================
   8. GALERIE DES 11 PHOTOGRAPHIES
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
   9. AFFICHAGE DE LA GALERIE
========================================== */

function afficherGalerie() {

    if (!galerieMenus) return;

    const fragment = document.createDocumentFragment();

    photosGalerie.forEach((photo) => {

        const figure = document.createElement("figure");
        figure.className = "menusGalerieItem";


        /* IMAGE */

        const image = document.createElement("img");

        image.src = photo.image;
        image.alt = photo.titre;

        image.loading = "lazy";
        image.decoding = "async";


        /* LÉGENDE */

        const legende = document.createElement("figcaption");
        legende.textContent = photo.titre;


        /* ASSEMBLAGE */

        figure.append(image, legende);
        fragment.appendChild(figure);

    });

    galerieMenus.replaceChildren(fragment);

}


/* ==========================================
   10. INITIALISATION DE LA GALERIE
========================================== */

afficherGalerie();
