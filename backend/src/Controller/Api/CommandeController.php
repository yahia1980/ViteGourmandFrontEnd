<?php

namespace App\Controller\Api;

use App\Entity\Commande;
use App\Entity\Menu;
use App\Repository\CommandeRepository;
use App\Repository\MenuRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class CommandeController extends AbstractController
{
    /* ==========================================
       CRÉATION D'UNE COMMANDE
    ========================================== */

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

        // 2. Récupérer les données du frontend
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['menuId'])) {
            return $this->json([
                'message' => 'Veuillez sélectionner un menu.'
            ], 400);
        }

        // 3. Vérifier l'identifiant du menu
        $menuId = filter_var(
            $data['menuId'],
            FILTER_VALIDATE_INT
        );

        if ($menuId === false || $menuId <= 0) {
            return $this->json([
                'message' => 'Identifiant du menu invalide.'
            ], 400);
        }

        // 4. Rechercher le menu
        $menu = $menuRepository->find($menuId);

        if (!$menu) {
            return $this->json([
                'message' => 'Menu introuvable.'
            ], 404);
        }

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

        // 6. Vérifier l'adresse de livraison
        $adresseLivraison = $data['adresseLivraison'] ?? null;
        $codePostalLivraison = $data['codePostalLivraison'] ?? null;
        $villeLivraison = $data['villeLivraison'] ?? null;

        if (
            !is_string($adresseLivraison) ||
            !is_string($codePostalLivraison) ||
            !is_string($villeLivraison)
        ) {
            return $this->json([
                'message' => 'Informations de livraison invalides.'
            ], 400);
        }

        $adresseLivraison = trim($adresseLivraison);
        $codePostalLivraison = trim($codePostalLivraison);
        $villeLivraison = trim($villeLivraison);

        if (
            $adresseLivraison === '' ||
            $codePostalLivraison === '' ||
            $villeLivraison === ''
        ) {
            return $this->json([
                'message' => 'Adresse, code postal et ville obligatoires.'
            ], 400);
        }

        // 7. Vérifier la date de prestation
        $datePrestation = $data['datePrestation'] ?? null;

        if (
            !is_string($datePrestation) ||
            trim($datePrestation) === ''
        ) {
            return $this->json([
                'message' => 'Date de prestation obligatoire.'
            ], 400);
        }

        try {
            $datePrestationObjet = new \DateTimeImmutable(
                $datePrestation
            );
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

        // 8. Vérifier les informations complémentaires
        $allergies = $data['allergies'] ?? null;
        $precisionLivraison = $data['precisionLivraison'] ?? null;

        if (
            ($allergies !== null && !is_string($allergies)) ||
            ($precisionLivraison !== null && !is_string($precisionLivraison))
        ) {
            return $this->json([
                'message' => 'Informations complémentaires invalides.'
            ], 400);
        }

        if (
            mb_strlen($allergies ?? '') > 2000 ||
            mb_strlen($precisionLivraison ?? '') > 2000
        ) {
            return $this->json([
                'message' => 'Les informations complémentaires sont trop longues.'
            ], 400);
        }

        // ==========================================
        // TRANSACTION SÉCURISÉE
        // ==========================================

        $connexion = $entityManager->getConnection();
        $connexion->beginTransaction();

        try {

            // 9. Verrouiller le menu pendant la commande
            $menuVerrouille = $entityManager->find(
                Menu::class,
                $menuId,
                LockMode::PESSIMISTIC_WRITE
            );

            if ($menuVerrouille !== null) {
                // Actualiser le stock sous verrou
                $entityManager->refresh(
                    $menuVerrouille,
                    LockMode::PESSIMISTIC_WRITE
                );
            }

            // 10. Vérifier la disponibilité réelle
            if (
                !$menuVerrouille ||
                $menuVerrouille->getStockDisponible() <= 0
            ) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Ce menu est actuellement épuisé.'
                ], 409);
            }

            // 11. Calculer le prix à partir du menu verrouillé
            $prixParPersonne = (float) $menuVerrouille->getPrix();

            $sousTotal = $prixParPersonne * $nombrePersonnes;

            // 12. Réduction de 10 %
            $montantReduction = 0;

            if (
                $nombrePersonnes >=
                $menuVerrouille->getNombrePersonnesMin() + 5
            ) {
                $montantReduction = $sousTotal * 0.10;
            }

            $totalHorsLivraison = $sousTotal - $montantReduction;

            // 13. Frais de livraison
            // Simulation temporaire : distance fictive de 20 km
            $fraisLivraison = 0;
            $distanceKm = 0;

            if (mb_strtolower($villeLivraison) !== 'bordeaux') {
                $distanceKm = 20;
                $fraisLivraison = 5 + (0.59 * $distanceKm);
            }

            // 14. Montant total
            $montantTotal = $totalHorsLivraison + $fraisLivraison;

            // 15. Créer la commande
            $commande = new Commande();

            $commande->setUtilisateur($utilisateur);
            $commande->setMenu($menuVerrouille);
            $commande->setNombrePersonnes($nombrePersonnes);

            $commande->setAdresseLivraison($adresseLivraison);
            $commande->setCodePostalLivraison($codePostalLivraison);
            $commande->setVilleLivraison($villeLivraison);

            $commande->setDatePrestation($datePrestationObjet);

            $commande->setAllergies(
                $allergies !== null ? trim($allergies) : null
            );

            $commande->setPrecisionLivraison(
                $precisionLivraison !== null
                    ? trim($precisionLivraison)
                    : null
            );

            $commande->setMontantReduction(
                number_format($montantReduction, 2, '.', '')
            );

            $commande->setFraisLivraison(
                number_format($fraisLivraison, 2, '.', '')
            );

            $commande->setMontantTotal(
                number_format($montantTotal, 2, '.', '')
            );

            // 16. Diminuer le stock de 1 commande
            $nouveauStock =
                $menuVerrouille->getStockDisponible() - 1;

            $menuVerrouille->setStockDisponible($nouveauStock);

            // 17. Enregistrer commande et stock
            $entityManager->persist($commande);
            $entityManager->flush();

            // 18. Valider la transaction
            $connexion->commit();

        } catch (\Throwable $e) {

            if ($connexion->isTransactionActive()) {
                $connexion->rollBack();
            }

            throw $e;
        }

        // 19. Réponse JSON au frontend
        return $this->json([
            'message' => 'Commande enregistrée avec succès.',
            'commandeId' => $commande->getId(),
            'statut' => $commande->getStatut(),
            'menu' => $menuVerrouille->getTitre(),
            'nombrePersonnes' => $nombrePersonnes,
            'prixParPersonne' => $menuVerrouille->getPrix(),
            'sousTotal' => number_format($sousTotal, 2, '.', ''),
            'reduction' => number_format($montantReduction, 2, '.', ''),
            'totalHorsLivraison' => number_format(
                $totalHorsLivraison, 2, '.', ''
            ),
            'villeLivraison' => $villeLivraison,
            'distanceKm' => $distanceKm,
            'fraisLivraison' => number_format(
                $fraisLivraison, 2, '.', ''
            ),
            'montantTotal' => number_format(
                $montantTotal, 2, '.', ''
            ),
            'stockRestant' => $nouveauStock
        ]);
    }

    /* ==========================================
       LISTE DES COMMANDES DE L'UTILISATEUR
    ========================================== */

    #[Route('/api/commandes', name: 'api_commandes_liste', methods: ['GET'])]
    public function liste(
        CommandeRepository $commandeRepository
    ): JsonResponse {

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

                'dateCommande' => $commande
                    ->getDateCommande()
                    ->format('Y-m-d H:i:s'),

                'datePrestation' => $commande
                    ->getDatePrestation()
                    ->format('Y-m-d H:i:s'),

                'adresseLivraison' => $commande->getAdresseLivraison(),
                'codePostalLivraison' => $commande->getCodePostalLivraison(),
                'villeLivraison' => $commande->getVilleLivraison(),

                'prixParPersonne' => $commande->getMenu()->getPrix(),
                'montantReduction' => $commande->getMontantReduction(),
                'fraisLivraison' => $commande->getFraisLivraison(),
                'montantTotal' => $commande->getMontantTotal(),

                'statut' => $commande->getStatut()
            ];
        }

        return $this->json([
            'commandes' => $resultats
        ]);
    }

    /* ==========================================
       ANNULATION D'UNE COMMANDE
    ========================================== */

    #[Route(
        '/api/commandes/{id}/annuler',
        name: 'api_commande_annuler',
        requirements: ['id' => '\d+'],
        methods: ['PATCH']
    )]
    public function annuler(
        int $id,
        CommandeRepository $commandeRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        // 1. Vérifier que l'utilisateur est connecté
        $utilisateur = $this->getUser();

        if (!$utilisateur) {
            return $this->json([
                'message' => 'Vous devez être connecté pour annuler une commande.'
            ], 401);
        }

        $connexion = $entityManager->getConnection();
        $connexion->beginTransaction();

        try {

            // 2. Verrouiller la commande
            $commande = $entityManager->find(
                Commande::class,
                $id,
                LockMode::PESSIMISTIC_WRITE
            );

            if ($commande !== null) {
                $entityManager->refresh(
                    $commande,
                    LockMode::PESSIMISTIC_WRITE
                );
            }

            if (!$commande) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Commande introuvable.'
                ], 404);
            }

            // 3. Vérifier le propriétaire
            if (
                $commande->getUtilisateur()->getId()
                !== $utilisateur->getId()
            ) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Commande introuvable.'
                ], 404);
            }

            // 4. Vérifier le statut
            if ($commande->getStatut() !== 'en_attente') {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Cette commande ne peut plus être annulée.'
                ], 409);
            }

            // 5. Verrouiller le menu concerné
            $menu = $commande->getMenu();

            $entityManager->refresh(
                $menu,
                LockMode::PESSIMISTIC_WRITE
            );

            // 6. Annuler la commande
            $commande->setStatut('annulee');

            // 7. Restituer une unité de stock
            $menu->setStockDisponible(
                $menu->getStockDisponible() + 1
            );

            // 8. Enregistrer
            $entityManager->flush();
            $connexion->commit();

        } catch (\Throwable $e) {

            if ($connexion->isTransactionActive()) {
                $connexion->rollBack();
            }

            throw $e;
        }

        return $this->json([
            'message' => 'Votre commande a été annulée avec succès.',
            'commandeId' => $commande->getId(),
            'statut' => $commande->getStatut(),
            'stockRestant' => $menu->getStockDisponible()
        ]);
    }
}
