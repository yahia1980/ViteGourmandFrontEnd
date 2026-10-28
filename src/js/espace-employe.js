
console.log("TEST : espace-employe.js exécuté");

/* ==========================================
   GESTION DES HORAIRES EMPLOYÉ
========================================== */

async function initialiserHorairesEmploye() {
    const formulaire = document.getElementById("formHorairesEmploye");

    console.log("Formulaire horaires trouvé :", formulaire);

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

    jourSelect.addEventListener(
        "change",
        afficherHoraireSelectionne
    );

    fermeInput.addEventListener("change", () => {
        ouvertureInput.disabled = fermeInput.checked;
        fermetureInput.disabled = fermeInput.checked;
    });

    formulaire.addEventListener("submit", async (event) => {
        event.preventDefault();

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
                throw new Error(
                    resultat.erreur || "Erreur d'enregistrement."
                );
            }

            await chargerHoraires();
            afficherHoraireSelectionne();

            alert("Horaires enregistrés avec succès!");

        } catch (erreur) {
            console.error("Erreur horaires :", erreur);
            alert(erreur.message);
        }
    });

    try {
        await chargerHoraires();
        afficherHoraireSelectionne();
    } catch (erreur) {
        console.error("Erreur chargement horaires :", erreur);
    }
}


/* ==========================================
   GESTION DES COMMANDES EMPLOYÉ
========================================== */

