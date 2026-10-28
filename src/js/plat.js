
function initialiserGestionPlats() {
    const API_PLATS = "/api/plats";

    const listePlats = document.getElementById("listePlatsAdmin");
    const messageGestion = document.getElementById("messageGestionPlats");

    if (!listePlats) return;

    // Évite une double initialisation dans la SPA.
    if (listePlats.dataset.initialise === "true") return;
    listePlats.dataset.initialise = "true";

    function afficherMessageTableau(message) {
        listePlats.replaceChildren();

        const ligne = document.createElement("tr");
        const cellule = document.createElement("td");

        cellule.colSpan = 4;
        cellule.textContent = message;

        ligne.appendChild(cellule);
        listePlats.appendChild(ligne);
    }

    async function chargerPlats() {
        afficherMessageTableau("Chargement des plats...");

        try {
            const reponse = await fetch(API_PLATS, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            if (!reponse.ok) {
                throw new Error(`Erreur HTTP ${reponse.status}`);
            }

            const donnees = await reponse.json();

            const plats = Array.isArray(donnees)
                ? donnees
                : donnees.plats;

            if (!Array.isArray(plats)) {
                throw new Error("Format de réponse inattendu.");
            }

            listePlats.replaceChildren();

            if (plats.length === 0) {
                afficherMessageTableau("Aucun plat enregistré.");
                return;
            }

            plats.forEach((plat) => {
                const ligne = document.createElement("tr");

                const celluleNom = document.createElement("td");
                celluleNom.textContent = plat.nom;

                const celluleCategorie = document.createElement("td");
                celluleCategorie.textContent = plat.categorie;

                const celluleDescription = document.createElement("td");
                celluleDescription.textContent = plat.description ?? "—";

                const celluleActions = document.createElement("td");

                const boutonModifier = document.createElement("button");
                boutonModifier.type = "button";
                boutonModifier.className = "employeBouton";
                boutonModifier.textContent = "Modifier";
                boutonModifier.dataset.id = plat.id;

                const boutonSupprimer = document.createElement("button");
                boutonSupprimer.type = "button";
                boutonSupprimer.className = "employeBouton employeBoutonDanger";
                boutonSupprimer.textContent = "Supprimer";
                boutonSupprimer.dataset.id = plat.id;

                celluleActions.append(
                    boutonModifier,
                    boutonSupprimer
                );

                ligne.append(
                    celluleNom,
                    celluleCategorie,
                    celluleDescription,
                    celluleActions
                );

                listePlats.appendChild(ligne);
            });

            if (messageGestion) {
                messageGestion.textContent = "";
            }

        } catch (erreur) {
            afficherMessageTableau(
                "Impossible de charger les plats."
            );

            if (messageGestion) {
                messageGestion.textContent = erreur.message;
            }

            console.error("Erreur chargement plats :", erreur);
        }
    }

    // ========================================
    // AJOUTER UN PLAT
    // ========================================

    const formulaireAjout = document.getElementById("formAjoutPlat");
    const messageAjout = document.getElementById("messageAjoutPlat");

    if (formulaireAjout) {
        formulaireAjout.addEventListener("submit", async (event) => {
            event.preventDefault();

            const donnees = {
                nom: document.getElementById("ajoutPlatNom").value.trim(),
                categorie: document.getElementById("ajoutPlatCategorie").value,
                description: document.getElementById("ajoutPlatDescription").value.trim()
            };

            if (!donnees.nom || !donnees.categorie) {
                messageAjout.textContent = "Veuillez remplir les champs obligatoires.";
                return;
            }

            const bouton = formulaireAjout.querySelector('button[type="submit"]');
            bouton.disabled = true;

            try {
                const reponse = await fetch(API_PLATS, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(donnees)
                });

                if (!reponse.ok) {
                    throw new Error(`Erreur HTTP ${reponse.status}`);
                }

                messageAjout.textContent = "Plat ajouté avec succès !";

                formulaireAjout.reset();

                await chargerPlats();

            } catch (erreur) {
                messageAjout.textContent = `Erreur lors de l'ajout : ${erreur.message}`;
                console.error("Erreur ajout plat :", erreur);
            } finally {
                bouton.disabled = false;
            }
        });
    }

    // ========================================
    // MODIFIER ET SUPPRIMER UN PLAT
    // ========================================

    const blocModification = document.getElementById("blocModificationPlat");
    const formulaireModification = document.getElementById("formModificationPlat");
    const messageModification = document.getElementById("messageModificationPlat");

    const boutonAnnulerModification = document.getElementById("annulerModificationPlat");

    const dialogSuppression = document.getElementById("dialogSuppressionPlat");
    const nomPlatASupprimer = document.getElementById("nomPlatASupprimer");
    const boutonConfirmerSuppression = document.getElementById("confirmerSuppressionPlat");
    const boutonAnnulerSuppression = document.getElementById("annulerSuppressionPlat");

    let idPlatASupprimer = null;

    // Gestion des clics sur Modifier et Supprimer
    listePlats.addEventListener("click", async (event) => {
        const bouton = event.target.closest("button[data-id]");

        if (!bouton || !listePlats.contains(bouton)) return;

        const id = bouton.dataset.id;
        const ligne = bouton.closest("tr");

        if (!id || !ligne) return;

        // Récupération des informations affichées dans le tableau
        const cellules = ligne.querySelectorAll("td");

        const nom = cellules[0].textContent.trim();
        const categorie = cellules[1].textContent.trim();
        const description = cellules[2].textContent.trim();

        // MODIFICATION
        if (bouton.textContent.trim() === "Modifier") {
            document.getElementById("modifPlatId").value = id;
            document.getElementById("modifPlatNom").value = nom;
            document.getElementById("modifPlatCategorie").value = categorie;
            document.getElementById("modifPlatDescription").value =
                description === "—" ? "" : description;

            messageModification.textContent = "";
            blocModification.hidden = false;

            blocModification.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        // SUPPRESSION
        if (bouton.textContent.trim() === "Supprimer") {
            idPlatASupprimer = id;
            nomPlatASupprimer.textContent = nom;

            dialogSuppression.showModal();
        }
    });

    // ENREGISTRER LA MODIFICATION
    formulaireModification.addEventListener("submit", async (event) => {
        event.preventDefault();

        const id = document.getElementById("modifPlatId").value;

        const donnees = {
            nom: document.getElementById("modifPlatNom").value.trim(),
            categorie: document.getElementById("modifPlatCategorie").value,
            description: document.getElementById("modifPlatDescription").value.trim()
        };

        const bouton = formulaireModification.querySelector('button[type="submit"]');
        bouton.disabled = true;

        try {
            const reponse = await fetch(
                `${API_PLATS}/${encodeURIComponent(id)}/modifier`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(donnees)
                }
            );

            if (!reponse.ok) {
                throw new Error(`Erreur HTTP ${reponse.status}`);
            }

            messageModification.textContent = "Plat modifié avec succès !";

            await chargerPlats();

            blocModification.hidden = true;
            formulaireModification.reset();

            messageGestion.textContent = "Plat modifié avec succès !";

        } catch (erreur) {
            messageModification.textContent =
                `Erreur lors de la modification : ${erreur.message}`;

            console.error("Erreur modification plat :", erreur);
        } finally {
            bouton.disabled = false;
        }
    });

    // ANNULER LA MODIFICATION
    boutonAnnulerModification.addEventListener("click", () => {
        formulaireModification.reset();
        blocModification.hidden = true;
        messageModification.textContent = "";
    });

    // CONFIRMER LA SUPPRESSION
    boutonConfirmerSuppression.addEventListener("click", async () => {
        if (!idPlatASupprimer) return;

        boutonConfirmerSuppression.disabled = true;

        try {
            const reponse = await fetch(
                `${API_PLATS}/${encodeURIComponent(idPlatASupprimer)}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!reponse.ok) {
                throw new Error(`Erreur HTTP ${reponse.status}`);
            }

            dialogSuppression.close();
            idPlatASupprimer = null;

            await chargerPlats();

            messageGestion.textContent = "Plat supprimé avec succès !";

        } catch (erreur) {
            messageGestion.textContent =
                `Erreur lors de la suppression : ${erreur.message}`;

            dialogSuppression.close();

            console.error("Erreur suppression plat :", erreur);
        } finally {
            boutonConfirmerSuppression.disabled = false;
        }
    });

    // ANNULER LA SUPPRESSION
    boutonAnnulerSuppression.addEventListener("click", () => {
        dialogSuppression.close();
        idPlatASupprimer = null;
    });



    chargerPlats();
}

initialiserGestionPlats();
