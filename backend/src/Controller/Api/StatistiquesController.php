<?php

namespace App\Controller\Api;

use MongoDB\Client;
use MongoDB\BSON\UTCDateTime;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/statistiques')]
#[IsGranted('ROLE_ADMIN')]
class StatistiquesController extends AbstractController
{
    #[Route('', name: 'api_admin_statistiques', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $dateDebut = $request->query->get('dateDebut');
        $dateFin = $request->query->get('dateFin');
        $menuId = $request->query->get('menuId');

        $filtres = [];

        // Filtre par menu
        if ($menuId !== null && $menuId !== '') {
            if (!ctype_digit((string) $menuId) || (int) $menuId < 1) {
                return $this->json([
                    'erreur' => 'Identifiant de menu invalide.'
                ], 400);
            }

            $filtres['menuId'] = (int) $menuId;
        }

        // Filtres par dates
        $dates = [];

        foreach ([
            'dateDebut' => $dateDebut,
            'dateFin' => $dateFin
        ] as $nom => $valeur) {
            if ($valeur === null || $valeur === '') {
                continue;
            }

            $date = \DateTimeImmutable::createFromFormat(
                '!Y-m-d',
                $valeur,
                new \DateTimeZone('UTC')
            );

            if (
                $date === false ||
                $date->format('Y-m-d') !== $valeur
            ) {
                return $this->json([
                    'erreur' => 'Format de date invalide : ' . $nom
                ], 400);
            }

            $dates[$nom] = $date;
        }

        if (
            isset($dates['dateDebut'], $dates['dateFin']) &&
            $dates['dateDebut'] > $dates['dateFin']
        ) {
            return $this->json([
                'erreur' => 'La date de début doit précéder la date de fin.'
            ], 400);
        }

        if (isset($dates['dateDebut'])) {
            $filtres['dateCommande']['$gte'] = new UTCDateTime(
                $dates['dateDebut']->getTimestamp() * 1000
            );
        }

        if (isset($dates['dateFin'])) {
            $lendemain = $dates['dateFin']->modify('+1 day');

            $filtres['dateCommande']['$lt'] = new UTCDateTime(
                $lendemain->getTimestamp() * 1000
            );
        }

        // Connexion à MongoDB
        $client = new Client('mongodb://127.0.0.1:27017');

        $collection = $client
            ->selectDatabase('vite_gourmand')
            ->selectCollection('statistiques_commandes');

        $statistiques = [];
        $totalCommandes = 0;
        $totalChiffreAffaires = 0.0;

        foreach ($collection->find($filtres) as $document) {
            $id = (int) $document['menuId'];
            $nom = (string) $document['menuNom'];
            $statut = (string) $document['statut'];
            $montant = (float) $document['montantTotal'];

            if (!isset($statistiques[$id])) {
                $statistiques[$id] = [
                    'menuId' => $id,
                    'menuNom' => $nom,
                    'nombreCommandes' => 0,
                    'nombreAnnulees' => 0,
                    'chiffreAffaires' => 0.0,
                ];
            }

            $statistiques[$id]['nombreCommandes']++;
            $totalCommandes++;

            if ($statut === 'annulee') {
                $statistiques[$id]['nombreAnnulees']++;
            }

            /*
             * Chiffre d'affaires réalisé :
             * les commandes en attente et annulées
             * ne sont pas encore comptabilisées.
             *
             * Lorsque les statuts de livraison seront
             * développés, nous définirons ici les
             * statuts qui représentent une vente réalisée.
             */
        }

        $resultats = array_values($statistiques);

        usort(
            $resultats,
            fn (array $a, array $b): int =>
                $b['nombreCommandes'] <=> $a['nombreCommandes']
        );

        return $this->json([
            'totalCommandes' => $totalCommandes,
            'chiffreAffaires' => round($totalChiffreAffaires, 2),
            'statistiquesParMenu' => $resultats,
            'filtres' => [
                'dateDebut' => $dateDebut,
                'dateFin' => $dateFin,
                'menuId' => $menuId,
            ],
        ]);
    }
}
