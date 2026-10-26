<?php

namespace App\Command;

use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:reset-admin-password',
    description: 'Modifier le mot de passe administrateur'
)]
class ResetAdminPasswordCommand extends Command
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
        $admin = $this->utilisateurRepository->findOneBy([
            'email' => 'vitegourmand@gmail.com'
        ]);

        if (!$admin || !in_array('ROLE_ADMIN', $admin->getRoles(), true)) {
            $output->writeln('<error>Administrateur introuvable.</error>');
            return Command::FAILURE;
        }

        $question = new Question('Nouveau mot de passe : ');
        $question->setHidden(true);
        $question->setHiddenFallback(false);

        $password = (string) $this->getHelper('question')
            ->ask($input, $output, $question);

        if (
            mb_strlen($password) < 12 ||
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[0-9]/', $password) ||
            !preg_match('/[^A-Za-z0-9]/', $password)
        ) {
            $output->writeln(
                '<error>Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.</error>'
            );
            return Command::FAILURE;
        }

        $admin->setPassword(
            $this->passwordHasher->hashPassword($admin, $password)
        );

        $this->entityManager->flush();

        $output->writeln(
            '<info>Mot de passe administrateur modifié avec succès !</info>'
        );

        return Command::SUCCESS;
    }
}
