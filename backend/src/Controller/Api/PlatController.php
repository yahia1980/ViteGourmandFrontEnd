<?php

namespace App\Controller\Api;

use App\Repository\PlatRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\Plat;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

#[Route('/plats')]
class PlatController extends AbstractController
{
    #[Route('', name: 'api_plats_liste', methods: ['GET'])]
    public function liste(PlatRepository $platRepository): JsonResponse
    {
        $plats = $platRepository->findAll();

        $resultat = [];

        foreach ($plats as $plat) {
            $resultat[] = [
                'id' => $plat->getId(),
                'nom' => $plat->getNom(),
                'description' => $plat->getDescription(),
                'categorie' => $plat->getCategorie(),
            ];
        }

        return $this->json($resultat);
    }

#[Route('', name: 'api_plats_creation', methods: ['POST'])]
public function creer(
    Request $request,
    EntityManagerInterface $entityManager
): JsonResponse {
    $donnees = json_decode($request->getContent(), true);

    if (!is_array($donnees)) {
        return $this->json([
            'erreur' => 'JSON invalide.'
        ], 400);
    }

    $nom = trim($donnees['nom'] ?? '');
    $description = trim($donnees['description'] ?? '');
    $categorie = trim($donnees['categorie'] ?? '');

    if ($nom === '' || $categorie === '') {
        return $this->json([
            'erreur' => 'Le nom et la catégorie sont obligatoires.'
        ], 400);
    }

    if (mb_strlen($nom) > 150) {
        return $this->json([
            'erreur' => 'Le nom ne doit pas dépasser 150 caractères.'
        ], 400);
    }

    if (!in_array($categorie, ['entree', 'principal', 'dessert'], true)) {
        return $this->json([
            'erreur' => 'Catégorie invalide.'
        ], 400);
    }

    $plat = new Plat();
    $plat->setNom($nom);
    $plat->setDescription($description);
    $plat->setCategorie($categorie);

    $entityManager->persist($plat);
    $entityManager->flush();

    return $this->json([
        'message' => 'Plat créé avec succès.',
        'id' => $plat->getId()
    ], 201);
}

#[Route('/{id}/modifier', name: 'api_plats_modifier', methods: ['POST'])]
public function modifier(
    int $id,
    Request $request,
    PlatRepository $platRepository,
    EntityManagerInterface $entityManager
): JsonResponse {
    $plat = $platRepository->find($id);

    if (!$plat) {
        return $this->json([
            'erreur' => 'Plat introuvable.'
        ], 404);
    }

    $donnees = json_decode($request->getContent(), true);

    if (!is_array($donnees)) {
        return $this->json([
            'erreur' => 'JSON invalide.'
        ], 400);
    }

    $nom = $donnees['nom'] ?? $plat->getNom();
    $description = $donnees['description'] ?? $plat->getDescription();
    $categorie = $donnees['categorie'] ?? $plat->getCategorie();

    if (!is_string($nom) || !is_string($description) || !is_string($categorie)) {
        return $this->json(['erreur' => 'Données invalides.'], 400);
    }

    $nom = trim($nom);
    $description = trim($description);
    $categorie = trim($categorie);

    if ($nom === '' || mb_strlen($nom) > 150) {
        return $this->json(['erreur' => 'Nom invalide.'], 400);
    }

    if (!in_array($categorie, ['entree', 'principal', 'dessert'], true)) {
        return $this->json(['erreur' => 'Catégorie invalide.'], 400);
    }

    $plat->setNom($nom);
    $plat->setDescription($description);
    $plat->setCategorie($categorie);

    $entityManager->flush();

    return $this->json([
        'message' => 'Plat modifié avec succès.',
        'id' => $plat->getId()
    ]);
}

#[Route('/{id}', name: 'api_plats_supprimer', methods: ['DELETE'])]
public function supprimer(
    int $id,
    PlatRepository $platRepository,
    EntityManagerInterface $entityManager
): JsonResponse {
    $plat = $platRepository->find($id);

    if (!$plat) {
        return $this->json([
            'erreur' => 'Plat introuvable.'
        ], 404);
    }

    // Retirer les associations aux menus
    foreach ($plat->getMenus()->toArray() as $menu) {
        $plat->removeMenu($menu);
    }

    // Retirer les associations aux allergènes
    foreach ($plat->getAllergenes()->toArray() as $allergene) {
        $plat->removeAllergene($allergene);
    }

    $entityManager->remove($plat);
    $entityManager->flush();

    return $this->json([
        'message' => 'Plat supprimé avec succès.'
    ]);
}


}
