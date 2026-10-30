<?php

namespace App\Controller\Api;

use App\Entity\Commande;
use App\Entity\HistoriqueStatutCommande;
use App\Repository\CommandeRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/employe/commandes')]
class EmployeCommandeController extends AbstractController
{
    private function verifierAcces(): bool
    {
        return $this->isGranted('ROLE_EMPLOYE')
            || $this->isGranted('ROLE_ADMIN');
    }

    // ==========================================
    // LISTE DES COMMANDES
    // ==========================================


#[Route(
    '',
    name: 'api_employe_commandes_liste',
    methods: ['GET']
)]
public function liste(
    CommandeRepository $repository
): JsonResponse {

    if (!$this->verifierAcces()) {
        return $this->json([
            'message' => 'Accès refusé.'
        ], 403);
    }

    $commandes = $repository->findBy(
        [],
        ['dateCommande' => 'DESC']
    );

    $resultats = [];

    foreach ($commandes as $commande) {

        $client = $commande->getUtilisateur();

        $resultats[] = [
            'id' => $commande->getId(),

            // Informations du client
            'nomClient' => $client?->getNom(),
            'prenomClient' => $client?->getPrenom(),
            'emailClient' => $client?->getEmail(),

            // Informations de la commande
            'menu' => $commande->getMenu()?->getTitre(),

            'nombrePersonnes' => $commande->getNombrePersonnes(),

            'dateCommande' => $commande
                ->getDateCommande()?->format('Y-m-d H:i:s'),

            'datePrestation' => $commande
                ->getDatePrestation()?->format('Y-m-d H:i:s'),

            'adresseLivraison' => $commande
                ->getAdresseLivraison(),

            'codePostalLivraison' => $commande
                ->getCodePostalLivraison(),

            'villeLivraison' => $commande
                ->getVilleLivraison(),

            'montantTotal' => $commande->getMontantTotal(),

            'statut' => $commande->getStatut()
        ];
    }

    return $this->json([
        'commandes' => $resultats
    ]);
}

    // ==========================================
    // MODIFICATION DU STATUT
    // ==========================================

    #[Route(
        '/{id}/statut',
        name: 'api_employe_commandes_statut',
        requirements: ['id' => '\d+'],
        methods: ['PATCH']
    )]
    public function changerStatut(
        int $id,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {

        if (!$this->verifierAcces()) {
            return $this->json([
                'message' => 'Accès refusé.'
            ], 403);
        }

        $data = json_decode(
            $request->getContent(),
            true
        );

        if (
            !is_array($data) ||
            !is_string($data['statut'] ?? null)
        ) {
            return $this->json([
                'message' => 'Statut invalide.'
            ], 400);
        }

        // Transitions autorisées
        $transitions = [
            'en_attente' => [
                'acceptee',
                'annulee'
            ],

            'acceptee' => [
                'en_preparation',
                'annulee'
            ],

            'en_preparation' => [
                'en_livraison'
            ],

            'en_livraison' => [
                'livree'
            ],

            'livree' => [
                'en_attente_retour_materiel',
                'terminee'
            ],

            'en_attente_retour_materiel' => [
                'terminee'
            ],

            'terminee' => [],
            'annulee' => [],
        ];

        $nouveauStatut = trim($data['statut']);

        $connexion = $em->getConnection();
        $connexion->beginTransaction();

        try {
            // Verrouiller la commande
            $commande = $em->find(
                Commande::class,
                $id,
                LockMode::PESSIMISTIC_WRITE
            );

            if (!$commande) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Commande introuvable.'
                ], 404);
            }

            $ancienStatut = $commande->getStatut();

            // Vérifier la transition
            if (
                !in_array(
                    $nouveauStatut,
                    $transitions[$ancienStatut] ?? [],
                    true
                )
            ) {
                $connexion->rollBack();

                return $this->json([
                    'message' => 'Transition de statut non autorisée.'
                ], 409);
            }

            // Modifier le statut
            $commande->setStatut($nouveauStatut);

            // Enregistrer l'historique
            $historique = new HistoriqueStatutCommande();

            $historique->setCommande($commande);
            $historique->setStatut($nouveauStatut);
            $historique->setDateChangement(
                new \DateTimeImmutable()
            );

            $em->persist($historique);

            // Enregistrer en base de données
            $em->flush();

            $connexion->commit();

            return $this->json([
                'message' => 'Statut mis à jour.',
                'commandeId' => $commande->getId(),
                'ancienStatut' => $ancienStatut,
                'statut' => $nouveauStatut
            ]);

        } catch (\Throwable $e) {

            if ($connexion->isTransactionActive()) {
                $connexion->rollBack();
            }

            throw $e;
        }
    }
}
