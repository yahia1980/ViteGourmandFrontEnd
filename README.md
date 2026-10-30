# Vite & Gourmand

## Présentation du projet

**Vite & Gourmand** est une application web de gestion d'un service de restauration et de commande de menus.

Ce projet est réalisé dans le cadre de ma formation chez **Studi**.

L'application permet aux clients de consulter les menus, de créer un compte et de passer des commandes. Elle comprend également des espaces réservés aux employés et aux administrateurs.

## Fonctionnalités

### Espace public
- Consultation des menus et des plats
- Consultation des horaires
- Formulaire de contact
- Inscription et connexion

### Espace client
- Gestion du compte utilisateur
- Passage de commandes
- Consultation de ses commandes
- Annulation d'une commande selon les règles de l'application

### Espace employé
- Gestion des menus et des plats
- Suivi des commandes
- Gestion des avis clients
- Modification des horaires

### Espace administrateur
- Accès aux fonctionnalités d'administration
- Consultation des statistiques des commandes

## Technologies utilisées

| Partie | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, Vite |
| Backend | PHP 8.3, Symfony 7.4 |
| Base de données relationnelle | MySQL 8 |
| Base de données NoSQL | MongoDB |
| Conteneurisation | Docker, Docker Compose |
| Versionnement | Git, GitHub |

## Installation en local

### Prérequis

- Git
- Docker Desktop avec Docker Compose

### 1. Cloner le projet

```bash
git clone URL_DU_DEPOT_GITHUB
cd ViteGourmandFrontEndBackEnd
```

Remplacer `URL_DU_DEPOT_GITHUB` par l'adresse du dépôt.

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet avec les variables nécessaires au fonctionnement de MySQL.

```dotenv
MYSQL_ROOT_PASSWORD=mot_de_passe_local
MYSQL_PASSWORD_URL=mot_de_passe_local
```

Ces valeurs sont uniquement des exemples. Les mots de passe réels ne doivent jamais être publiés sur GitHub.

### 3. Démarrer les conteneurs

```bash
docker compose -f compose.docker.yaml up -d --build
```

### 4. Accéder à l'application

- Frontend : http://localhost:5173
- API Symfony : http://localhost:8000

### 5. Arrêter les conteneurs

```bash
docker compose -f compose.docker.yaml down
```

Les volumes Docker permettent de conserver les données MySQL et MongoDB lors de l'arrêt des conteneurs.

## Architecture du projet

Le projet repose sur quatre services Docker :

- **Frontend** : interface utilisateur développée avec Vite.
- **Backend** : API développée avec Symfony.
- **MySQL** : stockage des données relationnelles.
- **MongoDB** : stockage des données statistiques.

Le frontend communique avec l'API Symfony, qui utilise les bases de données selon les besoins de l'application.

## Sécurité

L'application utilise le système de sécurité Symfony avec authentification et contrôle d'accès selon les rôles :

- `ROLE_USER` : client
- `ROLE_EMPLOYE` : employé
- `ROLE_ADMIN` : administrateur

Les fichiers contenant les secrets locaux sont exclus du versionnement Git.

## Déploiement

*## Déploiement en production

**Statut : application déployée et accessible en ligne.**

### Accès à l'application

- **URL du site :** https://fethi.alwaysdata.net/
- **Hébergeur :** alwaysdata
- **Environnement :** production

### Infrastructure de production

L'application est hébergée sur alwaysdata et repose sur les technologies suivantes :

| Composant | Technologie |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, Vite |
| Backend | PHP, Symfony 7.4 |
| Base de données relationnelle | MariaDB (alwaysdata) |
| Base de données NoSQL | MongoDB Atlas |
| Hébergement | alwaysdata |
| Versionnement | Git et GitHub |

Contrairement à l'environnement local, le déploiement en production ne repose pas sur les conteneurs Docker.

### Organisation des fichiers sur le serveur

Le projet est installé dans le répertoire `~/vite-gourmand`.

```text
vite-gourmand/
├── backend/
│   ├── config/
│   ├── public/
│   ├── src/
│   ├── var/
│   ├── vendor/
│   └── ...
├── dist/
│   ├── pages/
│   ├── src/
│   ├── images/
│   └── ...
└── ...
```

- `backend/` contient l'API Symfony.
- `dist/` contient les fichiers statiques du frontend compilés avec Vite.

### Compilation du frontend

Le frontend est développé avec Vite.

Pour générer les fichiers destinés à la production, exécuter à la racine du projet :

```bash
npm install
npm run build
```

La compilation génère le dossier `dist/`, qui contient les ressources du site à déployer.

### Configuration du backend Symfony

Le backend Symfony utilise un environnement de production.

Les dépendances PHP sont installées avec Composer :

```bash
cd ~/vite-gourmand/backend
composer install --no-dev --optimize-autoloader
```

Après une modification de la configuration ou du code Symfony, le cache de production peut être vidé avec :

```bash
APP_ENV=prod APP_DEBUG=0 php bin/console cache:clear
```

### Bases de données

**MariaDB**

La base de données relationnelle est hébergée sur alwaysdata. Elle contient notamment les utilisateurs, les menus, les plats, les commandes et les avis.

La connexion est configurée dans Symfony au moyen de la variable d'environnement `DATABASE_URL`.

**MongoDB Atlas**

MongoDB Atlas est utilisé pour les statistiques des commandes consultées dans l'espace administrateur.

La connexion est configurée avec la variable d'environnement `MONGODB_URL`.

Une commande Symfony permet de synchroniser les statistiques à partir des commandes existantes :

```bash
APP_ENV=prod APP_DEBUG=0 php bin/console app:sync-statistiques
```

### Sécurité des variables d'environnement

Les informations sensibles sont configurées directement sur le serveur de production.

Les fichiers tels que `.env.local` et `.env.prod.local` ne doivent pas être publiés sur GitHub.

Les mots de passe, chaînes de connexion et clés d'accès ne doivent jamais apparaître dans le dépôt public.

### Vérification du déploiement

Après la mise en ligne, les fonctionnalités suivantes ont été vérifiées :

- Affichage du site et consultation des menus.
- Communication entre le frontend et l'API Symfony.
- Accès aux données MariaDB.
- Gestion des menus et de leurs images.
- Connexion à MongoDB Atlas.
- Affichage des statistiques dans l'espace administrateur.

**Application en ligne :** https://fethi.alwaysdata.net/

## Auteur

Projet réalisé dans le cadre de la formation Studi.