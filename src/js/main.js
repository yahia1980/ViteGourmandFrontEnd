
/* =====================================================
   MENU DE NAVIGATION
===================================================== */

const rightBar = document.getElementById("navbar");
const btn = document.getElementById("hamburger");

if (rightBar && btn && !btn.dataset.menuInitialise) {
    btn.dataset.menuInitialise = "true";

    btn.addEventListener("click", () => {
        btn.classList.toggle("active");
        rightBar.classList.toggle("active");

        btn.setAttribute(
            "aria-expanded",
            String(rightBar.classList.contains("active"))
        );
    });

    const links = rightBar.querySelectorAll("a");

    links.forEach(link => {
        link.addEventListener("click", () => {
            btn.classList.remove("active");
            rightBar.classList.remove("active");
            btn.setAttribute("aria-expanded", "false");
        });
    });
}





/* =====================================================
   AUTHENTIFICATION - VITE & GOURMAND
===================================================== */

if (!window.viteGourmandAuthInstalled) {

    window.viteGourmandAuthInstalled = true;

    function definirLienCompte(roles) {
        const lienCompte = document.getElementById("lienCompte");

        if (!lienCompte) return;

        if (!Array.isArray(roles)) {
            lienCompte.href = "/compte";
            lienCompte.classList.add("disabled");
            lienCompte.setAttribute("aria-disabled", "true");
            lienCompte.tabIndex = -1;
            return;
        }

        let destination = "/compte";

        if (roles.includes("ROLE_ADMIN")) {
            destination = "/espace-admin";
        } else if (roles.includes("ROLE_EMPLOYE")) {
            destination = "/espace-employe";
        }

        lienCompte.href = destination;
        lienCompte.classList.remove("disabled");
        lienCompte.setAttribute("aria-disabled", "false");
        lienCompte.tabIndex = 0;
    }

    async function verifierConnexion() {
        const authLink = document.getElementById("authLink");

        try {
            const response = await fetch("/api/api/profil", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                if (authLink) {
                    authLink.textContent = "Connexion";
                    authLink.href = "/connexion";
                }

                definirLienCompte(null);
                return;
            }

            const profil = await response.json();

            if (authLink) {
                authLink.textContent = "Déconnexion";
                authLink.href = "/deconnexion";
            }

            definirLienCompte(profil.roles);

        } catch (error) {
            console.error(
                "Erreur vérification connexion :",
                error
            );

            if (authLink) {
                authLink.textContent = "Connexion";
                authLink.href = "/connexion";
            }

            definirLienCompte(null);
        }
    }

    // Déconnexion
    document.addEventListener("click", async (event) => {
        const authLink = event.target.closest("#authLink");

        if (!authLink ||
            authLink.getAttribute("href") !== "/deconnexion") {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        try {
            const response = await fetch("/api/api/deconnexion", {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(
                    `Erreur HTTP : ${response.status}`
                );
            }

            authLink.textContent = "Connexion";
            authLink.href = "/connexion";

            definirLienCompte(null);

            if (rightBar && btn) {
                rightBar.classList.remove("active");
                btn.classList.remove("active");
                btn.setAttribute("aria-expanded", "false");
            }

            window.history.pushState({}, "", "/connexion");
            window.dispatchEvent(
                new PopStateEvent("popstate")
            );

        } catch (error) {
            console.error(
                "Erreur lors de la déconnexion :",
                error
            );
        }
    }, true);

    // Vérification initiale
    verifierConnexion();

    // Actualisation après les changements de page SPA
    window.addEventListener("popstate", verifierConnexion);

    // Fonction disponible pour actualiser les liens après connexion
    window.verifierConnexionViteGourmand = verifierConnexion;
}


/* =====================================================
   AFFICHER / MASQUER LES MOTS DE PASSE
===================================================== */

if (!window.viteGourmandPasswordToggleInstalled) {

    window.viteGourmandPasswordToggleInstalled = true;

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
            estMasque
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
        );

        bouton.setAttribute(
            "aria-pressed",
            String(estMasque)
        );
    });
}

