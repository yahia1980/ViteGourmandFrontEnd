
/* ==========================================
   VITE & GOURMAND
   MODIFICATION DU PROFIL UTILISATEUR
========================================== */

async function chargerProfilUtilisateur() {

    const formulaire = document.getElementById("formModifierProfil");
    const message = document.getElementById("messageModifierProfil");

    if (!formulaire) {
        return;
    }

    try {

        const response = await fetch("/api/api/profil", {
            method: "GET",
            credentials: "include"
        });

        if (response.status === 401) {
            if (message) {
                message.className = "erreur";
                message.textContent =
                    "Vous devez être connecté pour modifier votre profil.";
            }
            return;
        }

        if (!response.ok) {
            throw new Error("Impossible de charger votre profil.");
        }

        const utilisateur = await response.json();

        /* REMPLIR AUTOMATIQUEMENT LE FORMULAIRE */

        document.getElementById("profilPrenom").value =
            utilisateur.prenom ?? "";

        document.getElementById("profilNom").value =
            utilisateur.nom ?? "";

        document.getElementById("profilEmail").value =
            utilisateur.email ?? "";

        document.getElementById("profilTelephone").value =
            utilisateur.telephone ?? "";

        document.getElementById("profilAdresse").value =
            utilisateur.adresse ?? "";

        document.getElementById("profilCodePostal").value =
            utilisateur.codePostal ?? "";

        document.getElementById("profilVille").value =
            utilisateur.ville ?? "";

    } catch (error) {

        console.error("Erreur chargement profil :", error);

        if (message) {
            message.className = "erreur";
            message.textContent = error.message;
        }
    }
}


/* ==========================================
   ENREGISTRER LES MODIFICATIONS
========================================== */

function initialiserModificationProfil() {

    const formulaire = document.getElementById("formModifierProfil");
    const message = document.getElementById("messageModifierProfil");
    const bouton = document.getElementById("btnEnregistrerProfil");

    if (!formulaire || !bouton) {
        return;
    }

    formulaire.addEventListener("submit", async (event) => {

        event.preventDefault();

        /* RÉCUPÉRER LES INFORMATIONS */

        const donnees = {
            prenom: document.getElementById("profilPrenom").value.trim(),
            nom: document.getElementById("profilNom").value.trim(),
            email: document.getElementById("profilEmail").value.trim(),
            telephone: document.getElementById("profilTelephone").value.trim(),
            adresse: document.getElementById("profilAdresse").value.trim(),
            codePostal: document.getElementById("profilCodePostal").value.trim(),
            ville: document.getElementById("profilVille").value.trim()
        };

        /* VÉRIFIER LES CHAMPS */

        if (Object.values(donnees).some(valeur => valeur === "")) {

            if (message) {
                message.className = "erreur";
                message.textContent =
                    "Veuillez renseigner tous les champs.";
            }

            return;
        }

        bouton.disabled = true;
        bouton.textContent = "Enregistrement en cours...";

        if (message) {
            message.textContent = "";
            message.className = "";
        }

        try {

            const response = await fetch("/api/api/profil", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(donnees)
            });

            const resultat = await response.json();

            if (!response.ok) {
                throw new Error(
                    resultat.message ||
                    "Impossible de modifier votre profil."
                );
            }

            /* CONFIRMATION */

            if (message) {
                message.className = "succes";
                message.textContent =
                    resultat.message || "Profil modifié avec succès.";
            }

        } catch (error) {

            console.error("Erreur modification profil :", error);

            if (message) {
                message.className = "erreur";
                message.textContent = error.message;
            }

        } finally {

            bouton.disabled = false;
            bouton.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Enregistrer les modifications';
        }
    });
}


/* ==========================================
   INITIALISATION
========================================== */

chargerProfilUtilisateur();
initialiserModificationProfil();
