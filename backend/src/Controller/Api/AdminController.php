<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/employes')]
#[IsGranted('ROLE_ADMIN')]
class AdminController extends AbstractController
{
    #[Route('', name: 'api_admin_employes_liste', methods: ['GET'])]
    public function liste(UtilisateurRepository $repository): JsonResponse
    {
        $utilisateurs = $repository->findAll();
        $employes = [];

        foreach ($utilisateurs as $utilisateur) {
            if (
                !in_array('ROLE_EMPLOYE', $utilisateur->getRoles(), true)
                || in_array('ROLE_ADMIN', $utilisateur->getRoles(), true)
            ) {
                continue;
            }

            $employes[] = [
                'id' => $utilisateur->getId(),
                'email' => $utilisateur->getEmail(),
                'actif' => $utilisateur->isActif(),
                'dateCreation' => $utilisateur->getDateCreation()->format('Y-m-d H:i:s'),
            ];
        }

        return $this->json([
            'employes' => $employes,
            'total' => count($employes),
            'totalActifs' => count(array_filter(
                $employes,
                fn (array $employe): bool => $employe['actif']
            )),
        ]);
    }

    #[Route('', name: 'api_admin_employes_creation', methods: ['POST'])]
    public function creer(
        Request $request,
        UtilisateurRepository $repository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        MailerInterface $mailer,
        LoggerInterface $logger
    ): JsonResponse {
        $donnees = json_decode($request->getContent(), true);

        if (!is_array($donnees)) {
            return $this->json([
                'erreur' => 'Données JSON invalides.'
            ], 400);
        }

        $email = strtolower(trim((string) ($donnees['email'] ?? '')));
        $motDePasse = (string) ($donnees['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'erreur' => 'Adresse email invalide.'
            ], 400);
        }

        if (strlen($motDePasse) < 12) {
            return $this->json([
                'erreur' => 'Le mot de passe doit contenir au moins 12 caractères.'
            ], 400);
        }

        if ($repository->findOneBy(['email' => $email]) !== null) {
            return $this->json([
                'erreur' => 'Cette adresse email est déjà utilisée.'
            ], 409);
        }

        $champs = [
            'nom',
            'prenom',
            'telephone',
            'adresse',
            'codePostal',
            'ville'
        ];

        foreach ($champs as $champ) {
            if (
                !isset($donnees[$champ])
                || !is_string($donnees[$champ])
                || trim($donnees[$champ]) === ''
            ) {
                return $this->json([
                    'erreur' => sprintf(
                        'Le champ %s est obligatoire.',
                        $champ
                    )
                ], 400);
            }
        }

        // Création du compte employé
        $employe = new Utilisateur();

        $employe->setEmail($email);
        $employe->setRoles(['ROLE_EMPLOYE']);
        $employe->setActif(true);
        $employe->setNom(trim($donnees['nom']));
        $employe->setPrenom(trim($donnees['prenom']));
        $employe->setTelephone(trim($donnees['telephone']));
        $employe->setAdresse(trim($donnees['adresse']));
        $employe->setCodePostal(trim($donnees['codePostal']));
        $employe->setVille(trim($donnees['ville']));

        // Hachage du mot de passe
        $employe->setPassword(
            $passwordHasher->hashPassword(
                $employe,
                $motDePasse
            )
        );

        // Enregistrement dans MySQL
        $entityManager->persist($employe);
        $entityManager->flush();

        // Préparer l'email de notification
        // Remplacer l'expéditeur par une adresse autorisée
        // par ton service SMTP.
        $notification = (new Email())
            ->from('expediteur@exemple.fr')
            ->to($employe->getEmail())
            ->subject('Création de votre compte employé - Vite & Gourmand')
            ->text(
                "Bonjour " . $employe->getPrenom() . ",\n\n" .
                "Nous vous informons qu'un compte employé " .
                "a été créé pour vous sur Vite & Gourmand.\n\n" .
                "Votre adresse de connexion : " .
                $employe->getEmail() . "\n\n" .
                "Pour des raisons de sécurité, votre mot de passe " .
                "n'est pas communiqué dans cet email.\n" .
                "Veuillez vous rapprocher de l'administrateur " .
                "pour l'obtenir.\n\n" .
                "Cordialement,\n" .
                "L'équipe Vite & Gourmand"
            );

        // Envoyer l'email sans annuler la création
        // du compte si l'envoi échoue.
        $emailEnvoye = false;

        try {
            $mailer->send($notification);
            $emailEnvoye = true;
        } catch (\Throwable $e) {
            $logger->error(
                "Échec de l'envoi de l'email de création du compte employé.",
                [
                    'employeId' => $employe->getId(),
                    'exception' => $e
                ]
            );
        }

        return $this->json([
            'message' => $emailEnvoye
                ? 'Compte employé créé avec succès. Notification envoyée.'
                : 'Compte employé créé avec succès, mais la notification par email a échoué.',
            'emailEnvoye' => $emailEnvoye,
            'employe' => [
                'id' => $employe->getId(),
                'email' => $employe->getEmail(),
                'actif' => $employe->isActif(),
            ],
        ], 201);
    }

    #[Route(
        '/{id}/statut',
        name: 'api_admin_employes_statut',
        methods: ['PATCH'],
        requirements: ['id' => '\d+']
    )]
    public function modifierStatut(
        int $id,
        Request $request,
        UtilisateurRepository $repository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $employe = $repository->find($id);

        if (
            $employe === null
            || !in_array('ROLE_EMPLOYE', $employe->getRoles(), true)
            || in_array('ROLE_ADMIN', $employe->getRoles(), true)
        ) {
            return $this->json([
                'erreur' => 'Employé introuvable.'
            ], 404);
        }

        $donnees = json_decode($request->getContent(), true);

        if (
            !is_array($donnees)
            || !array_key_exists('actif', $donnees)
            || !is_bool($donnees['actif'])
        ) {
            return $this->json([
                'erreur' => 'Le champ actif doit être un booléen.'
            ], 400);
        }

        $employe->setActif($donnees['actif']);

        $entityManager->flush();

        return $this->json([
            'message' => $employe->isActif()
                ? 'Compte employé activé.'
                : 'Compte employé désactivé.',
            'id' => $employe->getId(),
            'actif' => $employe->isActif(),
        ]);
    }
}
