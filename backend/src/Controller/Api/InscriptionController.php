<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class InscriptionController extends AbstractController
{
    #[Route('/api/inscription', name: 'app_api_inscription', methods: ['POST'])]
    public function inscription(
        Request $request,
        UtilisateurRepository $utilisateurRepository,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupérer les données JSON envoyées par le frontend
        try {
            $data = json_decode(
                $request->getContent(),
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (\JsonException $e) {
            return $this->json([
                'message' => 'JSON invalide.'
            ], 400);
        }

        if (!is_array($data)) {
            return $this->json([
                'message' => 'Données invalides.'
            ], 400);
        }

        // Vérifier les champs obligatoires
        $champs = [
            'nom',
            'prenom',
            'email',
            'password',
            'telephone',
            'adresse',
            'codePostal',
            'ville'
        ];

        foreach ($champs as $champ) {
            if (
                !isset($data[$champ]) ||
                !is_string($data[$champ]) ||
                trim($data[$champ]) === ''
            ) {
                return $this->json([
                    'message' => "Le champ $champ est obligatoire."
                ], 400);
            }
        }

        // Normaliser et vérifier l'email
        $email = mb_strtolower(trim($data['email']));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'message' => 'Adresse email invalide.'
            ], 400);
        }

        // Vérifier si l'email existe déjà
        $utilisateurExistant = $utilisateurRepository->findOneBy([
            'email' => $email
        ]);

        if ($utilisateurExistant !== null) {
            return $this->json([
                'message' => 'Cette adresse email est déjà utilisée.'
            ], 409);
        }

        // Vérifier la longueur du mot de passe
        if (mb_strlen($data['password']) < 12) {
            return $this->json([
                'message' => 'Le mot de passe doit contenir au moins 12 caractères.'
            ], 400);
        }

        // Vérifier les longueurs des champs
        $longueurs = [
            'nom' => 255,
            'prenom' => 255,
            'telephone' => 20,
            'adresse' => 255,
            'codePostal' => 10,
            'ville' => 100
        ];

        if (mb_strlen($email) > 180) {
            return $this->json([
                'message' => 'Adresse email trop longue.'
            ], 400);
        }

        foreach ($longueurs as $champ => $maximum) {
            if (mb_strlen(trim($data[$champ])) > $maximum) {
                return $this->json([
                    'message' => "Le champ $champ est trop long."
                ], 400);
            }
        }

        // Créer l'utilisateur
        $utilisateur = new Utilisateur();

        $utilisateur->setNom(trim($data['nom']));
        $utilisateur->setPrenom(trim($data['prenom']));
        $utilisateur->setEmail($email);
        $utilisateur->setTelephone(trim($data['telephone']));
        $utilisateur->setAdresse(trim($data['adresse']));
        $utilisateur->setCodePostal(trim($data['codePostal']));
        $utilisateur->setVille(trim($data['ville']));

        // Attribuer uniquement le rôle client
        $utilisateur->setRoles(['ROLE_USER']);

        // Hacher le mot de passe avant l'enregistrement
        $motDePasseHache = $passwordHasher->hashPassword(
            $utilisateur,
            $data['password']
        );

        $utilisateur->setPassword($motDePasseHache);

        // Enregistrer dans MySQL
        $entityManager->persist($utilisateur);
        $entityManager->flush();

        // Répondre au frontend
        return $this->json([
            'message' => 'Inscription réussie.',
            'utilisateur' => [
                'id' => $utilisateur->getId(),
                'nom' => $utilisateur->getNom(),
                'prenom' => $utilisateur->getPrenom(),
                'email' => $utilisateur->getEmail()
            ]
        ], 201);
    }
}
