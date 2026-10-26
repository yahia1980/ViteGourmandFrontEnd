<?php

namespace App\Entity;

use App\Repository\CommandeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CommandeRepository::class)]
class Commande
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateCommande = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $datePrestation = null;

    #[ORM\Column]
    private ?int $nombrePersonnes = null;

    #[ORM\Column(length: 255)]
    private ?string $adresseLivraison = null;

    #[ORM\Column(length: 10)]
    private ?string $codePostalLivraison = null;

    #[ORM\Column(length: 100)]
    private ?string $villeLivraison = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $montantTotal = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $fraisLivraison = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $montantReduction = null;

    #[ORM\Column(length: 50)]
    private ?string $statut = null;

    #[ORM\ManyToOne(inversedBy: 'commandes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    #[ORM\ManyToOne(inversedBy: 'commandes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Menu $menu = null;

    /**
     * @var Collection<int, HistoriqueStatutCommande>
     */
    #[ORM\OneToMany(targetEntity: HistoriqueStatutCommande::class, mappedBy: 'commande')]
    private Collection $historiqueStatutCommandes;

    /**
     * @var Collection<int, Avis>
     */
    #[ORM\OneToMany(targetEntity: Avis::class, mappedBy: 'commande')]
    private Collection $avis;

    public function __construct()
{
    $this->historiqueStatutCommandes = new ArrayCollection();
    $this->avis = new ArrayCollection();

    $this->dateCommande = new \DateTimeImmutable();
    $this->statut = 'en_attente';
}
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDateCommande(): ?\DateTimeImmutable
    {
        return $this->dateCommande;
    }

    public function setDateCommande(\DateTimeImmutable $dateCommande): static
    {
        $this->dateCommande = $dateCommande;

        return $this;
    }

    public function getDatePrestation(): ?\DateTimeImmutable
    {
        return $this->datePrestation;
    }

    public function setDatePrestation(\DateTimeImmutable $datePrestation): static
    {
        $this->datePrestation = $datePrestation;

        return $this;
    }

    public function getNombrePersonnes(): ?int
    {
        return $this->nombrePersonnes;
    }

    public function setNombrePersonnes(int $nombrePersonnes): static
    {
        $this->nombrePersonnes = $nombrePersonnes;

        return $this;
    }

    public function getAdresseLivraison(): ?string
    {
        return $this->adresseLivraison;
    }

    public function setAdresseLivraison(string $adresseLivraison): static
    {
        $this->adresseLivraison = $adresseLivraison;

        return $this;
    }

    public function getCodePostalLivraison(): ?string
    {
        return $this->codePostalLivraison;
    }

    public function setCodePostalLivraison(string $codePostalLivraison): static
    {
        $this->codePostalLivraison = $codePostalLivraison;

        return $this;
    }

    public function getVilleLivraison(): ?string
    {
        return $this->villeLivraison;
    }

    public function setVilleLivraison(string $villeLivraison): static
    {
        $this->villeLivraison = $villeLivraison;

        return $this;
    }

    public function getMontantTotal(): ?string
    {
        return $this->montantTotal;
    }

    public function setMontantTotal(string $montantTotal): static
    {
        $this->montantTotal = $montantTotal;

        return $this;
    }

    public function getFraisLivraison(): ?string
    {
        return $this->fraisLivraison;
    }

    public function setFraisLivraison(string $fraisLivraison): static
    {
        $this->fraisLivraison = $fraisLivraison;

        return $this;
    }

    public function getMontantReduction(): ?string
    {
        return $this->montantReduction;
    }

    public function setMontantReduction(string $montantReduction): static
    {
        $this->montantReduction = $montantReduction;

        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getUtilisateur(): ?Utilisateur
    {
        return $this->utilisateur;
    }

    public function setUtilisateur(?Utilisateur $utilisateur): static
    {
        $this->utilisateur = $utilisateur;

        return $this;
    }

    public function getMenu(): ?Menu
    {
        return $this->menu;
    }

    public function setMenu(?Menu $menu): static
    {
        $this->menu = $menu;

        return $this;
    }

    /**
     * @return Collection<int, HistoriqueStatutCommande>
     */
    public function getHistoriqueStatutCommandes(): Collection
    {
        return $this->historiqueStatutCommandes;
    }

    public function addHistoriqueStatutCommande(HistoriqueStatutCommande $historiqueStatutCommande): static
    {
        if (!$this->historiqueStatutCommandes->contains($historiqueStatutCommande)) {
            $this->historiqueStatutCommandes->add($historiqueStatutCommande);
            $historiqueStatutCommande->setCommande($this);
        }

        return $this;
    }

    public function removeHistoriqueStatutCommande(HistoriqueStatutCommande $historiqueStatutCommande): static
    {
        if ($this->historiqueStatutCommandes->removeElement($historiqueStatutCommande)) {
            // set the owning side to null (unless already changed)
            if ($historiqueStatutCommande->getCommande() === $this) {
                $historiqueStatutCommande->setCommande(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Avis>
     */
    public function getAvis(): Collection
    {
        return $this->avis;
    }

    public function addAvi(Avis $avi): static
    {
        if (!$this->avis->contains($avi)) {
            $this->avis->add($avi);
            $avi->setCommande($this);
        }

        return $this;
    }

    public function removeAvi(Avis $avi): static
    {
        if ($this->avis->removeElement($avi)) {
            // set the owning side to null (unless already changed)
            if ($avi->getCommande() === $this) {
                $avi->setCommande(null);
            }
        }

        return $this;
    }
}