async function initialiserCommandesEmploye() {
    const tableau = document.getElementById("listeCommandesEmploye");
    const recherche = document.getElementById("rechercheCommandeEmploye");
    const filtreStatut = document.getElementById("statutCommandeEmploye");
    const formulaire = document.getElementById("formModificationCommande");

    if (!tableau) {
        console.warn("Tableau des commandes introuvable.");
        return;
    }

    let commandes = [];

    /* ==========================================
       CRÉATION DES CELLULES
    ========================================== */

    function creerCellule(ligne, valeur) {
        const cellule = document.createElement("td");

        cellule.textContent = valeur ?? "—";

        ligne.appendChild(cellule);

        return cellule;
    }

    /* ==========================================
       MISE À JOUR DES COMPTEURS
    ========================================== */

    function mettreAJourCompteurs() {
        const compteurs = {
            compteurEnAttente: commandes.filter(
                commande => commande.statut === "en_attente"
            ).length,

            compteurAcceptees: commandes.filter(
                commande => commande.statut === "acceptee"
            ).length,

            compteurEnCours: commandes.filter(
                commande => [
                    "en_preparation",
                    "en_livraison",
                    "livree",
                    "en_attente_retour_materiel"
                ].includes(commande.statut)
            ).length,

            compteurTerminees: commandes.filter(
                commande => commande.statut === "terminee"
            ).length
        };

        Object.entries(compteurs).forEach(([id, valeur]) => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = valeur;
            }
        });

        console.log("Compteurs actualisés :", compteurs);
    }

    /* ==========================================
       AFFICHAGE DES COMMANDES
    ========================================== */

    function afficherCommandes() {
        const texteRecherche = (recherche?.value ?? "")
            .trim()
            .toLowerCase();

        const statutRecherche = filtreStatut?.value ?? "";

        const commandesFiltrees = commandes.filter(commande => {
            const texteCommande = [
                commande.id,
                commande.nomClient,
                commande.prenomClient,
                commande.emailClient,
                commande.menu,
                commande.villeLivraison,
                commande.adresseLivraison
            ]
                .filter(valeur => valeur != null)
                .join(" ")
                .toLowerCase();

            const correspondRecherche =
                texteCommande.includes(texteRecherche);

            const correspondStatut =
                !statutRecherche ||
                statutRecherche === "tous" ||
                commande.statut === statutRecherche;

            return correspondRecherche && correspondStatut;
        });

        tableau.replaceChildren();

        if (commandesFiltrees.length === 0) {
            const ligne = document.createElement("tr");
            const cellule = document.createElement("td");

            cellule.colSpan = 6;
            cellule.textContent = "Aucune commande trouvée.";

            ligne.appendChild(cellule);
            tableau.appendChild(ligne);

            return;
        }

        commandesFiltrees.forEach(commande => {
            const ligne = document.createElement("tr");

            // Référence
            creerCellule(ligne, `CMD-${commande.id}`);

            // Client
            const nomComplet = [
                commande.prenomClient,
                commande.nomClient
            ]
                .filter(Boolean)
                .join(" ");

            const celluleClient = creerCellule(
                ligne,
                nomComplet || "Client inconnu"
            );

            // Email du client
            if (commande.emailClient) {
                const email = document.createElement("small");

                email.classList.add("commandeEmail");
                email.textContent = commande.emailClient;

                celluleClient.appendChild(email);
            }

            // Menu
            creerCellule(ligne, commande.menu);

            // Date de prestation
            creerCellule(ligne, commande.datePrestation);

            // Statut
            const celluleStatut = creerCellule(ligne, "");
            const badge = document.createElement("span");

            badge.className = `commandeStatut ${commande.statut}`;

            const libelles = {
                en_attente: "En attente",
                acceptee: "Acceptée",
                en_preparation: "En préparation",
                en_livraison: "En livraison",
                livree: "Livrée",
                en_attente_retour_materiel: "Retour matériel",
                terminee: "Terminée",
                annulee: "Annulée"
            };

            badge.textContent =
                libelles[commande.statut] ?? commande.statut;

            celluleStatut.appendChild(badge);

            // Action
            const celluleAction = document.createElement("td");
            const bouton = document.createElement("button");

            bouton.type = "button";
            bouton.className = "btnModifierCommande";
            bouton.textContent = "Modifier";

            bouton.addEventListener("click", () => {
                const idInput = document.getElementById(
                    "commandeIdEmploye"
                );

                const statutInput = document.getElementById(
                    "nouveauStatutEmploye"
                );

                if (idInput) {
                    idInput.value = commande.id;
                }

                if (statutInput) {
                    statutInput.value = "";
                }

                formulaire?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });

            celluleAction.appendChild(bouton);
            ligne.appendChild(celluleAction);

            tableau.appendChild(ligne);
        });
    }

    /* ==========================================
       CHARGEMENT DES COMMANDES
    ========================================== */

    async function chargerCommandes() {
        try {
            const reponse = await fetch(
                "/api/employe/commandes",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!reponse.ok) {
                throw new Error(
                    `Impossible de charger les commandes : HTTP ${reponse.status}`
                );
            }

            const resultat = await reponse.json();

            commandes = Array.isArray(resultat.commandes)
                ? resultat.commandes
                : [];

            // Actualiser le tableau
            afficherCommandes();

            // Actualiser les quatre compteurs
            mettreAJourCompteurs();

            console.log(
                `${commandes.length} commandes chargées.`
            );

        } catch (erreur) {
            console.error("Erreur commandes :", erreur);
        }
    }

    /* ==========================================
       RECHERCHE ET FILTRES
    ========================================== */

    recherche?.addEventListener("input", afficherCommandes);

    filtreStatut?.addEventListener(
        "change",
        afficherCommandes
    );

    /* ==========================================
       MODIFICATION DU STATUT
    ========================================== */

    formulaire?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const commandeId = document.getElementById(
            "commandeIdEmploye"
        )?.value;

        const nouveauStatut = document.getElementById(
            "nouveauStatutEmploye"
        )?.value;

        if (!commandeId || !nouveauStatut) {
            alert("Sélectionne une commande et un statut.");
            return;
        }

        const commande = commandes.find(
            c => String(c.id) === String(commandeId)
        );

        if (!commande) {
            alert("Commande introuvable.");
            return;
        }

        if (commande.statut === nouveauStatut) {
            alert(
                "Le statut sélectionné est déjà celui de la commande."
            );
            return;
        }

        const bouton = formulaire.querySelector(
            '[type="submit"]'
        );

        if (bouton) {
            bouton.disabled = true;
        }

        try {
            console.log("ID commande envoyé :", commandeId);
            console.log(
                "Statut envoyé à Symfony :",
                JSON.stringify(nouveauStatut)
            );

            const reponse = await fetch(
                `/api/employe/commandes/${encodeURIComponent(commandeId)}/statut`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        statut: nouveauStatut
                    })
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.message || "Modification impossible."
                );
            }

            alert(
                "Le statut de la commande a été enregistré !"
            );

            formulaire.reset();

            // Recharge les commandes et les compteurs
            await chargerCommandes();

        } catch (erreur) {
            console.error(
                "Erreur modification commande :",
                erreur
            );

            alert(erreur.message);

        } finally {
            if (bouton) {
                bouton.disabled = false;
            }
        }
    });

    /* ==========================================
       INITIALISATION DES COMMANDES
    ========================================== */

    await chargerCommandes();
}


/* ==========================================
   DÉMARRAGE DE L'ESPACE EMPLOYÉ
========================================== */

initialiserCommandesEmploye();

initialiserHorairesEmploye();
