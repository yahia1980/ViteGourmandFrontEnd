<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class ConnexionController extends AbstractController
{
    #[Route('/api/connexion', name: 'api_connexion', methods: ['POST'])]
    public function connexion(
        #[CurrentUser] ?Utilisateur $utilisateur
    ): JsonResponse {
        if (!$utilisateur) {
            return $this->json([
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        return $this->json([
            'message' => 'Connexion réussie',
            'utilisateur' => [
                'id' => $utilisateur->getId(),
                'email' => $utilisateur->getEmail(),
                'roles' => $utilisateur->getRoles()
            ]
        ]);
    }
}