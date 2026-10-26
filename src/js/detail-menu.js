/* ==========================================
   VITE & GOURMAND - DÉTAIL D'UN MENU
   ========================================== */

(function () {

    const page = document.querySelector("#detailPage");

    if (!page) return;

    /* RÉCUPÉRATION DU MENU SÉLECTIONNÉ */

    let menu = null;

    try {
        const donnees = sessionStorage.getItem("menuSelectionne");

        if (donnees) {
            menu = JSON.parse(donnees);
        }
    } catch (erreur) {
        console.error("Impossible de lire le menu :", erreur);
    }

    /* FONCTIONS UTILITAIRES */

    function remplirTexte(id, texte) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = texte;
        }
    }

    function remplirListe(id, elements) {
        const liste = document.getElementById(id);

        if (!liste) return;

        liste.replaceChildren();

        const valeurs = Array.isArray(elements) && elements.length
            ? elements
            : ["À définir"];

        valeurs.forEach((valeur) => {
            const li = document.createElement("li");
            li.textContent = valeur;
            liste.appendChild(li);
        });
    }

    /* AUCUN MENU SÉLECTIONNÉ */

    if (!menu) {
        remplirTexte("detailTitre", "Aucun menu sélectionné");
        remplirTexte(
            "detailDescription",
            "Retournez au catalogue et cliquez sur Découvrir."
        );

        const contenu = page.querySelector(".detailLayout");

        if (contenu) {
            contenu.hidden = true;
        }

        return;
    }

    /* BANNIÈRE */

    const hero = document.getElementById("detailHero");

    if (hero && menu.image) {
        // L'image provient du tableau local des menus.
        hero.style.backgroundImage = `url("${menu.image}")`;
    }

    remplirTexte("detailTheme", menu.theme || "Menu");
    remplirTexte("detailTitre", menu.titre || "Menu");
    remplirTexte("detailDescription", menu.description || "");

    /* INFORMATIONS */

    remplirTexte(
        "detailPersonnes",
        `${menu.personnesMin} personnes`
    );

    remplirTexte(
        "detailRegime",
        menu.regime || "À confirmer"
    );

    remplirTexte(
        "detailStock",
        menu.stock == null
            ? "À confirmer"
            : menu.stock > 0
                ? `${menu.stock} disponible(s)`
                : "Épuisé"
    );

    remplirTexte("detailPrix", String(menu.prix));

    /* PHOTOGRAPHIES */

    const photosContainer = document.getElementById("detailPhotos");

    if (photosContainer) {
        photosContainer.replaceChildren();

        const photos = menu.galerie?.length
            ? menu.galerie
            : [menu.image];

        photos.filter(Boolean).forEach((photo, index) => {
            const image = document.createElement("img");

            image.src = photo;
            image.alt = `${menu.titre} - photo ${index + 1}`;
            image.loading = "lazy";

            photosContainer.appendChild(image);
        });
    }

    /* COMPOSITION */

    remplirListe("detailEntrees", menu.plats?.entrees);
    remplirListe("detailPrincipaux", menu.plats?.principaux);
    remplirListe("detailDesserts", menu.plats?.desserts);

    /* ALLERGÈNES */

    remplirTexte(
        "detailAllergenes",
        menu.allergenes?.length
            ? `${menu.allergenes.join(", ")} — liste complète à confirmer.`
            : "Informations sur les allergènes à confirmer."
    );

    /* CONDITIONS */

    remplirListe("detailConditions", menu.conditions);

})();