
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

/* =====================================================
   AUTHENTIFICATION - VITE & GOURMAND
===================================================== */

if (!window.viteGourmandAuthInstalled) {

    window.viteGourmandAuthInstalled = true;

    // Vérifier si l'utilisateur est connecté
    async function verifierConnexion() {

        const authLink = document.getElementById("authLink");

        if (!authLink) return;

        try {

            const response = await fetch("/api/profil", {
                method: "GET",
                credentials: "include"
            });

            if (response.ok) {

                authLink.textContent = "Déconnexion";
                authLink.setAttribute("href", "/deconnexion");

            } else {

                authLink.textContent = "Connexion";
                authLink.setAttribute("href", "/connexion");

            }

        } catch (error) {

            console.error("Erreur vérification connexion :", error);

            authLink.textContent = "Connexion";
            authLink.setAttribute("href", "/connexion");

        }
    }

    // Gérer la déconnexion
document.addEventListener("click", async (event) => {
    const authLink = event.target.closest("#authLink");

    if (!authLink || authLink.getAttribute("href") !== "/deconnexion") {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
        const response = await fetch("/api/deconnexion", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        // Actualiser le lien
        authLink.textContent = "Connexion";
        authLink.href = "/connexion";

        // Naviguer dans la SPA
        window.history.pushState({}, "", "/connexion");
        window.dispatchEvent(new PopStateEvent("popstate"));

    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
    }
}, true);


    // Vérification initiale
    verifierConnexion();

}
// Afficher / masquer les mots de passe
document.addEventListener("click", (event) => {

    const bouton = event.target.closest(".togglePassword");

    if (!bouton) return;

    const champ = bouton
        .closest(".passwordField")
        ?.querySelector("input");

    if (!champ) return;

    const estMasque = champ.type === "password";

    champ.type = estMasque ? "text" : "password";

    const icone = bouton.querySelector("i");

    if (icone) {
        icone.classList.toggle("fa-eye", !estMasque);
        icone.classList.toggle("fa-eye-slash", estMasque);
    }

    bouton.setAttribute(
        "aria-label",
        estMasque ? "Masquer le mot de passe" : "Afficher le mot de passe"
    );

    bouton.setAttribute("aria-pressed", String(estMasque));
});