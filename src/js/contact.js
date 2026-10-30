// Gestion des formulaires de contact
document.addEventListener("submit", async function (event) {

    const formulaire = event.target;

    // Vérifier que c'est un formulaire de contact
    if (!formulaire.matches(".formulaireMessage")) {
        return;
    }

    event.preventDefault();

    // Récupérer les informations
    const donnees = new FormData(formulaire);

    const message = {
        prenom: donnees.get("prenom").trim(),
        nom: donnees.get("nom").trim(),
        email: donnees.get("email").trim(),
        message: donnees.get("message").trim()
    };

    // Vérifier les champs
    if (
        !message.prenom ||
        !message.nom ||
        !message.email ||
        !message.message
    ) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const bouton = formulaire.querySelector('button[type="submit"]');

    if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "Envoi en cours...";
    }

    try {

        const response = await fetch("/api/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message)
        });

        const resultat = await response.json();

        if (!response.ok) {
            throw new Error(resultat.message || "Erreur lors de l'envoi.");
        }

        alert("Votre message a bien été envoyé.");

        formulaire.reset();

    } catch (error) {

        alert(error.message);

    } finally {

        if (bouton) {
            bouton.disabled = false;
            bouton.textContent = "Envoyer";
        }

    }

});