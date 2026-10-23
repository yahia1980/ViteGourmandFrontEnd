import Route from "./Route.js";


// Définition des routes

export const allRoutes = [

    new Route(
        "/",
        "Accueil",
        "/pages/Accueil.html",
        ["/src/js/main.js",
         "valide-form.js"
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
        ]
    ),

    new Route(
        "/contact",
        "Contact",
        "/pages/contact.html",
        ["/src/js/main.js",
            "valide-form.js"],
        ["/src/css/pages/contact.css",
         "/src/css/pages/form.css"
        ]
    ),
    new Route(
        "/inscription",
        "Inscription",
        "/pages/auth/inscription.html",
        ["/src/js/main.js",
            "valide-form.js"],
        ["/src/css/pages/inscription.css",
         "/src/css/pages/form.css"
        ]
    ),

    new Route(
        "/connexion",
        "Connexion",
        "/pages/auth/connexion.html",
        ["/src/js/main.js",
            "valide-form.js"],
        ["/src/css/pages/connexion.css",
         "/src/css/pages/form.css"
        ]
    ),
    new Route (
        "/compte",
        "Compte",
        "/pages/auth/compte.html",
        "/src/js/main.js",
        ["/src/css/pages/compte.css",
         "/src/css/pages/form.css"
        ]
    ),
     new Route (
        "/mdp_oublie",
        "Changement de mot de passe",
        "/pages/auth/mdp_oublie.html",
        ["/src/js/main.js",
            "valide-form.js"],
        ["/src/css/pages/mdp_oublie.css",
         "/src/css/pages/form.css"
        ]
    ),
     new Route (
        "/reserver",
        "Reservation",
        "/pages/reserver.html",
        ["/src/js/main.js",
            "valide-form.js"],
        ["/src/css/pages/reserver.css",
         "/src/css/pages/form.css"
        ]
    ),
     new Route (
        "/espace-employe",
        "Espace employe",
        "/pages/espace-employe.html",
        "/src/js/main.js",
        "/src/css/pages/espace-employe.css"
    ),
    new Route (
        "/espace-admin",
        "Espace admin",
        "/pages/espace-admin.html",
        "/src/js/main.js",
        "/src/css/pages/espace-admin.css"
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

