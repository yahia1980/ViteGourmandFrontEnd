/* ==========================================
   CHARGEMENT DU PROFIL UTILISATEUR
========================================== */

async function chargerCompte() {
  const nomUtilisateur = document.getElementById("nomUtilisateur");

  if (!nomUtilisateur) {
    return;
  }

  try {
    const response = await fetch("/api/profil", {
      method: "GET",
      credentials: "include",
    });

    console.log("Statut profil :", response.status);

    if (response.status === 401) {
      console.log("Utilisateur non connecté");
      nomUtilisateur.textContent = "Visiteur";
      return;
    }

    if (!response.ok) {
      throw new Error("Impossible de charger le profil");
    }

    const utilisateur = await response.json();

    console.log("Profil récupéré avec succès");

    nomUtilisateur.textContent = utilisateur.prenom || "Utilisateur";
  } catch (error) {
    console.error("Erreur chargement du compte :", error);
  }
}

/* ==========================================
   CHARGEMENT DES COMMANDES
========================================== */

async function chargerMesReservations() {
  const listeCommandes = document.getElementById("listeCommandes");
  const messageReservations = document.getElementById("messageReservations");

  if (!listeCommandes) {
    return;
  }

  listeCommandes.replaceChildren();

  if (messageReservations) {
    messageReservations.textContent = "Chargement de vos commandes...";
  }

  try {
    const response = await fetch("/api/commandes", {
      method: "GET",
      credentials: "include",
    });

    console.log("Statut commandes :", response.status);

    if (response.status === 401 || response.status === 403) {
      if (messageReservations) {
        messageReservations.textContent =
          "Veuillez vous connecter pour consulter vos commandes.";
      }
      return;
    }

    if (!response.ok) {
      throw new Error("Impossible de charger les commandes");
    }

    const data = await response.json();
    const commandes = data.commandes;

    if (!Array.isArray(commandes)) {
      throw new Error("Format des commandes invalide");
    }

    if (commandes.length === 0) {
      if (messageReservations) {
        messageReservations.textContent =
          "Vous n'avez pas encore effectué de commande.";
      }
      return;
    }

    if (messageReservations) {
      messageReservations.textContent = "";
    }

    /* ==========================================
           FORMATAGE DES DONNÉES
        ========================================== */

    const formatPrix = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    });

    const formatDate = (date) => {
      if (!date) {
        return "Non renseignée";
      }

      const valeur = new Date(date.replace(" ", "T"));

      return Number.isNaN(valeur.getTime())
        ? date
        : valeur.toLocaleString("fr-FR");
    };

    const formatMontant = (valeur) => {
      const nombre = Number(valeur);

      return Number.isFinite(nombre)
        ? formatPrix.format(nombre)
        : "Non renseigné";
    };

    const nomsStatuts = {
      en_attente: "En attente",
      acceptee: "Acceptée",
      en_preparation: "En préparation",
      en_livraison: "En livraison",
      livree: "Livrée",
      annulee: "Annulée",
    };

    /* ==========================================
           AFFICHAGE DES COMMANDES
        ========================================== */

    commandes.forEach((commande) => {
      const article = document.createElement("article");
      article.className = "carteReservation";

      const titre = document.createElement("h3");
      titre.textContent = `Commande n° ${commande.id}`;

      const menu = document.createElement("p");
      menu.textContent = `Menu : ${commande.menu}`;

      const personnes = document.createElement("p");
      personnes.textContent = `Nombre de personnes : ${commande.nombrePersonnes}`;

      const date = document.createElement("p");
      date.textContent = `Date de prestation : ${formatDate(commande.datePrestation)}`;

      const montant = document.createElement("p");
      montant.textContent = `Montant total : ${formatMontant(commande.montantTotal)}`;

      const statut = document.createElement("p");
statut.className = "commandeStatut";

const badgeStatut = document.createElement("span");
badgeStatut.className = "badgeStatut";

const statutsAutorises = [
    "en_attente",
    "acceptee",
    "en_preparation",
    "en_livraison",
    "livree",
    "annulee"
];

if (statutsAutorises.includes(commande.statut)) {
    badgeStatut.classList.add(`statut-${commande.statut}`);
}

badgeStatut.textContent =
    nomsStatuts[commande.statut] || commande.statut || "Inconnu";

statut.append("Statut : ", badgeStatut);

      /* ==========================================
               BOUTON VOIR LES DÉTAILS
            ========================================== */

      const boutonDetails = document.createElement("button");

      boutonDetails.type = "button";
      boutonDetails.className = "btnDetailsCommande";
      boutonDetails.textContent = "Voir les détails";
      boutonDetails.setAttribute("aria-expanded", "false");

      /* ==========================================
               CONTENEUR DES DÉTAILS
            ========================================== */

      const details = document.createElement("div");

      details.className = "detailsCommande";
      details.hidden = true;

      details.id = `detailsCommande-${commande.id}`;

      boutonDetails.setAttribute("aria-controls", details.id);

      const creerLigne = (libelle, valeur) => {
        const paragraphe = document.createElement("p");

        paragraphe.textContent = `${libelle} : ${valeur}`;

        return paragraphe;
      };

      const sousTotal =
        Number(commande.prixParPersonne) * Number(commande.nombrePersonnes);

      details.append(
        creerLigne("Date de commande", formatDate(commande.dateCommande)),
        creerLigne("Adresse", commande.adresseLivraison || "Non renseignée"),
        creerLigne(
          "Code postal",
          commande.codePostalLivraison || "Non renseigné",
        ),
        creerLigne("Ville", commande.villeLivraison || "Non renseignée"),
        creerLigne(
          "Prix par personne",
          formatMontant(commande.prixParPersonne),
        ),
        creerLigne("Sous-total", formatMontant(sousTotal)),
        creerLigne("Réduction", formatMontant(commande.montantReduction)),
        creerLigne(
          "Frais de livraison",
          formatMontant(commande.fraisLivraison),
        ),
        creerLigne("Total", formatMontant(commande.montantTotal)),
      );

      /* ==========================================
               AFFICHER / MASQUER LES DÉTAILS
            ========================================== */

      boutonDetails.addEventListener("click", () => {
        const ouvert = details.hidden;

        details.hidden = !ouvert;

        boutonDetails.textContent = ouvert
          ? "Masquer les détails"
          : "Voir les détails";

        boutonDetails.setAttribute("aria-expanded", String(ouvert));
      });

      /* ==========================================
   BOUTON ANNULER LA COMMANDE
========================================== */

      let boutonAnnuler = null;

      if (commande.statut === "en_attente") {
        boutonAnnuler = document.createElement("button");

        boutonAnnuler.type = "button";
        boutonAnnuler.className = "btnAnnulerCommande";
        boutonAnnuler.textContent = "Annuler la commande";

        boutonAnnuler.addEventListener("click", async () => {
          const confirmation = window.confirm(
            `Voulez-vous vraiment annuler la commande n° ${commande.id} ?`,
          );

          if (!confirmation) {
            return;
          }

          boutonAnnuler.disabled = true;
          boutonAnnuler.textContent = "Annulation en cours...";

          try {
            const response = await fetch(
              `/api/commandes/${commande.id}/annuler`,
              {
                method: "PATCH",
                credentials: "include",
              },
            );

            const resultat = await response.json();

            if (!response.ok) {
              throw new Error(
                resultat.message || "Impossible d'annuler la commande.",
              );
            }

            // Recharger les commandes depuis MySQL
            await chargerMesReservations();
          } catch (error) {
            console.error("Erreur annulation :", error);

            window.alert(error.message);

            boutonAnnuler.disabled = false;
            boutonAnnuler.textContent = "Annuler la commande";
          }
        });
      }

      /* ==========================================
               AJOUT DE LA CARTE DANS LA PAGE
            ========================================== */

      article.append(
        titre,
        menu,
        personnes,
        date,
        montant,
        statut,
        boutonDetails,
        details,
      );

      if (boutonAnnuler) {
        article.appendChild(boutonAnnuler);
      }

      listeCommandes.appendChild(article);
    });

    console.log(`${commandes.length} commande(s) affichée(s)`);
  } catch (error) {
    console.error("Erreur chargement des commandes :", error);

    if (messageReservations) {
      messageReservations.textContent =
        "Une erreur est survenue lors du chargement de vos commandes.";
    }
  }
}

/* ==========================================
   NAVIGATION VERS MES COMMANDES
========================================== */

function initialiserLienMesCommandes() {
  const lienMesCommandes = document.querySelector(
    '.monCompte a[href="#mesCommandes"]',
  );

  if (!lienMesCommandes) {
    return;
  }

  lienMesCommandes.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const section = document.getElementById("mesCommandes");
    const liste = document.getElementById("listeCommandes");

    if (!section || !liste) {
      return;
    }

    // Recharger uniquement si la liste est vide
    if (liste.children.length === 0) {
      await chargerMesReservations();
    }

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/* ==========================================
   INITIALISATION DE LA PAGE COMPTE
========================================== */

chargerCompte();
chargerMesReservations();
initialiserLienMesCommandes();
