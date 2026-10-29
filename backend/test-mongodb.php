<?php

require __DIR__ . '/vendor/autoload.php';

try {
   $mongoUrl = $_ENV['MONGODB_URL']
    ?? getenv('MONGODB_URL')
    ?: 'mongodb://127.0.0.1:27017';

$client = new MongoDB\Client($mongoUrl);
    $databases = $client->listDatabases();

    echo "Connexion MongoDB réussie !\n";

    foreach ($databases as $database) {
        echo $database->getName() . "\n";
    }
} catch (Throwable $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
}