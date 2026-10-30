console.log("footer.js est bien chargé");
const conteneur = document.getElementById("horairesFooter");
console.log("Conteneur horaires :", conteneur);
async function chargerHorairesFooter() {
    const conteneur = document.getElementById("horairesFooter");

    if (!conteneur) return;

    try {
        const reponse = await fetch("/api/horaires");

        if (!reponse.ok) {
            throw new Error("Impossible de charger les horaires.");
        }

        const horaires = await reponse.json();

        conteneur.replaceChildren();

        if (horaires.length === 0) {
            conteneur.textContent = "Horaires non disponibles.";
            return;
        }

        for (const horaire of horaires) {
            const ligne = document.createElement("p");

            if (horaire.ferme) {
                ligne.textContent = `${horaire.jour} : Fermé`;
            } else {
                ligne.textContent =
                    `${horaire.jour} : ${horaire.heureOuverture} - ${horaire.heureFermeture}`;
            }

            conteneur.appendChild(ligne);
        }

    } catch (erreur) {
        console.error("Erreur horaires footer :", erreur);
        conteneur.textContent = "Horaires indisponibles.";
    }
}

chargerHorairesFooter();