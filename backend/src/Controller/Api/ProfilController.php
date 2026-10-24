<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class ProfilController extends AbstractController
{
    #[Route('/api/profil', name: 'api_profil', methods: ['GET'])]
    public function profil(
        #[CurrentUser] ?Utilisateur $utilisateur
    ): JsonResponse {
        if (!$utilisateur) {
            return $this->json([
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        return $this->json([
            'id' => $utilisateur->getId(),
            'email' => $utilisateur->getEmail(),
            'nom' => $utilisateur->getNom(),
            'prenom' => $utilisateur->getPrenom(),
            'roles' => $utilisateur->getRoles()
        ]);
    }
}