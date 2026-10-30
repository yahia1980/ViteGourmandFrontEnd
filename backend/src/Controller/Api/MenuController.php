<?php

namespace App\Controller\Api;

use App\Entity\Menu;
use App\Entity\MenuImage;
use App\Repository\MenuRepository;
use App\Repository\ThemeRepository;
use App\Repository\RegimeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class MenuController extends AbstractController
{
    // =====================================================
    // AFFICHER LES MENUS
    // =====================================================

    #[Route('/menus', name: 'api_menus', methods: ['GET'])]
    public function index(MenuRepository $menuRepository): JsonResponse
    {
        $menus = $menuRepository->findAll();
        $resultats = [];

        foreach ($menus as $menu) {
            $images = [];

            foreach ($menu->getMenuImages() as $menuImage) {
                $images[] = $menuImage->getChemin();
            }

            $plats = [
                'entrees' => [],
                'principaux' => [],
                'desserts' => [],
            ];

            $allergenes = [];

            foreach ($menu->getPlats() as $plat) {
                $categorie = strtolower(
                    trim($plat->getCategorie() ?? '')
                );

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

                    if (
                        $nom !== null &&
                        !in_array($nom, $allergenes, true)
                    ) {
                        $allergenes[] = $nom;
                    }
                }
            }

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

    // =====================================================
    // CRÉER UN MENU
    // =====================================================

    #[Route('/menus', name: 'api_menus_creation', methods: ['POST'])]
    #[IsGranted('ROLE_EMPLOYE')]
    public function creer(
        Request $request,
        ThemeRepository $themeRepository,
        RegimeRepository $regimeRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $contentType = $request->headers->get('Content-Type', '');

        if (str_contains($contentType, 'multipart/form-data')) {
            $donnees = $request->request->all();
        } else {
            $donnees = json_decode($request->getContent(), true);
        }

        if (!is_array($donnees)) {
            return $this->json([
                'erreur' => 'Données invalides.'
            ], 400);
        }

        $titre = trim((string) ($donnees['titre'] ?? ''));
        $description = trim((string) ($donnees['description'] ?? ''));
        $conditions = trim((string) ($donnees['conditions'] ?? ''));

        $personnesMin = filter_var(
            $donnees['personnesMin'] ?? null,
            FILTER_VALIDATE_INT
        );

        $stock = filter_var(
            $donnees['stock'] ?? null,
            FILTER_VALIDATE_INT
        );

        $prixBrut = $donnees['prix'] ?? null;

        $prix = is_int($prixBrut)
            || is_float($prixBrut)
            || is_string($prixBrut)
            ? trim((string) $prixBrut)
            : '';

        $themeId = filter_var(
            $donnees['themeId'] ?? null,
            FILTER_VALIDATE_INT
        );

        $regimeId = filter_var(
            $donnees['regimeId'] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($titre === '' || mb_strlen($titre) > 150) {
            return $this->json([
                'erreur' => 'Le titre est obligatoire et doit contenir au maximum 150 caractères.'
            ], 400);
        }

        if ($description === '' || $conditions === '') {
            return $this->json([
                'erreur' => 'La description et les conditions sont obligatoires.'
            ], 400);
        }

        if ($personnesMin === false || $personnesMin < 1) {
            return $this->json([
                'erreur' => 'Le nombre minimum de personnes doit être supérieur à zéro.'
            ], 400);
        }

        if ($stock === false || $stock < 0) {
            return $this->json([
                'erreur' => 'Le stock doit être un entier positif ou nul.'
            ], 400);
        }

        if (
            !preg_match('/^\d{1,8}(?:\.\d{1,2})?$/', $prix)
            || (float) $prix <= 0
        ) {
            return $this->json([
                'erreur' => 'Le prix doit être positif, avec au maximum deux décimales.'
            ], 400);
        }

        if ($themeId === false || $regimeId === false) {
            return $this->json([
                'erreur' => 'Un thème et un régime valides sont obligatoires.'
            ], 400);
        }

        $theme = $themeRepository->find($themeId);
        $regime = $regimeRepository->find($regimeId);

        if ($theme === null || $regime === null) {
            return $this->json([
                'erreur' => 'Le thème ou le régime sélectionné est introuvable.'
            ], 404);
        }

        // Récupération des images
        $images = $request->files->all('images');

        $images = array_values(array_filter(
            $images,
            fn ($image) => $image !== null
        ));

        if (count($images) > 10) {
            return $this->json([
                'erreur' => 'Maximum 10 images par menu.'
            ], 400);
        }

        $extensionsAutorisees = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        foreach ($images as $image) {
            if (!$image instanceof UploadedFile || !$image->isValid()) {
                return $this->json([
                    'erreur' => 'Un fichier image est invalide.'
                ], 400);
            }

            if ($image->getSize() > 5 * 1024 * 1024) {
                return $this->json([
                    'erreur' => 'Chaque image doit faire 5 Mo maximum.'
                ], 400);
            }

            if (!isset($extensionsAutorisees[$image->getMimeType()])) {
                return $this->json([
                    'erreur' => 'Seuls les formats JPEG, PNG et WebP sont autorisés.'
                ], 400);
            }
        }

        $dossierImages = dirname(
            $this->getParameter('kernel.project_dir')
        ) . '/dist/images/uploads/imagesMenus';

        if (!is_dir($dossierImages)) {
            if (
                !mkdir($dossierImages, 0775, true) &&
                !is_dir($dossierImages)
            ) {
                return $this->json([
                    'erreur' => 'Impossible de créer le dossier des images.'
                ], 500);
            }
        }

        $menu = new Menu();

        $menu->setTitre($titre);
        $menu->setDescription($description);
        $menu->setNombrePersonnesMin($personnesMin);
        $menu->setPrix($prix);
        $menu->setStockDisponible($stock);
        $menu->setConditions($conditions);
        $menu->setTheme($theme);
        $menu->setRegime($regime);

        $entityManager->persist($menu);

        $cheminsImages = [];
        $fichiersEnregistres = [];

        try {
            foreach ($images as $image) {
                $mimeType = $image->getMimeType();
                $extension = $extensionsAutorisees[$mimeType];

                $nomFichier = bin2hex(random_bytes(16))
                    . '.' . $extension;

                $image->move($dossierImages, $nomFichier);

                $fichiersEnregistres[] =
                    $dossierImages . '/' . $nomFichier;

                $cheminPublic =
                    '/images/uploads/imagesMenus/' . $nomFichier;

                $menuImage = new MenuImage();
                $menuImage->setChemin($cheminPublic);
                $menuImage->setMenu($menu);

                $entityManager->persist($menuImage);

                $cheminsImages[] = $cheminPublic;
            }

            $entityManager->flush();

        } catch (\Throwable $exception) {
            foreach ($fichiersEnregistres as $fichier) {
                if (is_file($fichier)) {
                    @unlink($fichier);
                }
            }

            return $this->json([
                'erreur' => 'Impossible d’enregistrer le menu ou ses images.'
            ], 500);
        }

        return $this->json([
            'message' => 'Menu créé avec succès.',
            'menu' => [
                'id' => $menu->getId(),
                'titre' => $menu->getTitre(),
                'description' => $menu->getDescription(),
                'personnesMin' => $menu->getNombrePersonnesMin(),
                'prix' => (float) $menu->getPrix(),
                'stock' => $menu->getStockDisponible(),
                'theme' => $theme->getNom(),
                'regime' => $regime->getNom(),
                'image' => $cheminsImages[0] ?? null,
                'galerie' => $cheminsImages,
            ],
        ], 201);
    }

    // =====================================================
    // MODIFIER UN MENU
    // =====================================================

    #[Route(
        '/menus/{id}/modifier',
        name: 'api_menus_modifier',
        methods: ['POST'],
        requirements: ['id' => '\d+']
    )]
    #[IsGranted('ROLE_EMPLOYE')]
    public function modifier(
        int $id,
        Request $request,
        MenuRepository $menuRepository,
        ThemeRepository $themeRepository,
        RegimeRepository $regimeRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $menu = $menuRepository->find($id);

        if (!$menu) {
            return $this->json([
                'erreur' => 'Menu introuvable.'
            ], 404);
        }

        $donnees = $request->request->all();

        $titre = trim((string) ($donnees['titre'] ?? ''));
        $description = trim((string) ($donnees['description'] ?? ''));
        $conditions = trim((string) ($donnees['conditions'] ?? ''));

        $personnesMin = filter_var(
            $donnees['personnesMin'] ?? null,
            FILTER_VALIDATE_INT
        );

        $stock = filter_var(
            $donnees['stock'] ?? null,
            FILTER_VALIDATE_INT
        );

        $prix = trim((string) ($donnees['prix'] ?? ''));

        $themeId = filter_var(
            $donnees['themeId'] ?? null,
            FILTER_VALIDATE_INT
        );

        $regimeId = filter_var(
            $donnees['regimeId'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (
            $titre === '' ||
            mb_strlen($titre) > 150 ||
            $description === '' ||
            $conditions === ''
        ) {
            return $this->json([
                'erreur' => 'Titre, description ou conditions invalides.'
            ], 400);
        }

        if (
            $personnesMin === false ||
            $personnesMin < 1 ||
            $stock === false ||
            $stock < 0
        ) {
            return $this->json([
                'erreur' => 'Nombre de personnes ou stock invalide.'
            ], 400);
        }

        if (
            !preg_match('/^\d{1,8}(?:\.\d{1,2})?$/', $prix) ||
            (float) $prix <= 0
        ) {
            return $this->json([
                'erreur' => 'Prix invalide.'
            ], 400);
        }

        if (!$themeId || !$regimeId) {
            return $this->json([
                'erreur' => 'Thème ou régime invalide.'
            ], 400);
        }

        $theme = $themeRepository->find($themeId);
        $regime = $regimeRepository->find($regimeId);

        if (!$theme || !$regime) {
            return $this->json([
                'erreur' => 'Thème ou régime introuvable.'
            ], 404);
        }

        // Nouvelles images envoyées
        $images = $request->files->all('images');

        $images = array_values(array_filter(
            $images,
            fn ($image) => $image !== null
        ));

        if (count($images) > 10) {
            return $this->json([
                'erreur' => 'Maximum 10 nouvelles images.'
            ], 400);
        }

        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        foreach ($images as $image) {
            if (
                !$image instanceof UploadedFile ||
                !$image->isValid() ||
                $image->getSize() > 5 * 1024 * 1024 ||
                !isset($extensions[$image->getMimeType()])
            ) {
                return $this->json([
                    'erreur' => 'Image invalide (JPG, PNG ou WebP, 5 Mo maximum).'
                ], 400);
            }
        }

        // Modifier les informations du menu
        $menu->setTitre($titre);
        $menu->setDescription($description);
        $menu->setConditions($conditions);
        $menu->setNombrePersonnesMin($personnesMin);
        $menu->setStockDisponible($stock);
        $menu->setPrix($prix);
        $menu->setTheme($theme);
        $menu->setRegime($regime);

        $dossierImages = dirname(
            $this->getParameter('kernel.project_dir')
        ) . '/dist/images/uploads/imagesMenus';

        $fichiersEnregistres = [];
        $anciennesImages = $menu->getMenuImages()->toArray();
        $anciensFichiers = [];
        $nouveauxChemins = [];

        try {
            // Remplacer les anciennes images uniquement
            // si de nouvelles images ont été envoyées.
            if (!empty($images)) {

                if (
                    !is_dir($dossierImages) &&
                    !mkdir($dossierImages, 0775, true) &&
                    !is_dir($dossierImages)
                ) {
                    throw new \RuntimeException(
                        'Dossier images inaccessible.'
                    );
                }

                // Préparer les anciens fichiers à supprimer.
                foreach ($anciennesImages as $ancienneImage) {
                    $chemin = $ancienneImage->getChemin();

                    if (
                        $chemin !== null &&
                        str_starts_with(
                            $chemin,
                            '/images/uploads/imagesMenus/'
                        )
                    ) {
                        $anciensFichiers[] =
                            $dossierImages . '/' . basename($chemin);
                    }
                }

                // Enregistrer les nouvelles images.
                foreach ($images as $image) {
                    $extension = $extensions[$image->getMimeType()];

                    $nomFichier =
                        bin2hex(random_bytes(16)) . '.' . $extension;

                    $image->move($dossierImages, $nomFichier);

                    $fichiersEnregistres[] =
                        $dossierImages . '/' . $nomFichier;

                    $cheminPublic =
                        '/images/uploads/imagesMenus/' . $nomFichier;

                    $menuImage = new MenuImage();
                    $menuImage->setMenu($menu);
                    $menuImage->setChemin($cheminPublic);

                    $entityManager->persist($menuImage);

                    $nouveauxChemins[] = $cheminPublic;
                }

                // Retirer les anciennes images de la base.
                foreach ($anciennesImages as $ancienneImage) {
                    $menu->getMenuImages()->removeElement(
                        $ancienneImage
                    );

                    $entityManager->remove($ancienneImage);
                }
            }

            $entityManager->flush();

            // Supprimer les anciens fichiers après succès.
            if (!empty($images)) {
                foreach ($anciensFichiers as $ancienFichier) {
                    if (is_file($ancienFichier)) {
                        @unlink($ancienFichier);
                    }
                }
            }

        } catch (\Throwable $exception) {
            foreach ($fichiersEnregistres as $fichier) {
                if (is_file($fichier)) {
                    @unlink($fichier);
                }
            }

            return $this->json([
                'erreur' => 'Impossible de modifier le menu.'
            ], 500);
        }

        // Réponse après modification réussie
        return $this->json([
            'message' => 'Menu modifié avec succès.',
            'menu' => [
                'id' => $menu->getId(),
                'titre' => $menu->getTitre(),
                'description' => $menu->getDescription(),
                'personnesMin' => $menu->getNombrePersonnesMin(),
                'prix' => (float) $menu->getPrix(),
                'stock' => $menu->getStockDisponible(),
                'theme' => $menu->getTheme()?->getNom(),
                'regime' => $menu->getRegime()?->getNom(),
                'image' => !empty($nouveauxChemins)
                    ? $nouveauxChemins[0]
                    : ($menu->getMenuImages()->first()
                        ? $menu->getMenuImages()->first()->getChemin()
                        : null),
            ]
        ], 200);
    }

    // =====================================================
    // SUPPRIMER UN MENU
    // =====================================================

    #[Route(
        '/menus/{id}',
        name: 'api_menus_supprimer',
        methods: ['DELETE'],
        requirements: ['id' => '\d+']
    )]
    #[IsGranted('ROLE_EMPLOYE')]
    public function supprimer(
        int $id,
        MenuRepository $menuRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $menu = $menuRepository->find($id);

        if (!$menu) {
            return $this->json([
                'erreur' => 'Menu introuvable.'
            ], 404);
        }

        // Ne pas supprimer un menu lié à des commandes.
        if (!$menu->getCommandes()->isEmpty()) {
            return $this->json([
                'erreur' => 'Impossible de supprimer un menu associé à des commandes.'
            ], 409);
        }

        $images = $menu->getMenuImages()->toArray();

        try {
            foreach ($images as $image) {
                $entityManager->remove($image);
            }

            // Supprimer les associations avec les plats.
            foreach ($menu->getPlats()->toArray() as $plat) {
                $menu->removePlat($plat);
            }

            $entityManager->remove($menu);
            $entityManager->flush();

        } catch (\Throwable $exception) {
            return $this->json([
                'erreur' => 'Suppression impossible : vérifiez les associations du menu.'
            ], 409);
        }

        // Supprimer uniquement les fichiers du dossier d'upload.
        $dossierImages = dirname(
            $this->getParameter('kernel.project_dir')
        ) . '/dist/images/uploads/imagesMenus';

        foreach ($images as $image) {
            $chemin = $image->getChemin();

            if (
                $chemin !== null &&
                str_starts_with(
                    $chemin,
                    '/images/uploads/imagesMenus/'
                )
            ) {
                $fichier =
                    $dossierImages . '/' . basename($chemin);

                if (is_file($fichier)) {
                    @unlink($fichier);
                }
            }
        }

        return $this->json([
            'message' => 'Menu supprimé avec succès.'
        ]);
    }
}
