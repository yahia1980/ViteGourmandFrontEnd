
/* =====================================================
   ESPACE ADMINISTRATEUR - VITE & GOURMAND
===================================================== */

const API_EMPLOYES = "/api/api/admin/employes";
const API_STATISTIQUES = "/api/api/admin/statistiques";
const API_MENUS = "/api/api/menus";

/* =====================================================
   OUTILS COMMUNS
===================================================== */

function formaterEurosAdmin(montant) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR"
    }).format(Number(montant) || 0);
}

async function lireReponseAdmin(reponse) {
    const texte = await reponse.text();

    let donnees = {};

    if (texte) {
        try {
            donnees = JSON.parse(texte);
        } catch {
            throw new Error("Réponse incorrecte du serveur.");
        }
    }

    if (!reponse.ok) {
        throw new Error(
            donnees.erreur ||
            donnees.message ||
            `Erreur HTTP ${reponse.status}`
        );
    }

    return donnees;
}

function afficherMessageAdmin(conteneur, texte) {
    if (!conteneur) return;

    conteneur.replaceChildren();

    const paragraphe = document.createElement("p");
    paragraphe.textContent = texte;

    conteneur.appendChild(paragraphe);
}

function creerCelluleAdmin(ligne, valeur) {
    const cellule = document.createElement("td");
    cellule.textContent = valeur ?? "—";
    ligne.appendChild(cellule);
    return cellule;
}

function afficherLigneAdmin(tableau, texte, colonnes) {
    if (!tableau) return;

    tableau.replaceChildren();

    const ligne = document.createElement("tr");
    const cellule = document.createElement("td");

    cellule.colSpan = colonnes;
    cellule.textContent = texte;

    ligne.appendChild(cellule);
    tableau.appendChild(ligne);
}

/* =====================================================
   COMPTEUR DES MENUS DISPONIBLES
===================================================== */

async function chargerCompteurMenusAdmin() {
    const compteur = document.getElementById("adminTotalMenus");

    if (!compteur) return;

    try {
        const reponse = await fetch(API_MENUS, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json"
            }
        });

        const resultat = await lireReponseAdmin(reponse);

        const menus = Array.isArray(resultat)
            ? resultat
            : resultat.menus;

        if (!Array.isArray(menus)) {
            throw new Error("Format des menus incorrect.");
        }

        const disponibles = menus.filter(menu =>
            Number(menu.stock) > 0
        );

        compteur.textContent = disponibles.length;

        console.log(
            "Menus disponibles :",
            disponibles.length
        );

    } catch (erreur) {
        compteur.textContent = "—";
        console.error(
            "Erreur compteur menus :",
            erreur
        );
    }
}

/* =====================================================
   GESTION DES EMPLOYÉS
===================================================== */

