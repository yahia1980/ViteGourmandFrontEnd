<?php

namespace App\Controller\Api;

use App\Repository\MenuRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Commande;
use App\Repository\CommandeRepository;

class CommandeController extends AbstractController
{
    #[Route('/api/commandes', name: 'api_commande_creer', methods: ['POST'])]
    public function creer(
        Request $request,
        MenuRepository $menuRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // 1. Vérifier que l'utilisateur est connecté
        $utilisateur = $this->getUser();

        if (!$utilisateur) {
            return $this->json([
                'message' => 'Vous devez être connecté pour commander.'
            ], 401);
        }

        // 2. Récupérer les données envoyées par le frontend
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['menuId'])) {
            return $this->json([
                'message' => 'Veuillez sélectionner un menu.'
            ], 400);
        }

        // 3. Vérifier l'identifiant du menu
        $menuId = filter_var($data['menuId'], FILTER_VALIDATE_INT);

        if ($menuId === false || $menuId <= 0) {
            return $this->json([
                'message' => 'Identifiant du menu invalide.'
            ], 400);
        }

        // 4. Rechercher le menu dans la base de données
        $menu = $menuRepository->find($menuId);

        if (!$menu) {
            return $this->json([
                'message' => 'Menu introuvable.'
            ], 404);
        }

        // 5. Vérifier le nombre de personnes

        // 5. Vérifier le nombre de personnes
        $nombrePersonnes = filter_var(
            $data['nombrePersonnes'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (
            $nombrePersonnes === false ||
            $nombrePersonnes === null ||
            $nombrePersonnes < $menu->getNombrePersonnesMin()
        ) {
            return $this->json([
                'message' => 'Le nombre minimum de personnes pour ce menu est de ' .
                    $menu->getNombrePersonnesMin() . '.'
            ], 400);
        }

        // Vérifier l'adresse de livraison
        $adresseLivraison = trim($data['adresseLivraison'] ?? '');
        $codePostalLivraison = trim($data['codePostalLivraison'] ?? '');

        if ($adresseLivraison === '' || $codePostalLivraison === '') {
            return $this->json([
                'message' => 'Adresse et code postal obligatoires.'
            ], 400);
        }

        // Vérifier la date de prestation
        $datePrestation = $data['datePrestation'] ?? null;

        if (!is_string($datePrestation) || trim($datePrestation) === '') {
            return $this->json([
                'message' => 'Date de prestation obligatoire.'
            ], 400);
        }

        try {
            $datePrestationObjet = new \DateTimeImmutable($datePrestation);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Date de prestation invalide.'
            ], 400);
        }

        if ($datePrestationObjet <= new \DateTimeImmutable()) {
            return $this->json([
                'message' => 'La date de prestation doit être dans le futur.'
            ], 400);
        }
        // 6. Calculer le sous-total
        $prixParPersonne = (float) $menu->getPrix();
        $sousTotal = $prixParPersonne * $nombrePersonnes;

        // 7. Calculer la réduction de 10 %
        $montantReduction = 0;

        if ($nombrePersonnes >= $menu->getNombrePersonnesMin() + 5) {
            $montantReduction = $sousTotal * 0.10;
        }

        // 8. Calculer le total hors livraison
        $totalHorsLivraison = $sousTotal - $montantReduction;
        // Frais de livraison : simulation temporaire
        $villeLivraison = trim($data['villeLivraison'] ?? '');

        if ($villeLivraison === '') {
            return $this->json([
                'message' => 'Veuillez indiquer la ville de livraison.'
            ], 400);
        }

        $fraisLivraison = 0;
        $distanceKm = 0;

        if (mb_strtolower($villeLivraison) !== 'bordeaux') {
            // Distance fictive utilisée uniquement pour les tests
            $distanceKm = 20;
            $fraisLivraison = 5 + (0.59 * $distanceKm);
        }
        // Calculer le montant total avant de créer la commande
         $montantTotal = $totalHorsLivraison + $fraisLivraison;
        // Créer la commande
        $commande = new Commande();

        $commande->setUtilisateur($utilisateur);
        $commande->setMenu($menu);
        $commande->setNombrePersonnes($nombrePersonnes);

        $commande->setAdresseLivraison($adresseLivraison);
        $commande->setCodePostalLivraison($codePostalLivraison);
        $commande->setVilleLivraison($villeLivraison);

        $commande->setDatePrestation($datePrestationObjet);

        $commande->setMontantReduction(
            number_format($montantReduction, 2, '.', '')
        );

        $commande->setFraisLivraison(
            number_format($fraisLivraison, 2, '.', '')
        );

        $commande->setMontantTotal(
            number_format($montantTotal, 2, '.', '')
        );

        // Enregistrer dans MySQL
        $entityManager->persist($commande);
        $entityManager->flush();


        // 9. Retourner le résultat au frontend
        return $this->json([
            'message' => 'Commande enregistrée avec succès.',
            'commandeId' => $commande->getId(),
            'statut' => $commande->getStatut(),
            'menu' => $menu->getTitre(),
            'nombrePersonnes' => $nombrePersonnes,
            'prixParPersonne' => $menu->getPrix(),
            'sousTotal' => number_format($sousTotal, 2, '.', ''),
            'reduction' => number_format($montantReduction, 2, '.', ''),
            'totalHorsLivraison' => number_format($totalHorsLivraison, 2, '.', ''),
            'villeLivraison' => $villeLivraison,
            'distanceKm' => $distanceKm,
            'fraisLivraison' => number_format($fraisLivraison, 2, '.', ''),
            'montantTotal' => number_format($montantTotal, 2, '.', ''),

        ]);
    }
    #[Route('/api/commandes', name: 'api_commandes_liste', methods: ['GET'])]
public function liste(CommandeRepository $commandeRepository): JsonResponse
{
    $utilisateur = $this->getUser();

    if (!$utilisateur) {
        return $this->json([
            'message' => 'Vous devez être connecté.'
        ], 401);
    }

    $commandes = $commandeRepository->findBy(
        ['utilisateur' => $utilisateur],
        ['dateCommande' => 'DESC']
    );

    $resultats = [];

    foreach ($commandes as $commande) {
        $resultats[] = [
            'id' => $commande->getId(),
            'menu' => $commande->getMenu()->getTitre(),
            'nombrePersonnes' => $commande->getNombrePersonnes(),
            'dateCommande' => $commande->getDateCommande()->format('Y-m-d H:i:s'),
            'datePrestation' => $commande->getDatePrestation()->format('Y-m-d H:i:s'),
            'montantTotal' => $commande->getMontantTotal(),
            'statut' => $commande->getStatut()
        ];
    }

    return $this->json([
        'commandes' => $resultats
    ]);
}
}
