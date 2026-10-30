
/*
 * VITE & GOURMAND
 * Inscription utilisateur
 */

(() => {
    "use strict";

    // Évite d'installer plusieurs fois les événements
    // lorsque le routeur SPA recharge la page.
    if (window.viteGourmandInscriptionInstalled) return;

    window.viteGourmandInscriptionInstalled = true;

    document.addEventListener("submit", async (event) => {

        const form = event.target;

        if (!(form instanceof HTMLFormElement)) return;
        if (form.id !== "formInscription") return;

        // Le script commun valide le formulaire en phase
        // de capture. Si la validation a échoué, ne rien envoyer.
        if (event.defaultPrevented) return;

        event.preventDefault();

        const message = form.querySelector("#messageInscription");
        const bouton = form.querySelector("#submitForm");

        if (!message || !bouton) return;

        message.textContent = "";
        message.removeAttribute("data-etat");

        const donnees = {
            nom: form.elements.namedItem("nom").value.trim(),
            prenom: form.elements.namedItem("prenom").value.trim(),
            email: form.elements.namedItem("email").value.trim(),
            telephone: form.elements.namedItem("tel").value.trim(),
            adresse: form.elements.namedItem("address").value.trim(),
            codePostal: form.elements.namedItem("postale").value.trim(),
            ville: form.elements.namedItem("ville").value.trim(),
            password: form.elements.namedItem("mdp").value
        };

        // Vérification supplémentaire de la confirmation.
        const confirmation =
            form.elements.namedItem("confirmMdp").value;

        if (donnees.password !== confirmation) {
            message.textContent =
                "Les mots de passe ne correspondent pas.";
            message.dataset.etat = "erreur";
            return;
        }

        bouton.disabled = true;
        bouton.textContent = "Inscription en cours...";

        try {
            const reponse = await fetch("/api/api/inscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(donnees)
            });

            const resultat = await reponse.json();

            if (!reponse.ok) {
                message.textContent =
                    resultat.message || "L'inscription a échoué.";

                message.dataset.etat = "erreur";
                return;
            }

            message.textContent =
                resultat.message || "Inscription réussie.";

            message.dataset.etat = "succes";

            form.reset();

            // On ne redirige pas automatiquement pour
            // laisser le temps de vérifier le résultat.
            // La redirection vers /connexion sera ajoutée
            // après notre premier test réussi.
        setTimeout(() => {
            window.location.href = "/connexion";
        }, 2000);

        } catch (erreur) {
            console.error("Erreur inscription :", erreur);

            message.textContent =
                "Impossible de contacter le serveur. Réessayez.";

            message.dataset.etat = "erreur";

        } finally {
            bouton.disabled = false;
            bouton.textContent = "S'inscrire";
        }
    });

})();
