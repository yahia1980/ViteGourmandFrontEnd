<?php

namespace App\Controller\Api;

use App\Repository\HoraireRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\Horaire;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api/horaires')]
class HoraireController extends AbstractController
{
    #[Route('', name: 'api_horaires_liste', methods: ['GET'])]
    public function liste(HoraireRepository $horaireRepository): JsonResponse
    {
        $horaires = $horaireRepository->findAll();

        $resultat = [];

        foreach ($horaires as $horaire) {
            $resultat[] = [
                'id' => $horaire->getId(),
                'jour' => $horaire->getJour(),
                'heureOuverture' => $horaire->getHeureOuverture()?->format('H:i'),
                'heureFermeture' => $horaire->getHeureFermeture()?->format('H:i'),
                'ferme' => $horaire->isFerme(),
            ];
        }

        return $this->json($resultat);
    }
    #[Route('/{id}/modifier', name: 'api_horaires_modifier', methods: ['POST'])]
public function modifier(
    Horaire $horaire,
    Request $request,
    EntityManagerInterface $entityManager
): JsonResponse {
    $data = json_decode($request->getContent(), true);

    if (!is_array($data) || !is_bool($data['ferme'] ?? null)) {
        return $this->json(['erreur' => 'Données invalides.'], 400);
    }

    $ferme = $data['ferme'];

    if ($ferme) {
        $horaire->setHeureOuverture(null);
        $horaire->setHeureFermeture(null);
    } else {
        $ouverture = $data['heureOuverture'] ?? null;
        $fermeture = $data['heureFermeture'] ?? null;

        if (
            !is_string($ouverture) ||
            !is_string($fermeture) ||
            !preg_match('/^\d{2}:\d{2}$/', $ouverture) ||
            !preg_match('/^\d{2}:\d{2}$/', $fermeture)
        ) {
            return $this->json(['erreur' => 'Heures invalides. Format attendu : HH:MM.'], 400);
        }

        $debut = \DateTimeImmutable::createFromFormat('!H:i', $ouverture);
        $fin = \DateTimeImmutable::createFromFormat('!H:i', $fermeture);

        if (!$debut || !$fin || $debut >= $fin) {
            return $this->json(['erreur' => 'Les heures sont incorrectes.'], 400);
        }

        $horaire->setHeureOuverture($debut);
        $horaire->setHeureFermeture($fin);
    }

    $horaire->setFerme($ferme);

    $entityManager->flush();

    return $this->json([
        'message' => 'Horaire modifié avec succès.',
        'id' => $horaire->getId(),
        'jour' => $horaire->getJour(),
        'heureOuverture' => $horaire->getHeureOuverture()?->format('H:i'),
        'heureFermeture' => $horaire->getHeureFermeture()?->format('H:i'),
        'ferme' => $horaire->isFerme(),
    ]);
}
}