console.log("connexion.js est bien chargé !");

const formConnexion = document.getElementById("formConnexion");

if (formConnexion) {
  formConnexion.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/connexion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });
      console.log("URL appelée :", response.url);
      console.log("Statut HTTP :", response.status);
      console.log("Redirection HTTP :", response.redirected);

      console.log("Statut connexion :", response.status);

      if (response.ok) {
        console.log("Connexion réussie !");

        const profilResponse = await fetch("/api/profil", {
          credentials: "include",
        });

        if (!profilResponse.ok) {
          console.error("Impossible de récupérer le profil.");
          return;
        }

        const profil = await profilResponse.json();

        console.log("Profil connecté :", profil);

        const roles = profil.roles;

        if (!Array.isArray(roles)) {
          console.error("Les rôles sont absents du profil.");
          return;
        }

        if (roles.includes("ROLE_ADMIN")) {
          window.location.href = "/espace-admin";
        } else if (roles.includes("ROLE_EMPLOYE")) {
          window.location.href = "/espace-employe";
        } else {
          window.location.href = "/compte";
        }
      } else {
        const erreur = await response.text();
        console.error("Réponse Symfony :", erreur);
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  });
} else {
  console.error("Formulaire de connexion introuvable !");
}
