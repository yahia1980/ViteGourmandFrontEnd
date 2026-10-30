<?php

namespace App\Controller\Api;

use App\Entity\Commande;
use App\Entity\Menu;
use App\Repository\CommandeRepository;
use App\Repository\MenuRepository;
use App\Service\StatistiquesMongoDBService;
use Psr\Log\LoggerInterface;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class CommandeController extends AbstractController
{
    /* ==========================================
       CRÃ‰ATION D'UNE COMMANDE
    ========================================== */

    #[Route('/commandes', name: 'api_commande_creer', methods: ['POST'])]
    public function creer(
        Request $request,
        MenuRepository $menuRepository,
        EntityManagerInterface $entityManager,
        StatistiquesMongoDBService $statistiquesMongoDBService,
        LoggerInterface $logger
    ): JsonResponse {

        // 1. VÃ©rifier que l'utilisateur est connectÃ©
        $utilisateur = $this->getUser();

        if (!$utilisateur) {
            return $this->json([
                'message' => 'Vous devez Ãªtre connectÃ© pour commander.'
            ], 401);
        }

        // 2. RÃ©cupÃ©rer les donnÃ©es du frontend
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['menuId'])) {
            return $this->json([
                'message' => 'Veuillez sÃ©lectionner un menu.'
            ], 400);
        }

        // 3. VÃ©rifier l'identifiant du menu
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

        // 5. VÃ©rifier le nombre de personnes
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

        // 6. VÃ©rifier l'adresse de livraison
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

        // 7. VÃ©rifier la date de prestation
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
                'message' => 'La date de prestation doit Ãªtre dans le futur.'
            ], 400);
        }

        // 8. VÃ©rifier les informations complÃ©mentaires
        $allergies = $data['allergies'] ?? null;
        $precisionLivraison = $data['precisionLivraison'] ?? null;

        if (
            ($allergies !== null && !is_string($allergies)) ||
            ($precisionLivraison !== null && !is_string($precisionLivraison))
        ) {
            return $this->json([
                'message' => 'Informations complÃ©mentaires invalides.'
            ], 400);
        }

        if (
            mb_strlen($allergies ?? '') > 2000 ||
            mb_strlen($precisionLivraison ?? '') > 2000
        ) {
            return $this->json([
                'message' => 'Les informations complÃ©mentaires sont trop longues.'
            ], 400);
        }

        // ==========================================
        // TRANSACTION SÃ‰CURISÃ‰E
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

            // 10. VÃ©rifier la disponibilitÃ© rÃ©elle
            if (
                !$menuVerrouille ||
                $menuVerrouille->getStockDisponible() <= 0
            ) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Ce menu est actuellement Ã©puisÃ©.'
                ], 409);
            }

            // 11. Calculer le prix Ã  partir du menu verrouillÃ©
            $prixParPersonne = (float) $menuVerrouille->getPrix();

            $sousTotal = $prixParPersonne * $nombrePersonnes;

            // 12. RÃ©duction de 10 %
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

            // 15. CrÃ©er la commande
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

        // Synchroniser MongoDB uniquement après validation de MySQL.
        $this->synchroniserStatistiques(
            $commande,
            $statistiquesMongoDBService,
            $logger
        );

        // 19. RÃ©ponse JSON au frontend
        return $this->json([
            'message' => 'Commande enregistrÃ©e avec succÃ¨s.',
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

    #[Route('/commandes', name: 'api_commandes_liste', methods: ['GET'])]
    public function liste(
        CommandeRepository $commandeRepository
    ): JsonResponse {

        $utilisateur = $this->getUser();

        if (!$utilisateur) {
            return $this->json([
                'message' => 'Vous devez Ãªtre connectÃ©.'
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
        '/commandes/{id}/annuler',
        name: 'api_commande_annuler',
        requirements: ['id' => '\d+'],
        methods: ['PATCH']
    )]
    public function annuler(
        int $id,
        CommandeRepository $commandeRepository,
        EntityManagerInterface $entityManager,
        StatistiquesMongoDBService $statistiquesMongoDBService,
        LoggerInterface $logger
    ): JsonResponse {

        // 1. VÃ©rifier que l'utilisateur est connectÃ©
        $utilisateur = $this->getUser();

        if (!$utilisateur) {
            return $this->json([
                'message' => 'Vous devez Ãªtre connectÃ© pour annuler une commande.'
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

            // 3. VÃ©rifier le propriÃ©taire
            if (
                $commande->getUtilisateur()->getId()
                !== $utilisateur->getId()
            ) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Commande introuvable.'
                ], 404);
            }

            // 4. VÃ©rifier le statut
            if ($commande->getStatut() !== 'en_attente') {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Cette commande ne peut plus Ãªtre annulÃ©e.'
                ], 409);
            }

            // 5. Verrouiller le menu concernÃ©
            $menu = $commande->getMenu();

            $entityManager->refresh(
                $menu,
                LockMode::PESSIMISTIC_WRITE
            );

            // 6. Annuler la commande
            $commande->setStatut('annulee');

            // 7. Restituer une unitÃ© de stock
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

        // Mettre à jour le statut dans MongoDB après validation de MySQL.
        $this->synchroniserStatistiques(
            $commande,
            $statistiquesMongoDBService,
            $logger
        );

        return $this->json([
            'message' => 'Votre commande a Ã©tÃ© annulÃ©e avec succÃ¨s.',
            'commandeId' => $commande->getId(),
            'statut' => $commande->getStatut(),
            'stockRestant' => $menu->getStockDisponible()
        ]);
    }

    /**
     * La base MySQL reste la source de vérité.
     * Une panne MongoDB ne doit pas faire échouer une commande déjà validée.
     * La commande app:sync-statistiques permet une resynchronisation.
     */
    private function synchroniserStatistiques(
        Commande $commande,
        StatistiquesMongoDBService $statistiquesMongoDBService,
        LoggerInterface $logger
    ): void {
        try {
            $statistiquesMongoDBService->enregistrerCommande($commande);
        } catch (\Throwable $e) {
            $logger->error('Synchronisation MongoDB impossible pour une commande.', [
                'commandeId' => $commande->getId(),
                'exception' => $e,
            ]);
        }
    }

}