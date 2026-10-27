<?php

namespace App\Entity;

use App\Repository\HoraireRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: HoraireRepository::class)]
class Horaire
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    private ?string $jour = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $heureOuverture = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $heureFermeture = null;

    #[ORM\Column]
    private ?bool $ferme = false;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getJour(): ?string
    {
        return $this->jour;
    }

    public function setJour(string $jour): static
    {
        $this->jour = $jour;

        return $this;
    }

    public function getHeureOuverture(): ?\DateTimeImmutable
    {
        return $this->heureOuverture;
    }

    public function setHeureOuverture(?\DateTimeImmutable $heureOuverture): static
    {
        $this->heureOuverture = $heureOuverture;

        return $this;
    }

    public function getHeureFermeture(): ?\DateTimeImmutable
    {
        return $this->heureFermeture;
    }

    public function setHeureFermeture(?\DateTimeImmutable $heureFermeture): static
    {
        $this->heureFermeture = $heureFermeture;

        return $this;
    }

    public function isFerme(): ?bool
    {
        return $this->ferme;
    }

    public function setFerme(bool $ferme): static
    {
        $this->ferme = $ferme;

        return $this;
    }
}
