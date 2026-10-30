/* =====================================================
   DÉFILEMENT DES AVIS CLIENTS
===================================================== */

if (!window.viteGourmandAvisInstalled) {

    window.viteGourmandAvisInstalled = true;

    document.addEventListener("click", (event) => {

        const boutonClique = event.target.closest(".avisRatio .ratio");

        if (!boutonClique) return;

        const container = boutonClique.closest(".avisContainer");
        if (!container) return;

        const boutons = container.querySelectorAll(".avisRatio .ratio");
        const avis = container.querySelectorAll(".avisPersonne");

        const index = Array.from(boutons).indexOf(boutonClique);

        if (index < 0 || index >= avis.length) return;

        avis.forEach((element, i) => {
            element.style.display = i === index ? "block" : "none";
        });

        boutons.forEach((bouton, i) => {
            const actif = i === index;

            bouton.style.backgroundColor =
                actif ? "var(--bleue)" : "var(--white)";

            bouton.setAttribute("aria-pressed", String(actif));
        });
    });
}
async function chargerAvisAccueil() {
    const conteneur = document.getElementById("listeAvisAccueil");
    const navigation = document.querySelector(".avisRatio");

    if (!conteneur || !navigation) return;

    try {
        const reponse = await fetch("/api/avis/valides");

        if (!reponse.ok) {
            throw new Error(`Erreur HTTP ${reponse.status}`);
        }

        const avis = await reponse.json();

        conteneur.replaceChildren();
        navigation.replaceChildren();

        if (avis.length === 0) {
            conteneur.textContent = "Aucun avis client pour le moment.";
            return;
        }

        avis.forEach((unAvis, index) => {
            const carte = document.createElement("div");
            carte.className = `avisPersonne avisPersonne${index + 1}`;

            const commentaire = document.createElement("p");
            commentaire.textContent = `« ${unAvis.commentaire} »`;

            const note = document.createElement("span");
            note.textContent = `Note : ${unAvis.note}/5`;

            carte.append(commentaire, note);
            conteneur.appendChild(carte);

            const bouton = document.createElement("button");
            bouton.type = "button";
            bouton.className = "ratio";
            bouton.setAttribute(
                "aria-label",
                `Afficher l'avis ${index + 1}`
            );

            bouton.setAttribute(
                "aria-pressed",
                String(index === 0)
            );

            navigation.appendChild(bouton);
        });

        const cartes = conteneur.querySelectorAll(".avisPersonne");
        const boutons = navigation.querySelectorAll(".ratio");

        cartes.forEach((carte, index) => {
            carte.style.display = index === 0 ? "block" : "none";
        });

        boutons.forEach((bouton, index) => {
            bouton.style.backgroundColor =
                index === 0 ? "var(--bleue)" : "var(--white)";
        });

    } catch (erreur) {
        console.error("Erreur chargement avis :", erreur);
        conteneur.textContent = "Impossible de charger les avis.";
    }
}

chargerAvisAccueil();
