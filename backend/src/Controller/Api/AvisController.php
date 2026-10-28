<?php

namespace App\Controller\Api;

use App\Entity\Avis;
use App\Repository\AvisRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/avis')]
class AvisController extends AbstractController
{
    // Récupérer les avis en attente
    #[Route('/en-attente', name: 'api_avis_en_attente', methods: ['GET'])]
    #[IsGranted('ROLE_EMPLOYE')]
    public function enAttente(AvisRepository $avisRepository): JsonResponse
    {
        $avis = $avisRepository->findBy(
            ['statut' => 'en_attente'],
            ['dateCreation' => 'DESC']
        );

        $resultat = [];

        foreach ($avis as $unAvis) {
            $resultat[] = [
                'id' => $unAvis->getId(),
                'note' => $unAvis->getNote(),
                'commentaire' => $unAvis->getCommentaire(),
                'dateCreation' => $unAvis->getDateCreation()?->format('Y-m-d H:i:s'),
                'statut' => $unAvis->getStatut(),
                'utilisateurId' => $unAvis->getUtilisateur()?->getId(),
                'commandeId' => $unAvis->getCommande()?->getId(),
            ];
        }

        return $this->json($resultat);
    }

    // Valider un avis
    #[Route('/{id}/valider', name: 'api_avis_valider', methods: ['POST'])]
    #[IsGranted('ROLE_EMPLOYE')]
    public function valider(
        Avis $avis,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if ($avis->getStatut() !== 'en_attente') {
            return $this->json(
                ['erreur' => 'Cet avis a déjà été traité.'],
                409
            );
        }

        $avis->setStatut('valide');
        $entityManager->flush();

        return $this->json([
            'message' => 'Avis validé avec succès.',
            'id' => $avis->getId(),
            'statut' => $avis->getStatut()
        ]);
    }

    // Refuser un avis
    #[Route('/{id}/refuser', name: 'api_avis_refuser', methods: ['POST'])]
    #[IsGranted('ROLE_EMPLOYE')]
    public function refuser(
        Avis $avis,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if ($avis->getStatut() !== 'en_attente') {
            return $this->json(
                ['erreur' => 'Cet avis a déjà été traité.'],
                409
            );
        }

        $avis->setStatut('refuse');
        $entityManager->flush();

        return $this->json([
            'message' => 'Avis refusé avec succès.',
            'id' => $avis->getId(),
            'statut' => $avis->getStatut()
        ]);
    }
    #[Route('/valides', name: 'api_avis_valides', methods: ['GET'])]
public function avisValides(AvisRepository $avisRepository): JsonResponse
{
    $avis = $avisRepository->findBy(
        ['statut' => 'valide'],
        ['dateCreation' => 'DESC']
    );

    $resultat = [];

    foreach ($avis as $unAvis) {
        $resultat[] = [
            'id' => $unAvis->getId(),
            'note' => $unAvis->getNote(),
            'commentaire' => $unAvis->getCommentaire(),
            'dateCreation' => $unAvis->getDateCreation()?->format('Y-m-d H:i:s')
        ];
    }

    return $this->json($resultat);
}
}
