<?php

namespace App\Command;

use App\Repository\CommandeRepository;
use App\Service\StatistiquesMongoDBService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:sync-statistiques',
    description: 'Synchronise les commandes MySQL vers MongoDB.'
)]
class SynchroniserStatistiquesCommand extends Command
{
    public function __construct(
        private readonly CommandeRepository $commandeRepository,
        private readonly StatistiquesMongoDBService $statistiquesMongoDBService
    ) {
        parent::__construct();
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output
    ): int {
        $commandes = $this->commandeRepository->findAll();

        $total = 0;

        foreach ($commandes as $commande) {
            $this->statistiquesMongoDBService
                ->enregistrerCommande($commande);

            $total++;
        }

        $output->writeln(
            '<info>Synchronisation terminée : '
            . $total
            . ' commande(s) traitée(s).</info>'
        );

        return Command::SUCCESS;
    }
}
