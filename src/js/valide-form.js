
document.addEventListener("DOMContentLoaded", () => {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
        form.setAttribute("novalidate", "");

        form.addEventListener("submit", (event) => {
            let formIsValid = true;

            // Supprimer les anciennes erreurs
            form.querySelectorAll(".validation-error").forEach((error) => {
                error.remove();
            });

            form.querySelectorAll(".is-invalid").forEach((field) => {
                field.classList.remove("is-invalid");
            });

            const fields = form.querySelectorAll(
                "input:not([type='submit']):not([type='button']):not([type='reset']), select, textarea"
            );

            fields.forEach((field) => {
                const value = field.value.trim();
                let message = "";

                // Champ obligatoire
                if (field.required && value === "") {
                    message = "Ce champ est obligatoire.";
                }

                // Adresse e-mail
                else if (
                    field.type === "email" &&
                    value !== "" &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ) {
                    message = "Veuillez saisir une adresse e-mail valide.";
                }

                // Téléphone français
                else if (
                    field.type === "tel" &&
                    value !== "" &&
                    !/^(?:(?:\+33|0033)\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/.test(value)
                ) {
                    message = "Veuillez saisir un numéro de téléphone valide.";
                }

                // Code postal français
                else if (
                    (field.name === "postale" ||
                        field.id === "postale" ||
                        field.name === "codePostal") &&
                    value !== "" &&
                    !/^\d{5}$/.test(value)
                ) {
                    message = "Le code postal doit contenir 5 chiffres.";
                }

                // Longueur minimale
                else if (
                    field.minLength > 0 &&
                    value !== "" &&
                    value.length < field.minLength
                ) {
                    message = `Saisissez au moins ${field.minLength} caractères.`;
                }

                // Longueur maximale
                else if (
                    field.maxLength > 0 &&
                    value.length > field.maxLength
                ) {
                    message = `Saisissez au maximum ${field.maxLength} caractères.`;
                }

                // Règles du mot de passe lors de l'inscription
                else if (
                    field.type === "password" &&
                    value !== "" &&
                    (
                        field.name === "mdp" ||
                        field.id === "password" ||
                        field.hasAttribute("data-validate-password")
                    )
                ) {
                    if (value.length < 10) {
                        message = "Le mot de passe doit contenir au moins 10 caractères.";
                    } else if (!/[A-Z]/.test(value)) {
                        message = "Ajoutez au moins une lettre majuscule.";
                    } else if (!/[a-z]/.test(value)) {
                        message = "Ajoutez au moins une lettre minuscule.";
                    } else if (!/\d/.test(value)) {
                        message = "Ajoutez au moins un chiffre.";
                    } else if (!/[^A-Za-z0-9]/.test(value)) {
                        message = "Ajoutez au moins un caractère spécial.";
                    }
                }

                // Vérification de la confirmation du mot de passe
                if (
                    message === "" &&
                    field.type === "password" &&
                    (
                        field.id === "confirmPassword" ||
                        field.name === "confirmMdp"
                    ) &&
                    value !== ""
                ) {
                    const passwordField =
                        form.querySelector("#password") ||
                        form.querySelector("[name='mdp']");

                    if (passwordField && value !== passwordField.value) {
                        message = "Les deux mots de passe ne correspondent pas.";
                    }
                }

                // Afficher l'erreur
                if (message !== "") {
                    formIsValid = false;
                    field.classList.add("is-invalid");

                    const error = document.createElement("small");
                    error.className = "validation-error";
                    error.textContent = message;
                    error.style.color = "#d93025";
                    error.style.display = "block";
                    error.style.marginTop = "5px";
                    error.style.fontSize = "0.85rem";

                    field.insertAdjacentElement("afterend", error);
                }
            });

            if (!formIsValid) {
                event.preventDefault();

                const firstInvalidField = form.querySelector(".is-invalid");

                if (firstInvalidField) {
                    firstInvalidField.focus();
                    firstInvalidField.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }
        });

        // Enlever l'erreur quand l'utilisateur corrige le champ
        form.querySelectorAll("input, select, textarea").forEach((field) => {
            field.addEventListener("input", () => {
                field.classList.remove("is-invalid");

                const nextElement = field.nextElementSibling;

                if (
                    nextElement &&
                    nextElement.classList.contains("validation-error")
                ) {
                    nextElement.remove();
                }
            });
        });
    });
});
