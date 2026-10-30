
FROM php:8.3-cli-bookworm

# Installer les outils et bibliothèques nécessaires
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
    libssl-dev \
    pkg-config \
    && docker-php-ext-install pdo_mysql intl zip \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && rm -rf /var/lib/apt/lists/*

# Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Dossier de travail Symfony
WORKDIR /app

# Copier le backend
COPY backend/ .

# Installer les dépendances PHP
RUN APP_ENV=prod composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Exposer le port du serveur Symfony
EXPOSE 8000

# Démarrer Symfony avec le serveur PHP intégré (développement)
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
