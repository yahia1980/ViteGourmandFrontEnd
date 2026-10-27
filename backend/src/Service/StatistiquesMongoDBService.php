<?php

namespace App\Service;

use App\Entity\Commande;
use MongoDB\Client;
use MongoDB\Collection;
use MongoDB\BSON\UTCDateTime;

class StatistiquesMongoDBService
{
    private Collection $collection;

    public function __construct()
    {
        $client = new Client('mongodb://127.0.0.1:27017');

        $database = $client->selectDatabase('vite_gourmand');

        $this->collection = $database->selectCollection(
            'statistiques_commandes'
        );
    }

    public function enregistrerCommande(Commande $commande): void
    {
        $menu = $commande->getMenu();

        if ($commande->getId() === null || $menu === null) {
            throw new \InvalidArgumentException(
                'La commande doit être enregistrée et associée à un menu.'
            );
        }

        $dateCommande = $commande->getDateCommande();

        if ($dateCommande === null) {
            throw new \InvalidArgumentException(
                'La date de commande est obligatoire.'
            );
        }

        $dateMongo = new UTCDateTime(
            $dateCommande->getTimestamp() * 1000
        );

        $donnees = [
            'commandeId' => $commande->getId(),
            'menuId' => $menu->getId(),
            'menuNom' => $menu->getTitre(),
            'dateCommande' => $dateMongo,
            'montantTotal' => (float) $commande->getMontantTotal(),
            'fraisLivraison' => (float) $commande->getFraisLivraison(),
            'statut' => $commande->getStatut(),
        ];

        $this->collection->updateOne(
            ['commandeId' => $commande->getId()],
            ['$set' => $donnees],
            ['upsert' => true]
        );
    }
}
