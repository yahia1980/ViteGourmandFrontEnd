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

**Statut : en préparation.**

Cette section sera complétée après la mise en ligne de l'application.

- URL du site : à ajouter
- Hébergement : à préciser
- Configuration de production : à documenter

## Auteur

Projet réalisé dans le cadre de la formation Studi.