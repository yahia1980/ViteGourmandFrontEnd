<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class ProfilController extends AbstractController
{
    /* ==========================================
       RÉCUPÉRER LE PROFIL UTILISATEUR
    ========================================== */

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
            'telephone' => $utilisateur->getTelephone(),
            'adresse' => $utilisateur->getAdresse(),
            'codePostal' => $utilisateur->getCodePostal(),
            'ville' => $utilisateur->getVille(),
            'roles' => $utilisateur->getRoles()
        ]);
    }

    /* ==========================================
       MODIFIER LE PROFIL UTILISATEUR
    ========================================== */

    #[Route(
        '/api/profil',
        name: 'api_profil_modifier',
        methods: ['PATCH']
    )]
    public function modifier(
        #[CurrentUser] ?Utilisateur $utilisateur,
        Request $request,
        UtilisateurRepository $utilisateurRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        /* VÉRIFIER LA CONNEXION */

        if (!$utilisateur) {
            return $this->json([
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        /* RÉCUPÉRER LE JSON */

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

        /* CHAMPS AUTORISÉS */

        $longueurs = [
            'nom' => 255,
            'prenom' => 255,
            'email' => 180,
            'telephone' => 20,
            'adresse' => 255,
            'codePostal' => 10,
            'ville' => 100
        ];

        /* VÉRIFIER LES CHAMPS */

        foreach ($longueurs as $champ => $maximum) {

            if (!array_key_exists($champ, $data)) {
                continue;
            }

            if (
                !is_string($data[$champ]) ||
                trim($data[$champ]) === ''
            ) {
                return $this->json([
                    'message' => "Le champ $champ est obligatoire."
                ], 400);
            }

            if (mb_strlen(trim($data[$champ])) > $maximum) {
                return $this->json([
                    'message' => "Le champ $champ est trop long."
                ], 400);
            }
        }

        /* VÉRIFIER L'EMAIL */

        if (array_key_exists('email', $data)) {

            $email = mb_strtolower(trim($data['email']));

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json([
                    'message' => 'Adresse email invalide.'
                ], 400);
            }

            $utilisateurExistant = $utilisateurRepository->findOneBy([
                'email' => $email
            ]);

            if (
                $utilisateurExistant !== null &&
                $utilisateurExistant->getId() !== $utilisateur->getId()
            ) {
                return $this->json([
                    'message' => 'Cette adresse email est déjà utilisée.'
                ], 409);
            }

            $utilisateur->setEmail($email);
        }

        /* MODIFIER LES INFORMATIONS */

        if (array_key_exists('nom', $data)) {
            $utilisateur->setNom(trim($data['nom']));
        }

        if (array_key_exists('prenom', $data)) {
            $utilisateur->setPrenom(trim($data['prenom']));
        }

        if (array_key_exists('telephone', $data)) {
            $utilisateur->setTelephone(trim($data['telephone']));
        }

        if (array_key_exists('adresse', $data)) {
            $utilisateur->setAdresse(trim($data['adresse']));
        }

        if (array_key_exists('codePostal', $data)) {
            $utilisateur->setCodePostal(trim($data['codePostal']));
        }

        if (array_key_exists('ville', $data)) {
            $utilisateur->setVille(trim($data['ville']));
        }

        /* ENREGISTRER DANS MYSQL */

        $entityManager->flush();

        /* RÉPONSE AU FRONTEND */

        return $this->json([
            'message' => 'Profil modifié avec succès.',
            'utilisateur' => [
                'id' => $utilisateur->getId(),
                'nom' => $utilisateur->getNom(),
                'prenom' => $utilisateur->getPrenom(),
                'email' => $utilisateur->getEmail(),
                'telephone' => $utilisateur->getTelephone(),
                'adresse' => $utilisateur->getAdresse(),
                'codePostal' => $utilisateur->getCodePostal(),
                'ville' => $utilisateur->getVille()
            ]
        ]);
    }
}