function initialiserEspaceAdmin() {
    const formulaire = document.getElementById(
        "formCreationEmploye"
    );

    const liste = document.getElementById(
        "listeEmployesAdmin"
    );

    const totalEmployes = document.getElementById(
        "adminTotalEmployes"
    );

    const message = document.getElementById(
        "messageCreationEmploye"
    );

    if (
        !formulaire ||
        !liste ||
        !totalEmployes ||
        !message
    ) {
        return;
    }

    if (formulaire.dataset.initialise === "true") {
        return;
    }

    formulaire.dataset.initialise = "true";

    /* ==========================================
       CHARGEMENT DES EMPLOYÉS
    ========================================== */

    async function chargerEmployes() {
        afficherLigneAdmin(
            liste,
            "Chargement des employés...",
            4
        );

        try {
            const reponse = await fetch(API_EMPLOYES, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            const donnees = await lireReponseAdmin(reponse);

            totalEmployes.textContent =
                donnees.totalActifs ?? 0;

            liste.replaceChildren();

            const employes = Array.isArray(donnees.employes)
                ? donnees.employes
                : [];

            if (employes.length === 0) {
                afficherLigneAdmin(
                    liste,
                    "Aucun employé enregistré.",
                    4
                );
                return;
            }

            employes.forEach(employe => {
                const ligne = document.createElement("tr");

                creerCelluleAdmin(ligne, employe.email);

                creerCelluleAdmin(
                    ligne,
                    employe.actif ? "Actif" : "Désactivé"
                );

                creerCelluleAdmin(
                    ligne,
                    employe.dateCreation ?? "—"
                );

                const celluleAction = document.createElement(
                    "td"
                );

                const bouton = document.createElement(
                    "button"
                );

                bouton.type = "button";
                bouton.className = "adminBouton";

                bouton.textContent = employe.actif
                    ? "Désactiver"
                    : "Activer";

                bouton.addEventListener("click", async () => {
                    const nouveauStatut = !employe.actif;

                    bouton.disabled = true;

                    try {
                        const reponse = await fetch(
                            `${API_EMPLOYES}/${encodeURIComponent(employe.id)}/statut`,
                            {
                                method: "PATCH",
                                credentials: "include",
                                headers: {
                                    "Content-Type": "application/json",
                                    Accept: "application/json"
                                },
                                body: JSON.stringify({
                                    actif: nouveauStatut
                                })
                            }
                        );

                        const resultat =
                            await lireReponseAdmin(reponse);

                        message.textContent =
                            resultat.message ||
                            "Statut modifié avec succès.";

                        await chargerEmployes();

                    } catch (erreur) {
                        message.textContent = erreur.message;
                        console.error(erreur);

                    } finally {
                        bouton.disabled = false;
                    }
                });

                celluleAction.appendChild(bouton);
                ligne.appendChild(celluleAction);
                liste.appendChild(ligne);
            });

        } catch (erreur) {
            afficherLigneAdmin(
                liste,
                erreur.message,
                4
            );

            totalEmployes.textContent = "—";
            console.error("Erreur employés :", erreur);
        }
    }

    /* ==========================================
       CRÉATION D'UN EMPLOYÉ
    ========================================== */

    formulaire.addEventListener("submit", async event => {
        event.preventDefault();

        const bouton = formulaire.querySelector(
            'button[type="submit"]'
        );

        const valeur = id =>
            document.getElementById(id)?.value.trim() ?? "";

        const donnees = {
            email: valeur("nouvelEmployeEmail"),
            password: document.getElementById(
                "nouvelEmployePassword"
            )?.value ?? "",
            nom: valeur("nouvelEmployeNom"),
            prenom: valeur("nouvelEmployePrenom"),
            telephone: valeur("nouvelEmployeTelephone"),
            adresse: valeur("nouvelEmployeAdresse"),
            codePostal: valeur("nouvelEmployeCodePostal"),
            ville: valeur("nouvelEmployeVille")
        };

        if (bouton) bouton.disabled = true;

        message.textContent =
            "Création du compte en cours...";

        try {
            const reponse = await fetch(API_EMPLOYES, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(donnees)
            });

            const resultat =
                await lireReponseAdmin(reponse);

            message.textContent =
                resultat.message ||
                "Employé créé avec succès !";

            formulaire.reset();

            await chargerEmployes();

        } catch (erreur) {
            message.textContent = erreur.message;
            console.error("Création employé :", erreur);

        } finally {
            if (bouton) bouton.disabled = false;
        }
    });

    chargerEmployes();
}

/* =====================================================
   STATISTIQUES ADMINISTRATEUR
===================================================== */

