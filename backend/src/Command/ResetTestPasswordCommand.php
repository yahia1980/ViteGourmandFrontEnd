<?php

namespace App\Command;

use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:reset-test-password',
    description: 'Réinitialise le mot de passe du compte de test'
)]
class ResetTestPasswordCommand extends Command
{
    public function __construct(
        private UtilisateurRepository $utilisateurRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct();
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output
    ): int {
        $io = new SymfonyStyle($input, $output);

        $utilisateur = $this->utilisateurRepository
            ->findOneBy(['email' => 'client.test@example.com']);

        if (!$utilisateur) {
            $io->error('Compte de test introuvable.');
            return Command::FAILURE;
        }

        $password = $io->askHidden('Nouveau mot de passe du compte de test');

        if (!$password || strlen($password) < 12) {
            $io->error('Le mot de passe doit contenir au moins 12 caractères.');
            return Command::FAILURE;
        }

        $hash = $this->passwordHasher->hashPassword(
            $utilisateur,
            $password
        );

        $utilisateur->setPassword($hash);

        $this->entityManager->flush();

        $io->success('Mot de passe du compte de test modifié.');

        return Command::SUCCESS;
    }
}
