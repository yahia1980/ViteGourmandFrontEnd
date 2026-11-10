<?php

namespace App\Controller\Api;

use App\Entity\Contact;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

class ContactController extends AbstractController
{
    #[Route('/api/contact', name: 'api_contact', methods: ['POST'])]
    public function envoyer(
        Request $request,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer
    ): JsonResponse {

        // Récupérer les données du formulaire
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json([
                'message' => 'Données invalides.'
            ], 400);
        }

        $prenom = $data['prenom'] ?? '';
        $nom = $data['nom'] ?? '';
        $email = $data['email'] ?? '';
        $message = $data['message'] ?? '';

        // Vérifier les champs
        if (
            !is_string($prenom) ||
            !is_string($nom) ||
            !is_string($email) ||
            !is_string($message)
        ) {
            return $this->json([
                'message' => 'Les champs doivent contenir du texte.'
            ], 400);
        }

        $prenom = trim($prenom);
        $nom = trim($nom);
        $email = trim($email);
        $message = trim($message);

        if (!$prenom || !$nom || !$email || !$message) {
            return $this->json([
                'message' => 'Veuillez remplir tous les champs.'
            ], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'message' => 'Adresse e-mail invalide.'
            ], 400);
        }

        if (
            mb_strlen($prenom) > 100 ||
            mb_strlen($nom) > 100 ||
            mb_strlen($email) > 180 ||
            mb_strlen($message) > 5000
        ) {
            return $this->json([
                'message' => 'Un ou plusieurs champs sont trop longs.'
            ], 400);
        }

        // Enregistrer le message dans MySQL
        $contact = new Contact();

        $contact->setPrenom($prenom);
        $contact->setNom($nom);
        $contact->setEmail($email);
        $contact->setMessage($message);
        $contact->setDateEnvoi(new \DateTimeImmutable());

        $entityManager->persist($contact);
        $entityManager->flush();

        // Préparer l'e-mail
        $emailContact = (new Email())
            ->from('expediteur@exemple.fr')
            ->to('vite.gourmand@gmail.com')
            ->replyTo($email)
            ->subject('Nouveau message de contact - Vite & Gourmand')
            ->text(
                "Nouveau message reçu\n\n" .
                "Prénom : $prenom\n" .
                "Nom : $nom\n" .
                "Email : $email\n\n" .
                "Message :\n$message"
            );

        // Envoyer l'e-mail
        try {
            $mailer->send($emailContact);
        } catch (\Throwable $e) {
            // Le message reste enregistré dans MySQL
            return $this->json([
                'message' => 'Votre message a été enregistré, mais la notification par e-mail a échoué.'
            ], 202);
        }

        return $this->json([
            'message' => 'Votre message a bien été envoyé.'
        ], 201);
    }
}