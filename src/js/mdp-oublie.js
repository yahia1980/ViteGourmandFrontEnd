
// Gestion du formulaire "Mot de passe oublié"
// Compatible avec le chargement dynamique des pages SPA.

if (!window.viteGourmandMdpOublieInstalled) {
    window.viteGourmandMdpOublieInstalled = true;

    document.addEventListener("submit", async (event) => {
        if (event.target.id !== "formMdpOublie") return;

        event.preventDefault();

        const form = event.target;
        const email = form.querySelector('[name="email"]');
        const message = document.getElementById("messageMdpOublie");
        const bouton = form.querySelector('button[type="submit"]');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!message || !email) return;

        message.textContent = "";
        bouton.disabled = true;

        try {
            const response = await fetch("/api/mot-de-passe-oublie", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.value.trim()
                })
            });

            const data = await response.json();

            message.textContent = data.message ||
                "Une erreur est survenue.";

            if (response.ok) {
                form.reset();
            }
        } catch (error) {
            console.error("Erreur mot de passe oublié :", error);

            message.textContent =
                "Impossible de contacter le serveur.";
        } finally {
            bouton.disabled = false;
        }
    });
}
function afficherErreurLienMdp() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("erreur") !== "lien_invalide") {
        return;
    }

    const message = document.getElementById("messageMdpOublie");

    if (!message) {
        return;
    }

    message.textContent =
        "Votre lien de réinitialisation est invalide ou expiré. Veuillez effectuer une nouvelle demande.";

    message.style.color = "red";
}

afficherErreurLienMdp();