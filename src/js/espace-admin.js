const API_EMPLOYES = "/api/admin/employes";
const API_STATISTIQUES = "/api/admin/statistiques";

function initialiserEspaceAdmin() {
  const formulaire = document.getElementById("formCreationEmploye");
  const liste = document.getElementById("listeEmployesAdmin");
  const totalEmployes = document.getElementById("adminTotalEmployes");
  const message = document.getElementById("messageCreationEmploye");

  if (!formulaire || !liste || !totalEmployes || !message) {
    return;
  }

  // Évite d'installer plusieurs fois les événements
  // lorsque la page est rechargée dans la SPA.
  if (formulaire.dataset.initialise === "true") {
    return;
  }

  formulaire.dataset.initialise = "true";

  // =====================================================
  // GESTION DES EMPLOYÉS
  // =====================================================

  async function chargerEmployes() {
    liste.innerHTML = `
            <tr>
                <td colspan="4">Chargement des employés...</td>
            </tr>
        `;

    try {
      const reponse = await fetch(API_EMPLOYES, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!reponse.ok) {
        throw new Error(
          reponse.status === 403
            ? "Accès réservé à l'administrateur."
            : "Impossible de charger les employés.",
        );
      }

      const donnees = await reponse.json();

      totalEmployes.textContent = donnees.totalActifs ?? 0;
      liste.replaceChildren();

      if (!Array.isArray(donnees.employes) || donnees.employes.length === 0) {
        const ligne = document.createElement("tr");
        const cellule = document.createElement("td");

        cellule.colSpan = 4;
        cellule.textContent = "Aucun employé enregistré.";

        ligne.appendChild(cellule);
        liste.appendChild(ligne);
        return;
      }

      donnees.employes.forEach((employe) => {
        const ligne = document.createElement("tr");

        const celluleEmail = document.createElement("td");
        celluleEmail.textContent = employe.email;

        const celluleStatut = document.createElement("td");
        celluleStatut.textContent = employe.actif ? "Actif" : "Désactivé";

        const celluleDate = document.createElement("td");
        celluleDate.textContent = employe.dateCreation ?? "—";

        const celluleAction = document.createElement("td");
        const bouton = document.createElement("button");

        bouton.type = "button";
        bouton.className = "adminBouton";
        bouton.textContent = employe.actif ? "Désactiver" : "Activer";

        bouton.addEventListener("click", async () => {
          const nouveauStatut = !employe.actif;

          bouton.disabled = true;

          try {
            const reponse = await fetch(
              `${API_EMPLOYES}/${employe.id}/statut`,
              {
                method: "PATCH",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  actif: nouveauStatut,
                }),
              },
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
              throw new Error(
                resultat.erreur ?? "Impossible de modifier le statut.",
              );
            }

            message.textContent = resultat.message;
            await chargerEmployes();
          } catch (erreur) {
            message.textContent = erreur.message;
          } finally {
            bouton.disabled = false;
          }
        });

        celluleAction.appendChild(bouton);

        ligne.append(celluleEmail, celluleStatut, celluleDate, celluleAction);

        liste.appendChild(ligne);
      });
    } catch (erreur) {
      liste.replaceChildren();

      const ligne = document.createElement("tr");
      const cellule = document.createElement("td");

      cellule.colSpan = 4;
      cellule.textContent = erreur.message;

      ligne.appendChild(cellule);
      liste.appendChild(ligne);

      totalEmployes.textContent = "—";
    }
  }

  formulaire.addEventListener("submit", async (evenement) => {
    evenement.preventDefault();

    const bouton = formulaire.querySelector('button[type="submit"]');

    const donnees = {
      email: document.getElementById("nouvelEmployeEmail")?.value.trim(),

      password: document.getElementById("nouvelEmployePassword")?.value,

      nom: document.getElementById("nouvelEmployeNom")?.value.trim(),

      prenom: document.getElementById("nouvelEmployePrenom")?.value.trim(),

      telephone: document
        .getElementById("nouvelEmployeTelephone")
        ?.value.trim(),

      adresse: document.getElementById("nouvelEmployeAdresse")?.value.trim(),

      codePostal: document
        .getElementById("nouvelEmployeCodePostal")
        ?.value.trim(),

      ville: document.getElementById("nouvelEmployeVille")?.value.trim(),
    };

    bouton.disabled = true;
    message.textContent = "Création du compte en cours...";

    try {
      const reponse = await fetch(API_EMPLOYES, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(donnees),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.erreur ?? "Impossible de créer le compte employé.",
        );
      }

      message.textContent = resultat.message;
      formulaire.reset();

      await chargerEmployes();
    } catch (erreur) {
      message.textContent = erreur.message;
    } finally {
      bouton.disabled = false;
    }
  });

  // =====================================================
  // STATISTIQUES MONGODB
  // =====================================================

  const totalCommandes = document.getElementById("adminTotalCommandes");

  const chiffreAffaires = document.getElementById("adminChiffreAffaires");

  const graphiqueCommandes = document.getElementById("adminGraphiqueCommandes");

  const graphiqueCA = document.getElementById("adminGraphiqueCA");

  const tableauStatistiques = document.getElementById("adminTableStatistiques");

  const formulaireFiltres = document.getElementById("formFiltresStatistiques");

  const filtreDateDebut = document.getElementById("adminDateDebut");

  const filtreDateFin = document.getElementById("adminDateFin");

  const filtreMenu = document.getElementById("adminFiltreMenu");

  function formaterEuros(montant) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Number(montant) || 0);
  }

  function afficherMessage(conteneur, texte) {
    if (!conteneur) {
      return;
    }

    conteneur.replaceChildren();

    const paragraphe = document.createElement("p");
    paragraphe.textContent = texte;

    conteneur.appendChild(paragraphe);
  }

  function creerBarre(valeur, maximum, texteValeur) {
    const ligne = document.createElement("div");
    ligne.className = "adminBarreLigne";

    const piste = document.createElement("div");
    piste.className = "adminBarrePiste";

    const barre = document.createElement("div");
    barre.className = "adminBarreValeur";

    const pourcentage = maximum > 0 ? (valeur / maximum) * 100 : 0;

    barre.style.width = `${pourcentage}%`;

    piste.appendChild(barre);

    const valeurTexte = document.createElement("strong");
    valeurTexte.textContent = texteValeur;

    ligne.append(piste, valeurTexte);

    return ligne;
  }

  function afficherGraphiqueCommandes(statistiques) {
    if (!graphiqueCommandes) {
      return;
    }

    graphiqueCommandes.replaceChildren();

    if (statistiques.length === 0) {
      afficherMessage(
        graphiqueCommandes,
        "Aucune commande pour cette sélection.",
      );
      return;
    }

    const maximum = Math.max(
      1,
      ...statistiques.map((stat) => Number(stat.nombreCommandes) || 0),
    );

    statistiques.forEach((stat) => {
      const bloc = document.createElement("div");
      bloc.className = "adminBarreBloc";

      const nom = document.createElement("span");
      nom.className = "adminBarreNom";
      nom.textContent = stat.menuNom;

      const barre = creerBarre(
        Number(stat.nombreCommandes) || 0,
        maximum,
        String(stat.nombreCommandes),
      );

      bloc.append(nom, barre);
      graphiqueCommandes.appendChild(bloc);
    });
  }

  function afficherGraphiqueCA(statistiques) {
    if (!graphiqueCA) {
      return;
    }

    graphiqueCA.replaceChildren();

    if (statistiques.length === 0) {
      afficherMessage(
        graphiqueCA,
        "Aucun chiffre d'affaires pour cette sélection.",
      );
      return;
    }

    const maximum = Math.max(
      0,
      ...statistiques.map((stat) => Number(stat.chiffreAffaires) || 0),
    );

    statistiques.forEach((stat) => {
      const bloc = document.createElement("div");
      bloc.className = "adminBarreBloc";

      const nom = document.createElement("span");
      nom.className = "adminBarreNom";
      nom.textContent = stat.menuNom;

      const barre = creerBarre(
        Number(stat.chiffreAffaires) || 0,
        maximum,
        formaterEuros(stat.chiffreAffaires),
      );

      bloc.append(nom, barre);
      graphiqueCA.appendChild(bloc);
    });
  }

  function afficherTableauStatistiques(statistiques) {
    if (!tableauStatistiques) {
      return;
    }

    tableauStatistiques.replaceChildren();

    if (statistiques.length === 0) {
      const ligne = document.createElement("tr");
      const cellule = document.createElement("td");

      cellule.colSpan = 3;
      cellule.className = "adminVide";
      cellule.textContent = "Aucune statistique disponible.";

      ligne.appendChild(cellule);
      tableauStatistiques.appendChild(ligne);

      return;
    }

    statistiques.forEach((stat) => {
      const ligne = document.createElement("tr");

      const celluleMenu = document.createElement("td");
      celluleMenu.textContent = stat.menuNom;

      const celluleCommandes = document.createElement("td");
      celluleCommandes.textContent = stat.nombreCommandes;

      const celluleCA = document.createElement("td");
      celluleCA.textContent = formaterEuros(stat.chiffreAffaires);

      ligne.append(celluleMenu, celluleCommandes, celluleCA);

      tableauStatistiques.appendChild(ligne);
    });
  }

  async function chargerStatistiques() {
    if (
      !totalCommandes ||
      !chiffreAffaires ||
      !graphiqueCommandes ||
      !graphiqueCA ||
      !tableauStatistiques
    ) {
      return;
    }

    const parametres = new URLSearchParams();

    if (filtreDateDebut?.value) {
      parametres.set("dateDebut", filtreDateDebut.value);
    }

    if (filtreDateFin?.value) {
      parametres.set("dateFin", filtreDateFin.value);
    }

    if (filtreMenu?.value) {
      parametres.set("menuId", filtreMenu.value);
    }

    const query = parametres.toString();

    const url = query ? `${API_STATISTIQUES}?${query}` : API_STATISTIQUES;

    afficherMessage(graphiqueCommandes, "Chargement des statistiques...");

    afficherMessage(graphiqueCA, "Chargement des statistiques...");

    try {
      const reponse = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          donnees.erreur ?? "Impossible de charger les statistiques.",
        );
      }

      const statistiques = Array.isArray(donnees.statistiquesParMenu)
        ? donnees.statistiquesParMenu
        : [];

      totalCommandes.textContent = donnees.totalCommandes ?? 0;

      chiffreAffaires.textContent = formaterEuros(donnees.chiffreAffaires);

      afficherGraphiqueCommandes(statistiques);
      afficherGraphiqueCA(statistiques);
      afficherTableauStatistiques(statistiques);
    } catch (erreur) {
      totalCommandes.textContent = "—";
      chiffreAffaires.textContent = "—";

      afficherMessage(graphiqueCommandes, erreur.message);

      afficherMessage(graphiqueCA, erreur.message);

      afficherTableauStatistiques([]);
    }
  }

  async function chargerMenusFiltres() {
    if (!filtreMenu) {
      return;
    }

    try {
      // Sans filtres : récupère les menus ayant
      // au moins une commande dans MongoDB.
      const reponse = await fetch(API_STATISTIQUES, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!reponse.ok) {
        throw new Error("Impossible de récupérer les menus.");
      }

      const donnees = await reponse.json();

      const statistiques = Array.isArray(donnees.statistiquesParMenu)
        ? donnees.statistiquesParMenu
        : [];

      filtreMenu.replaceChildren();

      const optionTous = document.createElement("option");
      optionTous.value = "";
      optionTous.textContent = "Tous les menus";

      filtreMenu.appendChild(optionTous);

      statistiques.forEach((stat) => {
        const option = document.createElement("option");

        option.value = String(stat.menuId);
        option.textContent = stat.menuNom;

        filtreMenu.appendChild(option);
      });
    } catch (erreur) {
      console.error("Erreur de chargement des menus :", erreur);
    }
  }

  if (formulaireFiltres) {
    formulaireFiltres.addEventListener("submit", async (evenement) => {
      evenement.preventDefault();

      if (
        filtreDateDebut?.value &&
        filtreDateFin?.value &&
        filtreDateDebut.value > filtreDateFin.value
      ) {
        afficherMessage(
          graphiqueCommandes,
          "La date de début doit précéder la date de fin.",
        );

        afficherMessage(graphiqueCA, "Veuillez corriger les dates.");

        return;
      }

      await chargerStatistiques();
    });
  }

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  chargerEmployes();

  if (
    totalCommandes &&
    chiffreAffaires &&
    graphiqueCommandes &&
    graphiqueCA &&
    tableauStatistiques
  ) {
    chargerMenusFiltres();
    chargerStatistiques();
  }
}

