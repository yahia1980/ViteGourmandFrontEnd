
// Menu de navigation

const rightBar = document.getElementById("navbar");
const btn = document.getElementById("hamburger");

btn.addEventListener("click", () => {
   btn.classList.toggle("active");
   rightBar.classList.toggle("active");
});


const links = rightBar.querySelectorAll("a");

links.forEach(link => {
    link.addEventListener("click", () => {
        btn.classList.remove("active");
        rightBar.classList.remove("active");
    });
});

/* connexion deconnexion */

// Gestion du lien Connexion / Déconnexion

async function updateAuthLink() {
    const authLink = document.getElementById("authLink");

    if (!authLink) {
        console.error("Lien authLink introuvable");
        return;
    }

    try {
        const response = await fetch("/api/profil", {
            credentials: "include"
        });

        console.log("Statut Symfony :", response.status);

        if (response.status === 200) {
            authLink.textContent = "Déconnexion";
            authLink.href = "#";
        } else {
            authLink.textContent = "Connexion";
            authLink.href = "/connexion";
        }

    } catch (error) {
        console.error("Erreur API :", error);
        authLink.textContent = "Connexion";
        authLink.href = "/connexion";
    }
}

updateAuthLink();

// Déconnexion de l'utilisateur
document.getElementById("authLink")?.addEventListener("click", async (event) => {
    const authLink = event.currentTarget;

    // Si le lien affiche Connexion, on laisse le routeur SPA fonctionner
    if (authLink.textContent.trim() !== "Déconnexion") {
        return;
    }

    event.preventDefault();

    try {
        const response = await fetch("/api/deconnexion", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("La déconnexion a échoué");
        }

        // Vérifier la session et actualiser le lien
        await updateAuthLink();

        // Retourner à l'accueil
        window.location.href = "/";

    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
    }
});



// défilement avis clients


document.addEventListener("click", (event) => {
    const spanClique = event.target.closest(".avisRatio .ratio");

    if (!spanClique) return;

    const container = spanClique.closest(".avisContainer");
    if (!container) return;

    const spans = container.querySelectorAll(".avisRatio .ratio");
    const avis = container.querySelectorAll(".avisPersonne");

    const index = Array.from(spans).indexOf(spanClique);

    if (index < 0 || index >= avis.length) return;

    // Afficher l'avis correspondant
    avis.forEach((element, i) => {
        element.style.display = i === index ? "block" : "none";
    });

    // Changer la couleur du span sélectionné
    spans.forEach((span, i) => {
        span.style.backgroundColor =
            i === index ? "var(--bleue)" : "var(--white)";
    });
});

