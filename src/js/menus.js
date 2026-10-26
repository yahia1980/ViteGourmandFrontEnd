
/* ==========================================
   VITE & GOURMAND - MENUS + GALERIE
   Données récupérées depuis Symfony / MySQL
   ========================================== */

(() => {

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
       2. DONNÉES DES MENUS
       ========================================== */

    let menus = [];


    /* ==========================================
       3. CHARGEMENT DEPUIS SYMFONY
       ========================================== */

    async function chargerMenus() {

        if (!listeMenus) return;

        listeMenus.textContent = "Chargement des menus...";

        try {

            const response = await fetch("/api/menus");

            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const donneesAPI = await response.json();

            if (!Array.isArray(donneesAPI)) {
                throw new Error("Format des données invalide.");
            }

            menus = donneesAPI.map((menu) => {

                const galerie = Array.isArray(menu.galerie)
                    ? menu.galerie
                    : [];

                const plats = menu.plats || {};

                const conditions = Array.isArray(menu.conditions)
                    ? menu.conditions
                    : menu.conditions
                        ? [menu.conditions]
                        : [];

                return {

                    id: menu.id,

                    titre: menu.titre || "",

                    description: menu.description || "",

                    personnesMin: Number(menu.personnesMin) || 0,

                    prix: Number(menu.prix) || 0,

                    stock: Number(menu.stock) || 0,

                    theme: menu.theme || "",

                    regime: menu.regime || "",

                    image: menu.image || galerie[0] || "",

                    galerie: galerie,

                    plats: {
                        entrees: Array.isArray(plats.entrees)
                            ? plats.entrees
                            : [],

                        principaux: Array.isArray(plats.principaux)
                            ? plats.principaux
                            : [],

                        desserts: Array.isArray(plats.desserts)
                            ? plats.desserts
                            : []
                    },

                    allergenes: Array.isArray(menu.allergenes)
                        ? menu.allergenes
                        : [],

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
       5. CRÉATION DES CARTES MENUS
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


        /* ASSEMBLAGE */

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

        // Charger les menus depuis Symfony
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

})();