function initialiserStatistiquesAdmin() {
    const totalCommandes = document.getElementById(
        "adminTotalCommandes"
    );

    const chiffreAffaires = document.getElementById(
        "adminChiffreAffaires"
    );

    const graphiqueCommandes = document.getElementById(
        "adminGraphiqueCommandes"
    );

    const graphiqueCA = document.getElementById(
        "adminGraphiqueCA"
    );

    const tableauStatistiques = document.getElementById(
        "adminTableStatistiques"
    );

    const formulaireFiltres = document.getElementById(
        "formFiltresStatistiques"
    );

    const filtreDateDebut = document.getElementById(
        "adminDateDebut"
    );

    const filtreDateFin = document.getElementById(
        "adminDateFin"
    );

    const filtreMenu = document.getElementById(
        "adminFiltreMenu"
    );

    if (!totalCommandes && !chiffreAffaires) return;

    if (
        formulaireFiltres &&
        formulaireFiltres.dataset.initialise === "true"
    ) {
        return;
    }

    if (formulaireFiltres) {
        formulaireFiltres.dataset.initialise = "true";
    }

    /* ==========================================
       CRÉATION DES BARRES
    ========================================== */

    function creerBarre(valeur, maximum, texteValeur) {
        const ligne = document.createElement("div");
        ligne.className = "adminBarreLigne";

        const piste = document.createElement("div");
        piste.className = "adminBarrePiste";

        const barre = document.createElement("div");
        barre.className = "adminBarreValeur";

        const pourcentage = maximum > 0
            ? Math.max(
                0,
                Math.min(100, (valeur / maximum) * 100)
            )
            : 0;

        barre.style.width = `${pourcentage}%`;

        piste.appendChild(barre);

        const valeurTexte = document.createElement("strong");
        valeurTexte.textContent = texteValeur;

        ligne.append(piste, valeurTexte);

        return ligne;
    }

    /* ==========================================
       GRAPHIQUE DES COMMANDES
    ========================================== */

    function afficherGraphiqueCommandes(statistiques) {
        if (!graphiqueCommandes) return;

        graphiqueCommandes.replaceChildren();

        if (statistiques.length === 0) {
            afficherMessageAdmin(
                graphiqueCommandes,
                "Aucune commande pour cette sélection."
            );
            return;
        }

        const maximum = Math.max(
            1,
            ...statistiques.map(
                stat => Number(stat.nombreCommandes) || 0
            )
        );

        statistiques.forEach(stat => {
            const bloc = document.createElement("div");
            bloc.className = "adminBarreBloc";

            const nom = document.createElement("span");
            nom.className = "adminBarreNom";
            nom.textContent = stat.menuNom ?? "Menu";

            const valeur = Number(stat.nombreCommandes) || 0;

            const barre = creerBarre(
                valeur,
                maximum,
                String(valeur)
            );

            bloc.append(nom, barre);
            graphiqueCommandes.appendChild(bloc);
        });
    }

    /* ==========================================
       GRAPHIQUE DU CHIFFRE D'AFFAIRES
    ========================================== */

    function afficherGraphiqueCA(statistiques) {
        if (!graphiqueCA) return;

        graphiqueCA.replaceChildren();

        if (statistiques.length === 0) {
            afficherMessageAdmin(
                graphiqueCA,
                "Aucun chiffre d'affaires pour cette sélection."
            );
            return;
        }

        const maximum = Math.max(
            0,
            ...statistiques.map(
                stat => Number(stat.chiffreAffaires) || 0
            )
        );

        statistiques.forEach(stat => {
            const bloc = document.createElement("div");
            bloc.className = "adminBarreBloc";

            const nom = document.createElement("span");
            nom.className = "adminBarreNom";
            nom.textContent = stat.menuNom ?? "Menu";

            const valeur = Number(stat.chiffreAffaires) || 0;

            const barre = creerBarre(
                valeur,
                maximum,
                formaterEurosAdmin(valeur)
            );

            bloc.append(nom, barre);
            graphiqueCA.appendChild(bloc);
        });
    }

    /* ==========================================
       TABLEAU DES STATISTIQUES
    ========================================== */

    function afficherTableauStatistiques(statistiques) {
        if (!tableauStatistiques) return;

        tableauStatistiques.replaceChildren();

        if (statistiques.length === 0) {
            afficherLigneAdmin(
                tableauStatistiques,
                "Aucune statistique disponible.",
                3
            );
            return;
        }

        statistiques.forEach(stat => {
            const ligne = document.createElement("tr");

            creerCelluleAdmin(
                ligne,
                stat.menuNom ?? "Menu"
            );

            creerCelluleAdmin(
                ligne,
                stat.nombreCommandes ?? 0
            );

            creerCelluleAdmin(
                ligne,
                formaterEurosAdmin(stat.chiffreAffaires)
            );

            tableauStatistiques.appendChild(ligne);
        });
    }

    /* ==========================================
       CHARGEMENT DES STATISTIQUES
    ========================================== */

    async function chargerStatistiques() {
        const parametres = new URLSearchParams();

        if (filtreDateDebut?.value) {
            parametres.set(
                "dateDebut",
                filtreDateDebut.value
            );
        }

        if (filtreDateFin?.value) {
            parametres.set(
                "dateFin",
                filtreDateFin.value
            );
        }

        if (filtreMenu?.value) {
            parametres.set(
                "menuId",
                filtreMenu.value
            );
        }

        const query = parametres.toString();

        const url = query
            ? `${API_STATISTIQUES}?${query}`
            : API_STATISTIQUES;

        afficherMessageAdmin(
            graphiqueCommandes,
            "Chargement des statistiques..."
        );

        afficherMessageAdmin(
            graphiqueCA,
            "Chargement des statistiques..."
        );

        try {
            const reponse = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            const donnees =
                await lireReponseAdmin(reponse);

            const statistiques = Array.isArray(
                donnees.statistiquesParMenu
            )
                ? donnees.statistiquesParMenu
                : [];

            if (totalCommandes) {
                totalCommandes.textContent =
                    donnees.totalCommandes ?? 0;
            }

            if (chiffreAffaires) {
                chiffreAffaires.textContent =
                    formaterEurosAdmin(
                        donnees.chiffreAffaires
                    );
            }

            afficherGraphiqueCommandes(statistiques);
            afficherGraphiqueCA(statistiques);
            afficherTableauStatistiques(statistiques);

            console.log(
                "Statistiques administrateur :",
                donnees
            );

        } catch (erreur) {
            if (totalCommandes) {
                totalCommandes.textContent = "—";
            }

            if (chiffreAffaires) {
                chiffreAffaires.textContent = "—";
            }

            afficherMessageAdmin(
                graphiqueCommandes,
                erreur.message
            );

            afficherMessageAdmin(
                graphiqueCA,
                erreur.message
            );

            afficherTableauStatistiques([]);

            console.error(
                "Erreur statistiques :",
                erreur
            );
        }
    }

    /* ==========================================
       MENUS POUR LE FILTRE STATISTIQUE
    ========================================== */

    async function chargerMenusFiltres() {
        if (!filtreMenu) return;

        try {
            const reponse = await fetch(API_STATISTIQUES, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            const donnees =
                await lireReponseAdmin(reponse);

            const statistiques = Array.isArray(
                donnees.statistiquesParMenu
            )
                ? donnees.statistiquesParMenu
                : [];

            filtreMenu.replaceChildren();

            const optionTous = document.createElement(
                "option"
            );

            optionTous.value = "";
            optionTous.textContent = "Tous les menus";

            filtreMenu.appendChild(optionTous);

            statistiques.forEach(stat => {
                const option = document.createElement(
                    "option"
                );

                option.value = String(stat.menuId);
                option.textContent = stat.menuNom;

                filtreMenu.appendChild(option);
            });

        } catch (erreur) {
            console.error(
                "Erreur filtres menus :",
                erreur
            );
        }
    }

    /* ==========================================
       APPLICATION DES FILTRES
    ========================================== */

    formulaireFiltres?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (
                filtreDateDebut?.value &&
                filtreDateFin?.value &&
                filtreDateDebut.value > filtreDateFin.value
            ) {
                afficherMessageAdmin(
                    graphiqueCommandes,
                    "La date de début doit précéder la date de fin."
                );

                afficherMessageAdmin(
                    graphiqueCA,
                    "Veuillez corriger les dates."
                );

                return;
            }

            await chargerStatistiques();
        }
    );

    chargerMenusFiltres();
    chargerStatistiques();
}

