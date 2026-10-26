<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261026164704 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

  public function up(Schema $schema): void
{
    // Ajouter les deux colonnes
    $this->addSql(
        'ALTER TABLE utilisateur
         ADD actif TINYINT DEFAULT 1 NOT NULL,
         ADD date_creation DATETIME DEFAULT NULL'
    );

    // Initialiser la date pour les utilisateurs existants
    $this->addSql(
        'UPDATE utilisateur
         SET date_creation = NOW()
         WHERE date_creation IS NULL'
    );

    // Rendre la date obligatoire
    $this->addSql(
        'ALTER TABLE utilisateur
         MODIFY date_creation DATETIME NOT NULL'
    );
}

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE utilisateur DROP actif, DROP date_creation');
    }
}
