console.log("TEST : espace-employe.js exécuté");
async function initialiserHorairesEmploye() {
    const formulaire = document.getElementById("formHorairesEmploye");
    console.log("Formulaire trouvé :", formulaire);
    if (!formulaire) return;

    const jourSelect = document.getElementById("jourHoraireEmploye");
    const ouvertureInput = document.getElementById("ouvertureEmploye");
    const fermetureInput = document.getElementById("fermetureEmploye");
    const fermeInput = document.getElementById("fermeEmploye");

    let horaires = [];

    async function chargerHoraires() {
        const reponse = await fetch("/api/horaires", {
    credentials: "include"
});

        if (!reponse.ok) {
            throw new Error("Impossible de charger les horaires.");
        }

        horaires = await reponse.json();
    }

    function afficherHoraireSelectionne() {
        const horaire = horaires.find(
            h => h.jour.toLowerCase() === jourSelect.value
        );

        if (!horaire) return;

        ouvertureInput.value = horaire.heureOuverture ?? "";
        fermetureInput.value = horaire.heureFermeture ?? "";
        fermeInput.checked = horaire.ferme;

        ouvertureInput.disabled = horaire.ferme;
        fermetureInput.disabled = horaire.ferme;
    }

    jourSelect.addEventListener("change", afficherHoraireSelectionne);

    fermeInput.addEventListener("change", () => {
        ouvertureInput.disabled = fermeInput.checked;
        fermetureInput.disabled = fermeInput.checked;
    });

    console.log("INSTALLATION du submit horaires");
    formulaire.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("SUBMIT horaires intercepté !");
        console.log("Formulaire horaires envoyé !");

        const horaire = horaires.find(
            h => h.jour.toLowerCase() === jourSelect.value
        );

        if (!horaire) {
            alert("Veuillez sélectionner un jour.");
            return;
        }

        const donnees = {
            ferme: fermeInput.checked,
            heureOuverture: ouvertureInput.value,
            heureFermeture: fermetureInput.value
        };

        try {
            const reponse = await fetch(
                `/api/horaires/${horaire.id}/modifier`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(donnees)
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(resultat.erreur || "Erreur d'enregistrement.");
            }

            await chargerHoraires();
            afficherHoraireSelectionne();

            alert("Horaires enregistrés avec succès !");
        } catch (erreur) {
            alert(erreur.message);
        }
    });
console.log("Submit horaires installé avec succès");
window.formulaireHorairesTest = formulaire;
    try {
        await chargerHoraires();
    } catch (erreur) {
        console.error(erreur);
    }
}
console.log("TEST : initialisation des horaires");
initialiserHorairesEmploye();