// Compatible avec le chargement dynamique de la SPA.
initialiserEspaceAdmin();
// =====================================================
// GESTION DES MENUS - ESPACE ADMINISTRATEUR
// =====================================================

function initialiserGestionMenusAdmin() {
  const API_MENUS = "/api/menus";

  const formulaireAjout = document.getElementById("formAjoutMenu");
  const listeMenus = document.getElementById("listeMenusAdmin");
  const totalMenus = document.getElementById("adminTotalMenus");
  const messageAjout = document.getElementById("messageAjoutMenu");
  const messageGestion = document.getElementById("messageGestionMenus");

  if (!formulaireAjout || !listeMenus) {
    return;
  }

  // Évite les événements en double dans la SPA.
  if (formulaireAjout.dataset.initialise === "true") {
    return;
  }

  formulaireAjout.dataset.initialise = "true";

  // =====================================================
  // AFFICHER LES MENUS
  // =====================================================

  async function chargerMenusAdmin() {
    listeMenus.replaceChildren();

    const ligneChargement = document.createElement("tr");
    const celluleChargement = document.createElement("td");

    celluleChargement.colSpan = 6;
    celluleChargement.textContent = "Chargement des menus...";

    ligneChargement.appendChild(celluleChargement);
    listeMenus.appendChild(ligneChargement);

    try {
      const reponse = await fetch(API_MENUS, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!reponse.ok) {
        throw new Error("Impossible de charger les menus.");
      }

      const resultat = await reponse.json();

      // Accepte une réponse sous forme de tableau
      // ou sous forme { menus: [...] }.
      const menus = Array.isArray(resultat) ? resultat : resultat.menus;

      if (!Array.isArray(menus)) {
        throw new Error("Format de réponse des menus incorrect.");
      }

      listeMenus.replaceChildren();

      if (totalMenus) {
        totalMenus.textContent = menus.length;
      }

      if (menus.length === 0) {
        const ligne = document.createElement("tr");
        const cellule = document.createElement("td");

        cellule.colSpan = 6;
        cellule.textContent = "Aucun menu enregistré.";

        ligne.appendChild(cellule);
        listeMenus.appendChild(ligne);

        return;
      }

      menus.forEach((menu) => {
        const ligne = document.createElement("tr");

        // IMAGE
        const celluleImage = document.createElement("td");

        if (menu.image) {
          const image = document.createElement("img");

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

        // NOM
        const celluleNom = document.createElement("td");
        celluleNom.textContent = menu.titre || "Sans titre";

        // THÈME
        const celluleTheme = document.createElement("td");

        celluleTheme.textContent =
          typeof menu.theme === "object"
            ? (menu.theme?.nom ?? "—")
            : (menu.theme ?? "—");

        // PRIX
        const cellulePrix = document.createElement("td");

        cellulePrix.textContent = new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(Number(menu.prix) || 0);

        // STOCK
        const celluleStock = document.createElement("td");
        celluleStock.textContent = menu.stock ?? 0;

        // ACTIONS
        // =====================================================
        // ACTIONS : MODIFIER ET SUPPRIMER
        // =====================================================

        const celluleActions = document.createElement("td");

        // BOUTON MODIFIER
        const boutonModifier = document.createElement("button");

        boutonModifier.type = "button";
        boutonModifier.className = "adminBouton";
        boutonModifier.textContent = "Modifier";

        boutonModifier.addEventListener("click", () => {
          const section = document.getElementById("sectionModificationMenu");

          if (!section) {
            console.error("Formulaire de modification introuvable.");
            return;
          }

          document.getElementById("modifMenuId").value = menu.id;
          document.getElementById("modifTitre").value = menu.titre ?? "";
          document.getElementById("modifDescription").value =
            menu.description ?? "";
          document.getElementById("modifPersonnes").value =
            menu.personnesMin ?? 1;
          document.getElementById("modifPrix").value = menu.prix ?? "";
          document.getElementById("modifStock").value = menu.stock ?? 0;

          document.getElementById("modifConditions").value = Array.isArray(
            menu.conditions,
          )
            ? menu.conditions.join("\n")
            : (menu.conditions ?? "");

          const themes = {
            Pâques: "1",
            Noël: "2",
            Classique: "3",
          };

          const regimes = {
            Classique: "1",
            Pescétarien: "2",
          };

          document.getElementById("modifTheme").value =
            themes[menu.theme] ?? "";

          document.getElementById("modifRegime").value =
            regimes[menu.regime] ?? "";

          document.getElementById("modifImages").value = "";

          section.hidden = false;

          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });

        // BOUTON SUPPRIMER
        const boutonSupprimer = document.createElement("button");

        boutonSupprimer.type = "button";
        boutonSupprimer.className = "adminBouton";
        boutonSupprimer.textContent = "Supprimer";

        boutonSupprimer.addEventListener("click", () => {
          const dialogue = document.getElementById("dialogSuppressionMenu");

          if (!dialogue) {
            console.error("Fenêtre de confirmation introuvable.");
            return;
          }

          document.getElementById("nomMenuSuppression").textContent =
            menu.titre;

          dialogue.dataset.menuId = menu.id;

          dialogue.showModal();
        });

        celluleActions.append(boutonModifier, boutonSupprimer);

        ligne.append(
          celluleImage,
          celluleNom,
          celluleTheme,
          cellulePrix,
          celluleStock,
          celluleActions,
        );

        listeMenus.appendChild(ligne);
      });
    } catch (erreur) {
      listeMenus.replaceChildren();

      const ligne = document.createElement("tr");
      const cellule = document.createElement("td");

      cellule.colSpan = 6;
      cellule.textContent = erreur.message;

      ligne.appendChild(cellule);
      listeMenus.appendChild(ligne);

      if (totalMenus) {
        totalMenus.textContent = "—";
      }

      console.error("Erreur menus administrateur :", erreur);
    }
  }

  // =====================================================
  // AJOUTER UN MENU AVEC SES IMAGES
  // =====================================================

  formulaireAjout.addEventListener("submit", async (evenement) => {
    evenement.preventDefault();

    const bouton = formulaireAjout.querySelector('button[type="submit"]');

    const donnees = new FormData(formulaireAjout);

    const fichiers = document.getElementById("ajoutImages")?.files;

    if (fichiers && fichiers.length > 10) {
      messageAjout.textContent = "Vous pouvez ajouter au maximum 10 images.";
      return;
    }

    if (fichiers) {
      for (const fichier of fichiers) {
        if (fichier.size > 5 * 1024 * 1024) {
          messageAjout.textContent = "Chaque image doit faire moins de 5 Mo.";
          return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(fichier.type)) {
          messageAjout.textContent = "Format accepté : JPG, PNG ou WEBP.";
          return;
        }
      }
    }

    if (bouton) {
      bouton.disabled = true;
    }

    if (messageAjout) {
      messageAjout.textContent = "Création du menu en cours...";
    }

    try {
      const reponse = await fetch(API_MENUS, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        body: donnees,
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.erreur || resultat.message || "Impossible de créer le menu.",
        );
      }

      if (messageAjout) {
        messageAjout.textContent =
          resultat.message || "Menu créé avec succès !";
      }

      formulaireAjout.reset();

      await chargerMenusAdmin();
    } catch (erreur) {
      if (messageAjout) {
        messageAjout.textContent = erreur.message;
      }

      console.error("Erreur création du menu :", erreur);
    } finally {
      if (bouton) {
        bouton.disabled = false;
      }
    }
  });
// =====================================================
// ENREGISTRER LES MODIFICATIONS D'UN MENU
// =====================================================

const formulaireModification = document.getElementById(
    "formModificationMenu"
);

const sectionModification = document.getElementById(
    "sectionModificationMenu"
);

const messageModification = document.getElementById(
    "messageModificationMenu"
);

if (formulaireModification) {

    formulaireModification.addEventListener("submit", async (evenement) => {

        evenement.preventDefault();

        const id = document.getElementById("modifMenuId").value;
        const donnees = new FormData(formulaireModification);
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
                        "Accept": "application/json"
                    },
                    body: donnees
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.erreur ||
                    resultat.message ||
                    "Impossible de modifier le menu."
                );
            }

            formulaireModification.reset();
            sectionModification.hidden = true;

            if (messageGestion) {
                messageGestion.textContent =
                    "Menu modifié avec succès !";
            }

            await chargerMenusAdmin();

        } catch (erreur) {

            if (messageModification) {
                messageModification.textContent = erreur.message;
            }

            console.error("Erreur modification :", erreur);

        } finally {

            if (bouton) bouton.disabled = false;
        }
    });
}

