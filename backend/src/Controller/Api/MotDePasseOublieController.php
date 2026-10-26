<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

class MotDePasseOublieController
{
    #[Route('/api/mot-de-passe-oublie', name: 'api_mot_de_passe_oublie', methods: ['POST'])]
    public function demander(
        Request $request,
        EntityManagerInterface $entityManager,
        ResetPasswordHelperInterface $resetPasswordHelper,
        MailerInterface $mailer
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse(['message' => 'Données invalides.'], 400);
        }

        $email = strtolower(trim((string) ($data['email'] ?? '')));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['message' => 'Adresse email invalide.'], 400);
        }

        $message = 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.';

        $utilisateur = $entityManager
            ->getRepository(Utilisateur::class)
            ->findOneBy(['email' => $email]);

        if (!$utilisateur) {
            return new JsonResponse(['message' => $message]);
        }

        try {
            $resetToken = $resetPasswordHelper->generateResetToken($utilisateur);
             } catch (ResetPasswordExceptionInterface $e) {
                  return $this->redirect('/mdp_oublie?erreur=lien_invalide');
            }

        $emailMessage = (new TemplatedEmail())
            ->from(new Address('noreply@viteetgourmand.fr', 'Vite & Gourmand'))
            ->to($utilisateur->getEmail())
            ->subject('Vite & Gourmand - Réinitialisation du mot de passe')
            ->htmlTemplate('reset_password/email.html.twig')
            ->context([
                'resetToken' => $resetToken,
            ]);

        try {
            $mailer->send($emailMessage);
        } catch (\Throwable $e) {
            // L'erreur doit être journalisée côté serveur en production.
            return new JsonResponse([
                'message' => 'Impossible de traiter la demande pour le moment.'
            ], 503);
        }

        return new JsonResponse(['message' => $message]);
    }
}
