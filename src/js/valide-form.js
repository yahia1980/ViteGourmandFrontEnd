
/*
 * ============================================================
 * VITE & GOURMAND
 * Validation commune des formulaires
 * Compatible avec le routeur SPA
 * ============================================================
 */

(() => {
    "use strict";

    // Empêche l'installation des événements plusieurs fois.
    if (window.viteGourmandValidationInstalled) return;

    window.viteGourmandValidationInstalled = true;

    const ERROR_CLASS = "validation-error";
    const INVALID_CLASS = "is-invalid";

    const FIELD_SELECTOR = [
        "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])",
        "select",
        "textarea"
    ].join(", ");

    let errorCounter = 0;

    /*
     * ============================================================
     * STYLES DES ERREURS
     * ============================================================
     */

    function installStyles() {
        if (document.getElementById("validation-styles")) return;

        const style = document.createElement("style");
        style.id = "validation-styles";

        style.textContent = `
            .validation-error {
                display: block;
                margin-top: 5px;
                color: #d93025;
                font-size: 0.85rem;
                line-height: 1.4;
            }

            .is-invalid {
                border: 2px solid #d93025 !important;
            }

            .is-invalid:focus {
                outline: 2px solid #d93025;
                outline-offset: 1px;
            }
        `;

        document.head.appendChild(style);
    }

    /*
     * ============================================================
     * GESTION DES MESSAGES D'ERREUR
     * ============================================================
     */

    function getErrorContainer(field) {
        // Les champs de mot de passe possèdent un bouton œil.
        // Le message doit apparaître sous .passwordField,
        // et non entre l'input et le bouton.
        return field.closest(".passwordField") || field;
    }

    function showError(field, message) {
        field.classList.add(INVALID_CLASS);
        field.setAttribute("aria-invalid", "true");

        const container = getErrorContainer(field);

        let error = container.nextElementSibling;

        if (!error || !error.classList.contains(ERROR_CLASS)) {
            error = document.createElement("small");

            error.className = ERROR_CLASS;
            error.id = `validation-error-${++errorCounter}`;

            container.insertAdjacentElement("afterend", error);
        }

        error.textContent = message;

        const ids = (
            field.getAttribute("aria-describedby") || ""
        ).split(/\s+/).filter(Boolean);

        if (!ids.includes(error.id)) {
            ids.push(error.id);

            field.setAttribute(
                "aria-describedby",
                ids.join(" ")
            );
        }

        return false;
    }

    function clearError(field) {
        field.classList.remove(INVALID_CLASS);
        field.removeAttribute("aria-invalid");

        const container = getErrorContainer(field);
        const error = container.nextElementSibling;

        if (!error || !error.classList.contains(ERROR_CLASS)) {
            return;
        }

        const ids = (
            field.getAttribute("aria-describedby") || ""
        ).split(/\s+/).filter(id => id && id !== error.id);

        if (ids.length > 0) {
            field.setAttribute(
                "aria-describedby",
                ids.join(" ")
            );
        } else {
            field.removeAttribute("aria-describedby");
        }

        error.remove();
    }

    /*
     * ============================================================
     * IDENTIFICATION DES MOTS DE PASSE
     * ============================================================
     */

    function isConfirmationField(field) {
        if (field.type !== "password") return false;

        const identifier = (
            `${field.id} ${field.name}`
        ).toLowerCase();

        return (
            field.hasAttribute("data-confirm-password") ||
            identifier.includes("confirm") ||
            identifier.includes("confirmation") ||
            identifier.includes("repeat")
        );
    }

    function getPasswordField(form) {
        const passwords = Array.from(
            form.querySelectorAll("input[type='password']")
        );

        return passwords.find(
            field => !isConfirmationField(field)
        ) || null;
    }

    function getConfirmationField(form) {
        return (
            form.querySelector(
                "input[type='password'][data-confirm-password]"
            ) ||
            Array.from(
                form.querySelectorAll("input[type='password']")
            ).find(isConfirmationField) ||
            null
        );
    }

    function isNewPassword(field, form) {
        if (field.type !== "password") return false;
        if (isConfirmationField(field)) return false;

        const identifier = (
            `${form.id} ${form.name}`
        ).toLowerCase();

        const isLogin = (
            identifier.includes("connexion") ||
            identifier.includes("login")
        );

        if (isLogin) return false;

        return (
            field.hasAttribute("data-validate-password") ||
            field.autocomplete === "new-password" ||
            identifier.includes("inscription") ||
            identifier.includes("creation") ||
            identifier.includes("register") ||
            Boolean(getConfirmationField(form))
        );
    }

    /*
     * ============================================================
     * VALIDATION DES MOTS DE PASSE
     * ============================================================
     */

    function validatePassword(value) {
        if (value.length < 12) {
            return "Le mot de passe doit contenir au moins 12 caractères.";
        }

        if (!/[A-Z]/.test(value)) {
            return "Le mot de passe doit contenir au moins une majuscule.";
        }

        if (!/[a-z]/.test(value)) {
            return "Le mot de passe doit contenir au moins une minuscule.";
        }

        if (!/[0-9]/.test(value)) {
            return "Le mot de passe doit contenir au moins un chiffre.";
        }

        if (!/[^A-Za-z0-9]/.test(value)) {
            return "Le mot de passe doit contenir au moins un caractère spécial.";
        }

        return "";
    }

    /*
     * ============================================================
     * VALIDATION D'UN CHAMP
     * ============================================================
     */

    function validateField(field, form) {
        if (field.disabled || field.type === "hidden") {
            clearError(field);
            return true;
        }

        const value = field.value.trim();

        let message = "";

        /*
         * 1. Champs obligatoires
         */

        if (field.required) {
            if (field.type === "checkbox" && !field.checked) {
                message = "Vous devez cocher cette case.";

            } else if (field.type === "radio") {
                const radios = Array.from(
                    form.querySelectorAll("input[type='radio']")
                ).filter(radio => radio.name === field.name);

                if (!radios.some(radio => radio.checked)) {
                    message = "Veuillez sélectionner une option.";
                }

            } else if (value === "") {
                message = "Ce champ est obligatoire.";
            }
        }

        /*
         * 2. Validation des champs remplis
         */

        if (!message && value !== "") {

            // Email
            if (field.type === "email") {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    message = "Veuillez saisir une adresse e-mail valide.";
                }
            }

            // Téléphone français
            else if (field.type === "tel") {
                const normalized = value.replace(/[\s.-]/g, "");

                if (
                    !/^(?:0[1-9]\d{8}|\+33[1-9]\d{8}|0033[1-9]\d{8})$/.test(normalized)
                ) {
                    message = "Veuillez saisir un numéro de téléphone français valide.";
                }
            }

            // Code postal
            else if (
                field.name === "postale" ||
                field.id === "postale" ||
                field.name === "codePostal" ||
                field.id === "codePostal" ||
                field.autocomplete === "postal-code"
            ) {
                if (!/^\d{5}$/.test(value)) {
                    message = "Le code postal doit contenir 5 chiffres.";
                }
            }

            // Champs numériques
            else if (field.type === "number") {
                const number = Number(value);

                if (!Number.isFinite(number)) {
                    message = "Veuillez saisir un nombre valide.";

                } else if (
                    field.min !== "" &&
                    number < Number(field.min)
                ) {
                    message = `La valeur minimale est ${field.min}.`;

                } else if (
                    field.max !== "" &&
                    number > Number(field.max)
                ) {
                    message = `La valeur maximale est ${field.max}.`;

                } else if (field.validity.stepMismatch) {
                    message = "Veuillez saisir une valeur autorisée.";
                }
            }

            /*
             * 3. Longueurs
             */

            if (
                !message &&
                field.minLength > 0 &&
                value.length < field.minLength
            ) {
                message = `Saisissez au moins ${field.minLength} caractères.`;
            }

            if (
                !message &&
                field.maxLength > 0 &&
                value.length > field.maxLength
            ) {
                message = `Saisissez au maximum ${field.maxLength} caractères.`;
            }

            /*
             * 4. Pattern HTML
             */

            if (
                !message &&
                field.hasAttribute("pattern") &&
                field.validity.patternMismatch
            ) {
                message = field.title ||
                    "Le format de ce champ est invalide.";
            }

            /*
             * 5. Autres contraintes HTML
             */

            if (!message && field.validity.badInput) {
                message = "Veuillez saisir une valeur valide.";
            }

            if (!message && field.validity.rangeUnderflow) {
                message = "La valeur est inférieure au minimum autorisé.";
            }

            if (!message && field.validity.rangeOverflow) {
                message = "La valeur dépasse le maximum autorisé.";
            }

            /*
             * 6. Nouveau mot de passe
             */

            if (!message && isNewPassword(field, form)) {
                message = validatePassword(field.value);
            }

            /*
             * 7. Confirmation du mot de passe
             */

            if (!message && isConfirmationField(field)) {
                const targetId = field.getAttribute(
                    "data-confirm-password"
                );

                let passwordField = null;

                if (targetId) {
                    passwordField = Array.from(
                        form.querySelectorAll("input[type='password']")
                    ).find(input => input.id === targetId) || null;
                }

                if (!passwordField) {
                    passwordField = getPasswordField(form);
                }

                if (!passwordField) {
                    message = "Impossible de trouver le mot de passe à confirmer.";

                } else if (field.value !== passwordField.value) {
                    message = "Les deux mots de passe ne correspondent pas.";
                }
            }
        }

        /*
         * 8. Résultat
         */

        if (message) {
            return showError(field, message);
        }

        clearError(field);
        return true;
    }

    /*
     * ============================================================
     * VALIDATION SPÉCIFIQUE : ESPACE EMPLOYÉ
     * ============================================================
     */

    function validateEmployeeOrder(form) {
        if (form.id !== "formModificationCommande") {
            return true;
        }

        const statut = form.querySelector("#nouveauStatutEmploye");
        const contact = form.querySelector("#contactClientEmploye");
        const dateContact = form.querySelector("#dateContactEmploye");
        const motif = form.querySelector("#motifEmploye");
        const commande = form.querySelector("#commandeIdEmploye");

        let valid = true;

        if (commande && !commande.value.trim()) {
            showError(commande, "Sélectionnez une commande.");
            valid = false;
        }

        if (statut?.value === "annulee") {
            if (contact && !contact.value.trim()) {
                showError(
                    contact,
                    "Indiquez le moyen de contact du client."
                );
                valid = false;
            }

            if (dateContact && !dateContact.value) {
                showError(
                    dateContact,
                    "Indiquez la date du contact."
                );
                valid = false;
            }

            if (motif && !motif.value.trim()) {
                showError(
                    motif,
                    "Le motif d'annulation est obligatoire."
                );
                valid = false;
            }
        }

        return valid;
    }

    /*
     * ============================================================
     * VALIDATION SPÉCIFIQUE : ESPACE ADMIN
     * ============================================================
     */

    function validateAdminDates(form) {
        if (form.id !== "formFiltresStatistiques") {
            return true;
        }

        const debut = form.querySelector("#adminDateDebut");
        const fin = form.querySelector("#adminDateFin");

        if (
            debut?.value &&
            fin?.value &&
            debut.value > fin.value
        ) {
            return showError(
                fin,
                "La date de fin doit être postérieure ou égale à la date de début."
            );
        }

        return true;
    }

    /*
     * ============================================================
     * PRÉPARATION DES FORMULAIRES SPA
     * ============================================================
     */

    function prepareForms(root = document) {
        if (root instanceof HTMLFormElement) {
            root.noValidate = true;
        }

        if (root.querySelectorAll) {
            root.querySelectorAll("form").forEach(form => {
                form.noValidate = true;
            });
        }
    }

    function observeForms() {
        prepareForms();

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        prepareForms(node);
                    }
                }
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    /*
     * ============================================================
     * VALIDATION À LA SOUMISSION
     * ============================================================
     */

    document.addEventListener("submit", event => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) return;

    // Les horaires sont validés et enregistrés par espace-employe.js
    if (form.id === "formHorairesEmploye") {
        return;
    }


        // Supprimer les anciennes erreurs.
        form.querySelectorAll(FIELD_SELECTOR).forEach(clearError);

        let isValid = true;
        let firstInvalid = null;

        const fields = form.querySelectorAll(FIELD_SELECTOR);

        fields.forEach(field => {
            if (!validateField(field, form)) {
                isValid = false;

                if (!firstInvalid) {
                    firstInvalid = field;
                }
            }
        });

        if (!validateEmployeeOrder(form)) {
            isValid = false;
        }

        if (!validateAdminDates(form)) {
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault();
            event.stopImmediatePropagation();

            const target = firstInvalid ||
                form.querySelector(`.${INVALID_CLASS}`);

            if (target) {
                target.focus({ preventScroll: true });

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

            console.warn(
                "VALIDATION : formulaire bloqué car invalide",
                form.id || "(sans identifiant)"
            );
        }
    }, true);

    /*
     * ============================================================
     * VALIDATION PENDANT LA SAISIE
     * ============================================================
     */

    function handleFieldChange(event) {
        const field = event.target;

        if (
            !(field instanceof HTMLElement) ||
            !field.matches(FIELD_SELECTOR)
        ) {
            return;
        }

        const form = field.closest("form");

        if (!form) return;

        // Revalider le champ si une erreur était affichée.
        if (field.classList.contains(INVALID_CLASS)) {
            validateField(field, form);
        }

        // Revalider la confirmation lorsque le mot
        // de passe principal change.
        if (
            field.type === "password" &&
            !isConfirmationField(field)
        ) {
            const confirmation = getConfirmationField(form);

            if (
                confirmation &&
                confirmation.value !== ""
            ) {
                validateField(confirmation, form);
            }
        }
    }

    document.addEventListener("input", handleFieldChange);
    document.addEventListener("change", handleFieldChange);

    /*
     * ============================================================
     * INITIALISATION
     * ============================================================
     */

    installStyles();

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            observeForms,
            { once: true }
        );
    } else {
        observeForms();
    }

    console.log("VALIDATION : événements installés");

})();