// ANNULER LA MODIFICATION

document.getElementById("annulerModificationMenu")
    ?.addEventListener("click", () => {

        formulaireModification?.reset();

        if (sectionModification) {
            sectionModification.hidden = true;
        }
    });

// =====================================================
// SUPPRIMER UN MENU
// =====================================================

const dialogueSuppression = document.getElementById(
    "dialogSuppressionMenu"
);

document.getElementById("annulerSuppressionMenu")
    ?.addEventListener("click", () => {

        dialogueSuppression?.close();
    });

document.getElementById("confirmerSuppressionMenu")
    ?.addEventListener("click", async (evenement) => {

        const id = dialogueSuppression?.dataset.menuId;

        if (!id) return;

        const bouton = evenement.currentTarget;
        bouton.disabled = true;

        try {

            const reponse = await fetch(
                `${API_MENUS}/${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.erreur ||
                    resultat.message ||
                    "Impossible de supprimer le menu."
                );
            }

            dialogueSuppression.close();

            if (messageGestion) {
                messageGestion.textContent =
                    "Menu supprimé avec succès !";
            }

            await chargerMenusAdmin();

        } catch (erreur) {

            if (messageGestion) {
                messageGestion.textContent = erreur.message;
            }

            console.error("Erreur suppression :", erreur);

        } finally {

            bouton.disabled = false;
        }
    });
  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  chargerMenusAdmin();
}

// Compatible avec le chargement dynamique de ta SPA.
initialiserGestionMenusAdmin();
// =====================================================
// NAVIGATION ENTRE LES SECTIONS ADMINISTRATEUR
// =====================================================

function initialiserNavigationAdmin() {
    const espaceAdmin = document.querySelector(".espaceAdmin");

    if (!espaceAdmin) return;

    const liens = espaceAdmin.querySelectorAll(
        '.adminActions a[href^="#"]'
    );

    liens.forEach((lien) => {

        if (lien.dataset.navigationInitialisee === "true") {
            return;
        }

        lien.dataset.navigationInitialisee = "true";

        lien.addEventListener("click", (evenement) => {
            const idSection = lien.getAttribute("href").slice(1);
            const section = document.getElementById(idSection);

            if (!section) return;

            evenement.preventDefault();
            evenement.stopPropagation();

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

initialiserNavigationAdmin();