<?php

namespace App\Controller\Api;

use App\Repository\MenuRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class MenuController extends AbstractController
{
    #[Route('/api/menus', name: 'api_menus', methods: ['GET'])]
    public function index(MenuRepository $menuRepository): JsonResponse
    {
        $menus = $menuRepository->findAll();

        $resultats = [];

        foreach ($menus as $menu) {

            /* =====================================
               1. IMAGES DU MENU
               ===================================== */

            $images = [];

            foreach ($menu->getMenuImages() as $menuImage) {
                $images[] = $menuImage->getChemin();
            }


            /* =====================================
               2. PLATS DU MENU
               ===================================== */

            $plats = [
                'entrees' => [],
                'principaux' => [],
                'desserts' => [],
            ];

            /* =====================================
               3. ALLERGÈNES DU MENU
               ===================================== */

            $allergenes = [];

            foreach ($menu->getPlats() as $plat) {

                $categorie = strtolower(trim($plat->getCategorie() ?? ''));

                switch ($categorie) {

                    case 'entree':
                    case 'entrée':
                        $plats['entrees'][] = $plat->getNom();
                        break;

                    case 'principal':
                    case 'principaux':
                    case 'plat':
                        $plats['principaux'][] = $plat->getNom();
                        break;

                    case 'dessert':
                        $plats['desserts'][] = $plat->getNom();
                        break;
                }

                foreach ($plat->getAllergenes() as $allergene) {
                    $nom = $allergene->getNom();

                    if ($nom !== null && !in_array($nom, $allergenes, true)) {
                        $allergenes[] = $nom;
                    }
                }
            }


            /* =====================================
               4. CONSTRUCTION DE LA RÉPONSE JSON
               ===================================== */

            $resultats[] = [
                'id' => $menu->getId(),
                'titre' => $menu->getTitre(),
                'description' => $menu->getDescription(),
                'personnesMin' => $menu->getNombrePersonnesMin(),
                'prix' => (float) $menu->getPrix(),
                'stock' => $menu->getStockDisponible(),

                'conditions' => $menu->getConditions()
                    ? [$menu->getConditions()]
                    : [],

                'theme' => $menu->getTheme()?->getNom(),
                'regime' => $menu->getRegime()?->getNom(),

                'image' => $images[0] ?? null,
                'galerie' => $images,

                'plats' => $plats,
                'allergenes' => $allergenes,
            ];
        }

        return $this->json($resultats);
    }
}
