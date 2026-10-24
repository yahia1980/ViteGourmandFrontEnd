<?php

require __DIR__ . '/vendor/autoload.php';

try {
    $client = new MongoDB\Client('mongodb://127.0.0.1:27017');

    $databases = $client->listDatabases();

    echo "Connexion MongoDB réussie !\n";

    foreach ($databases as $database) {
        echo $database->getName() . "\n";
    }
} catch (Throwable $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
}