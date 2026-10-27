import Route from "./Route.js";


// Définition des routes

export const allRoutes = [

    new Route(
        "/",
        "Accueil",
        "/pages/Accueil.html",
        ["/src/js/main.js",
        "/src/js/contact.js",
        ],
        ["/src/css/pages/accueil.css",
         "/src/css/pages/form.css"
        ]
    ),

    new Route(
        "/404",
        "Page introuvable",
        "/pages/404.html",
        "/src/js/main.js"
    ),

    new Route(
        "/menus",
        "Menus",
        "/pages/menus.html",
        ["/src/js/menus.js", "/src/js/main.js"],
        ["/src/css/pages/menus.css",
         "/src/css/pages/form.css"
        ],
    ),
    new Route(
        "/detail-menu",
        "Détail menu",
        "/pages/detail-menu.html",
        ["/src/js/detail-menu.js", "/src/js/main.js"],
        ["/src/css/pages/detail-menu.css", ]
    ),

    new Route(
        "/contact",
        "Contact",
        "/pages/contact.html",
        ["/src/js/main.js",
         "/src/js/contact.js"
        ],
        ["/src/css/pages/contact.css",
         "/src/css/pages/form.css"
        ]
    ),
    new Route(
        "/inscription",
        "Inscription",
        "/pages/auth/inscription.html",
        ["/src/js/main.js",
         "/src/js/inscription.js"
        ],
        ["/src/css/pages/inscription.css",
         "/src/css/pages/form.css"
        ]
    ),

    new Route(
        "/connexion",
        "Connexion",
        "/pages/auth/connexion.html",
        ["/src/js/main.js",
        "/src/js/connexion.js"],
        ["/src/css/pages/connexion.css",
         "/src/css/pages/form.css"
        ]
    ),
    new Route (
        "/compte",
        "Compte",
        "/pages/auth/compte.html",
        ["/src/js/main.js",
        "/src/js/compte.js"
        ],
        ["/src/css/pages/compte.css",
         "/src/css/pages/form.css"
        ]
    ),
     new Route (
        "/mdp_oublie",
        "Changement de mot de passe",
        "/pages/auth/mdp_oublie.html",
        ["/src/js/main.js",
         "/src/js/mdp-oublie.js"
        ],
        ["/src/css/pages/mdp_oublie.css",
         "/src/css/pages/form.css"
        ]
    ),
    new Route (
        "/modifier-profil",
        "Modifier profil",
        "/pages/auth/modifier-profil.html",
        ["/src/js/main.js",
         "/src/js/modifier-profil.js"
        ],
        ["/src/css/pages/modifier-profil.css",
         "/src/css/pages/form.css"
        ]
    ),
     new Route (
        "/reserver",
        "Reservation",
        "/pages/reserver.html",
        ["/src/js/main.js",
        "/src/js/reserver.js"
        ],
        ["/src/css/pages/reserver.css",
         "/src/css/pages/form.css"
        ]
    ),
     new Route (
        "/espace-employe",
        "Espace employe",
        "/pages/espace-employe.html",
        ["/src/js/main.js",
         "/src/js/compte.js",
         "/src/js/connexion.js",
         "/src/js/espace-employe.js"
        ],
        "/src/css/pages/espace_employe.css"
    ),
    new Route (
        "/espace-admin",
        "Espace admin",
        "/pages/espace-admin.html",
        ["/src/js/main.js",
         "/src/js/compte.js",
         "/src/js/connexion.js",
         "/src/js/espace-admin.js"
        ],
        "/src/css/pages/espace_admin.css"
    ),
    new Route (
        "/mention-legale",
        "Mention legale",
        "/pages/megale/mention-legale.html",
        "/src/js/main.js",
        "/src/css/pages/commun-ml-cgv.css"
    ),
    new Route (
        "/cgv",
        "Conditions générales des ventes",
        "/pages/megale/cgv.html",
        "/src/js/main.js",
        "/src/css/pages/commun-ml-cgv.css"
    )


];


// Nom du site

export const websiteName = "Vite Gourmand";

