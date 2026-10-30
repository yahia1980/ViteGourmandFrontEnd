/* ==========================================
   VITE & GOURMAND - COMMANDE D'UN MENU
   ========================================== */

(() => {
  const formulaire = document.querySelector("#formReserver");
  if (!formulaire) return;

  const champs = {
    prenom: document.querySelector("#reserverPrenom"),
    nom: document.querySelector("#reserverNom"),
    email: document.querySelector("#reserverEmail"),
    telephone: document.querySelector("#reserverTel"),
    adresse: document.querySelector("#reserverAdresse"),
    ville: document.querySelector("#reserverVille"),
    codePostal: document.querySelector("#reserverCodePostal"),
    date: document.querySelector("#reserverDate"),
    heure: document.querySelector("#reserverHeure"),
    lieu: document.querySelector("#reserverLieu"),
    menu: document.querySelector("#reserverMenu"),
    personnes: document.querySelector("#nbr"),
    allergies: document.querySelector("#allergie"),
  };

  const bouton = document.querySelector("#validerCommande");
  const message = document.querySelector("#messageCommande");
  const minimum = document.querySelector("#minimumPersonnes");

  const recap = {
    menu: document.querySelector("#recapMenu"),
    personnes: document.querySelector("#recapPersonnes"),
    prix: document.querySelector("#recapPrixMenu"),
    reduction: document.querySelector("#recapReduction"),
    livraison: document.querySelector("#recapLivraison"),
    total: document.querySelector("#recapTotal"),
  };

  let menus = [];
  let profil = null;
  let envoiEnCours = false;

  const euros = (montant) =>
    `${Number(montant).toFixed(2).replace(".", ",")} €`;

  function afficherMessage(texte, erreur = false) {
    if (!message) return;
    message.textContent = texte;
    message.style.color = erreur ? "crimson" : "green";
  }

  function menuActuel() {
    return menus.find((menu) => String(menu.id) === champs.menu.value);
  }

  function calculerPrix() {
    const menu = menuActuel();
    const personnes = Number(champs.personnes.value);

    if (
      !menu ||
      !Number.isInteger(personnes) ||
      personnes < Number(menu.personnesMin)
    ) {
      recap.menu.textContent = menu?.titre || "—";
      recap.personnes.textContent = personnes || "—";
      recap.prix.textContent = "—";
      recap.reduction.textContent = "—";
      recap.livraison.textContent = "—";
      recap.total.textContent = "—";
      bouton.disabled = true;
      return;
    }

    const sousTotal = Number(menu.prix) * personnes;
    const reduction =
      personnes >= Number(menu.personnesMin) + 5 ? sousTotal * 0.1 : 0;

    // Même simulation temporaire que le contrôleur Symfony.
    const ville = champs.ville.value.trim().toLowerCase();
    const livraison = !ville ? null : ville === "bordeaux" ? 0 : 5 + 0.59 * 20;

    recap.menu.textContent = menu.titre;
    recap.personnes.textContent = String(personnes);
    recap.prix.textContent = euros(sousTotal);
    recap.reduction.textContent = `- ${euros(reduction)}`;
    recap.livraison.textContent =
      livraison === null ? "À calculer" : euros(livraison);
    recap.total.textContent =
      livraison === null
        ? "À calculer"
        : euros(sousTotal - reduction + livraison);

    bouton.disabled =
      envoiEnCours || livraison === null || !formulaire.checkValidity();
  }

  async function chargerMenus() {
    const reponse = await fetch("/api/api/menus", {
      credentials: "include",
    });

    if (!reponse.ok) {
      throw new Error("Impossible de charger les menus.");
    }

    const donnees = await reponse.json();
    if (!Array.isArray(donnees)) {
      throw new Error("Liste des menus invalide.");
    }

    menus = donnees;

    champs.menu.replaceChildren();

    const placeholder = new Option("Sélectionnez un menu", "");
    champs.menu.add(placeholder);

    menus.forEach((menu) => {
      champs.menu.add(
        new Option(`${menu.titre} - ${euros(menu.prix)}`, String(menu.id)),
      );
    });

    try {
      const selection = JSON.parse(sessionStorage.getItem("menuSelectionne"));

      if (
        selection?.id != null &&
        menus.some((menu) => String(menu.id) === String(selection.id))
      ) {
        champs.menu.value = String(selection.id);
      }
    } catch (erreur) {
      console.warn("Menu sélectionné illisible.", erreur);
    }

    mettreAJourMinimum();
  }

  async function chargerProfil() {
    const reponse = await fetch("/api/api/profil", {
      credentials: "include",
    });

    if (reponse.status === 401) {
      throw new Error("Connectez-vous pour passer une commande.");
    }

    if (!reponse.ok) {
      throw new Error("Impossible de charger votre profil.");
    }

    profil = await reponse.json();
    remplirProfil();
  }

  function remplirProfil() {
    if (!profil) return;

    champs.prenom.value = profil.prenom || "";
    champs.nom.value = profil.nom || "";
    champs.email.value = profil.email || "";
    champs.telephone.value = profil.telephone || "";
    champs.adresse.value = profil.adresse || "";
    champs.ville.value = profil.ville || "";
    champs.codePostal.value = profil.codePostal || "";
  }

  function mettreAJourMinimum() {
    const menu = menuActuel();

    if (menu) {
      const min = Math.max(1, Number(menu.personnesMin) || 1);
      champs.personnes.min = String(min);
      minimum.textContent = `Minimum ${min} personnes pour ce menu.`;

      if (!champs.personnes.value || Number(champs.personnes.value) < min) {
        champs.personnes.value = String(min);
      }
    } else {
      champs.personnes.min = "1";
      minimum.textContent = "Le minimum dépend du menu choisi.";
    }

    calculerPrix();
  }

  function definirDateMinimum() {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
    const jour = String(maintenant.getDate()).padStart(2, "0");

    champs.date.min = `${annee}-${mois}-${jour}`;
  }

  formulaire.addEventListener("input", calculerPrix);

  champs.menu.addEventListener("change", mettreAJourMinimum);
  champs.ville.addEventListener("change", calculerPrix);

  formulaire.addEventListener("reset", () => {
    queueMicrotask(() => {
      remplirProfil();
      mettreAJourMinimum();
      calculerPrix();
    });
  });

  formulaire.addEventListener("submit", async (evenement) => {
    evenement.preventDefault();

    if (envoiEnCours || !formulaire.reportValidity()) return;

    const menu = menuActuel();

    if (!menu) {
      afficherMessage("Sélectionnez un menu.", true);
      return;
    }

    const datePrestation = `${champs.date.value}T${champs.heure.value}:00`;

    const donnees = {
      menuId: Number(menu.id),
      nombrePersonnes: Number(champs.personnes.value),
      adresseLivraison: champs.adresse.value.trim(),
      codePostalLivraison: champs.codePostal.value.trim(),
      villeLivraison: champs.ville.value.trim(),
      datePrestation,
      allergies: champs.allergies.value.trim() || null,
      precisionLivraison: champs.lieu.value.trim() || null,
    };

    envoiEnCours = true;
    bouton.disabled = true;
    afficherMessage("Enregistrement de votre commande...");

    try {
      const reponse = await fetch("/api/api/commandes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donnees),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.message || "Impossible d'enregistrer la commande.",
        );
      }

      afficherMessage(
        `Commande n°${resultat.commandeId} enregistrée avec succès ! ` +
          `Montant total : ${euros(resultat.montantTotal)}.`,
      );

      sessionStorage.removeItem("menuSelectionne");
      // Redirection vers l'espace client après une commande réussie
      window.location.href = "/compte";
    } catch (erreur) {
      afficherMessage(erreur.message, true);
    } finally {
      envoiEnCours = false;
      calculerPrix();
    }
  });

  async function initialiser() {
    bouton.disabled = true;
    definirDateMinimum();

    try {
      await Promise.all([chargerMenus(), chargerProfil()]);

      calculerPrix();
    } catch (erreur) {
      afficherMessage(erreur.message, true);
      bouton.disabled = true;
    }
  }

  initialiser();
})();
