async function chargerCompte() {
    const nomUtilisateur = document.getElementById("nomUtilisateur");

    if (!nomUtilisateur) {
        return;
    }

    try {
        const response = await fetch("/api/profil", {
            method: "GET",
            credentials: "include"
        });

        console.log("Statut profil :", response.status);

        if (response.status === 401) {
            console.log("Utilisateur non connecté");
            nomUtilisateur.textContent = "Visiteur";
            return;
        }

        if (!response.ok) {
            throw new Error("Impossible de charger le profil");
        }

        const utilisateur = await response.json();

        console.log("Profil récupéré avec succès");

        nomUtilisateur.textContent =
            utilisateur.prenom || "Utilisateur";

    } catch (error) {
        console.error("Erreur chargement du compte :", error);
    }
}

chargerCompte();