/* =====================================================
   GESTION DES MENUS ADMINISTRATEUR
===================================================== */

function initialiserGestionMenusAdmin() {
    const formulaireAjout = document.getElementById(
        "formAjoutMenu"
    );

    const listeMenus = document.getElementById(
        "listeMenusAdmin"
    );

    const messageAjout = document.getElementById(
        "messageAjoutMenu"
    );

    const messageGestion = document.getElementById(
        "messageGestionMenus"
    );

    if (!formulaireAjout || !listeMenus) return;

    if (formulaireAjout.dataset.initialise === "true") {
        return;
    }

    formulaireAjout.dataset.initialise = "true";

    /* ==========================================
       CHARGEMENT DES MENUS
    ========================================== */

    async function chargerMenusAdmin() {
        afficherLigneAdmin(
            listeMenus,
            "Chargement des menus...",
            6
        );

        try {
            const reponse = await fetch(API_MENUS, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            const resultat =
                await lireReponseAdmin(reponse);

            const menus = Array.isArray(resultat)
                ? resultat
                : resultat.menus;

            if (!Array.isArray(menus)) {
                throw new Error(
                    "Format de réponse des menus incorrect."
                );
            }

            listeMenus.replaceChildren();

            // Actualiser aussi le compteur du tableau de bord
            const compteur = document.getElementById(
                "adminTotalMenus"
            );

            if (compteur) {
                compteur.textContent = menus.filter(
                    menu => Number(menu.stock) > 0
                ).length;
            }

            if (menus.length === 0) {
                afficherLigneAdmin(
                    listeMenus,
                    "Aucun menu enregistré.",
                    6
                );
                return;
            }

            menus.forEach(menu => {
                const ligne = document.createElement("tr");

                /* IMAGE */

                const celluleImage = document.createElement(
                    "td"
                );

                if (menu.image) {
                    const image = document.createElement(
                        "img"
                    );

                    image.src = menu.image;
                    image.alt = menu.titre || "Image du menu";
                    image.width = 80;
                    image.height = 60;
                    image.style.objectFit = "cover";
                    image.loading = "lazy";

                    celluleImage.appendChild(image);
                } else {
                    celluleImage.textContent = "Aucune image";
                }

                ligne.appendChild(celluleImage);

                /* NOM */

                creerCelluleAdmin(
                    ligne,
                    menu.titre || "Sans titre"
                );

                /* THÈME */

                const theme = typeof menu.theme === "object"
                    ? menu.theme?.nom
                    : menu.theme;

                creerCelluleAdmin(ligne, theme || "—");

                /* PRIX */

                creerCelluleAdmin(
                    ligne,
                    formaterEurosAdmin(menu.prix)
                );

                /* STOCK */

                creerCelluleAdmin(
                    ligne,
                    menu.stock ?? 0
                );

                /* ACTIONS */

                const celluleActions = document.createElement(
                    "td"
                );

                const boutonModifier = document.createElement(
                    "button"
                );

                boutonModifier.type = "button";
                boutonModifier.className = "adminBouton";
                boutonModifier.textContent = "Modifier";

                boutonModifier.addEventListener("click", () => {
                    const section = document.getElementById(
                        "sectionModificationMenu"
                    );

                    if (!section) {
                        console.error(
                            "Formulaire de modification introuvable."
                        );
                        return;
                    }

                    const remplir = (id, valeur) => {
                        const element = document.getElementById(id);

                        if (element) {
                            element.value = valeur ?? "";
                        }
                    };

                    remplir("modifMenuId", menu.id);
                    remplir("modifTitre", menu.titre);
                    remplir(
                        "modifDescription",
                        menu.description
                    );
                    remplir(
                        "modifPersonnes",
                        menu.personnesMin ?? 1
                    );
                    remplir("modifPrix", menu.prix);
                    remplir("modifStock", menu.stock ?? 0);

                    remplir(
                        "modifConditions",
                        Array.isArray(menu.conditions)
                            ? menu.conditions.join("\n")
                            : menu.conditions
                    );

                    const themes = {
                        "Pâques": "1",
                        "Noël": "2",
                        "Classique": "3"
                    };

                    const regimes = {
                        "Classique": "1",
                        "Pescétarien": "2"
                    };

                    const nomTheme =
                        typeof menu.theme === "object"
                            ? menu.theme?.nom
                            : menu.theme;

                    const nomRegime =
                        typeof menu.regime === "object"
                            ? menu.regime?.nom
                            : menu.regime;

                    remplir(
                        "modifTheme",
                        themes[nomTheme] ?? ""
                    );

                    remplir(
                        "modifRegime",
                        regimes[nomRegime] ?? ""
                    );

                    remplir("modifImages", "");

                    section.hidden = false;

                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                });

                /* SUPPRESSION */

                const boutonSupprimer = document.createElement(
                    "button"
                );

                boutonSupprimer.type = "button";
                boutonSupprimer.className = "adminBouton";
                boutonSupprimer.textContent = "Supprimer";

                boutonSupprimer.addEventListener("click", () => {
                    const dialogue = document.getElementById(
                        "dialogSuppressionMenu"
                    );

                    if (!dialogue) {
                        console.error(
                            "Fenêtre de confirmation introuvable."
                        );
                        return;
                    }

                    const nom = document.getElementById(
                        "nomMenuSuppression"
                    );

                    if (nom) {
                        nom.textContent = menu.titre;
                    }

                    dialogue.dataset.menuId = menu.id;
                    dialogue.showModal();
                });

                celluleActions.append(
                    boutonModifier,
                    boutonSupprimer
                );

                ligne.appendChild(celluleActions);
                listeMenus.appendChild(ligne);
            });

        } catch (erreur) {
            afficherLigneAdmin(
                listeMenus,
                erreur.message,
                6
            );

            console.error(
                "Erreur menus administrateur :",
                erreur
            );
        }
    }

    /* ==========================================
       AJOUT D'UN MENU
    ========================================== */

    formulaireAjout.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const bouton = formulaireAjout.querySelector(
                'button[type="submit"]'
            );

            const donnees = new FormData(formulaireAjout);

            const fichiers = document.getElementById(
                "ajoutImages"
            )?.files;

            if (fichiers && fichiers.length > 10) {
                if (messageAjout) {
                    messageAjout.textContent =
                        "Vous pouvez ajouter au maximum 10 images.";
                }
                return;
            }

            if (fichiers) {
                for (const fichier of fichiers) {
                    if (fichier.size > 5 * 1024 * 1024) {
                        if (messageAjout) {
                            messageAjout.textContent =
                                "Chaque image doit faire moins de 5 Mo.";
                        }
                        return;
                    }

                    if (
                        ![
                            "image/jpeg",
                            "image/png",
                            "image/webp"
                        ].includes(fichier.type)
                    ) {
                        if (messageAjout) {
                            messageAjout.textContent =
                                "Format accepté : JPG, PNG ou WEBP.";
                        }
                        return;
                    }
                }
            }

            if (bouton) bouton.disabled = true;

            if (messageAjout) {
                messageAjout.textContent =
                    "Création du menu en cours...";
            }

            try {
                const reponse = await fetch(API_MENUS, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json"
                    },
                    body: donnees
                });

                const resultat =
                    await lireReponseAdmin(reponse);

                if (messageAjout) {
                    messageAjout.textContent =
                        resultat.message ||
                        "Menu créé avec succès !";
                }

                formulaireAjout.reset();

                await chargerMenusAdmin();

            } catch (erreur) {
                if (messageAjout) {
                    messageAjout.textContent = erreur.message;
                }

                console.error(
                    "Erreur création du menu :",
                    erreur
                );

            } finally {
                if (bouton) bouton.disabled = false;
            }
        }
    );

    /* ==========================================
       MODIFICATION D'UN MENU
    ========================================== */

    const formulaireModification = document.getElementById(
        "formModificationMenu"
    );

    const sectionModification = document.getElementById(
        "sectionModificationMenu"
    );

    const messageModification = document.getElementById(
        "messageModificationMenu"
    );

    formulaireModification?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const id = document.getElementById(
                "modifMenuId"
            )?.value;

            if (!id) {
                if (messageModification) {
                    messageModification.textContent =
                        "Aucun menu sélectionné.";
                }
                return;
            }

            const donnees = new FormData(
                formulaireModification
            );

            const bouton = formulaireModification.querySelector(
                'button[type="submit"]'
            );

            if (bouton) bouton.disabled = true;

            if (messageModification) {
                messageModification.textContent =
                    "Modification en cours...";
            }

            try {
                const reponse = await fetch(
                    `${API_MENUS}/${encodeURIComponent(id)}/modifier`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            Accept: "application/json"
                        },
                        body: donnees
                    }
                );

                await lireReponseAdmin(reponse);

                formulaireModification.reset();

                if (sectionModification) {
                    sectionModification.hidden = true;
                }

                if (messageGestion) {
                    messageGestion.textContent =
                        "Menu modifié avec succès !";
                }

                await chargerMenusAdmin();

            } catch (erreur) {
                if (messageModification) {
                    messageModification.textContent =
                        erreur.message;
                }

                console.error(
                    "Erreur modification :",
                    erreur
                );

            } finally {
                if (bouton) bouton.disabled = false;
            }
        }
    );

    /* ==========================================
       ANNULATION DE LA MODIFICATION
    ========================================== */

    document.getElementById("annulerModificationMenu")
        ?.addEventListener("click", () => {
            formulaireModification?.reset();

            if (sectionModification) {
                sectionModification.hidden = true;
            }
        });

    /* ==========================================
       SUPPRESSION D'UN MENU
    ========================================== */

    const dialogueSuppression = document.getElementById(
        "dialogSuppressionMenu"
    );

    document.getElementById("annulerSuppressionMenu")
        ?.addEventListener("click", () => {
            dialogueSuppression?.close();
        });

    document.getElementById("confirmerSuppressionMenu")
        ?.addEventListener("click", async event => {
            const id = dialogueSuppression?.dataset.menuId;

            if (!id) return;

            const bouton = event.currentTarget;
            bouton.disabled = true;

            try {
                const reponse = await fetch(
                    `${API_MENUS}/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE",
                        credentials: "include",
                        headers: {
                            Accept: "application/json"
                        }
                    }
                );

                await lireReponseAdmin(reponse);

                dialogueSuppression.close();

                if (messageGestion) {
                    messageGestion.textContent =
                        "Menu supprimé avec succès !";
                }

                await chargerMenusAdmin();

            } catch (erreur) {
                if (messageGestion) {
                    messageGestion.textContent =
                        erreur.message;
                }

                console.error(
                    "Erreur suppression :",
                    erreur
                );

            } finally {
                bouton.disabled = false;
            }
        });

    /* ==========================================
       CHARGEMENT INITIAL DES MENUS
    ========================================== */

    chargerMenusAdmin();
}

/* =====================================================
   NAVIGATION ADMINISTRATEUR
===================================================== */

function initialiserNavigationAdmin() {
    const espaceAdmin = document.querySelector(
        ".espaceAdmin"
    );

    if (!espaceAdmin) return;

    const liens = espaceAdmin.querySelectorAll(
        '.adminActions a[href^="#"]'
    );

    liens.forEach(lien => {
        if (
            lien.dataset.navigationInitialisee === "true"
        ) {
            return;
        }

        lien.dataset.navigationInitialisee = "true";

        lien.addEventListener("click", event => {
            const idSection = lien
                .getAttribute("href")
                .slice(1);

            const section = document.getElementById(
                idSection
            );

            if (!section) return;

            event.preventDefault();
            event.stopPropagation();

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

/* =====================================================
   INITIALISATION GÉNÉRALE
===================================================== */

initialiserEspaceAdmin();

initialiserStatistiquesAdmin();

initialiserGestionMenusAdmin();

initialiserNavigationAdmin();

chargerCompteurMenusAdmin();

console.log("Espace administrateur initialisé.");
