<?php

namespace App\Command;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin',
    description: 'Créer le compte administrateur initial'
)]
class CreateAdminCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UtilisateurRepository $utilisateurRepository,
        private UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct();
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output
    ): int {
        $io = new SymfonyStyle($input, $output);

        // Empêcher la création d'un autre administrateur
        $admins = $this->utilisateurRepository->findAll();

        foreach ($admins as $admin) {
            if (in_array('ROLE_ADMIN', $admin->getRoles(), true)) {
                $io->error('Un administrateur existe déjà.');
                return Command::FAILURE;
            }
        }

        $helper = $this->getHelper('question');

        $emailQuestion = new Question('Email de José : ');
        $email = mb_strtolower(trim(
            (string) $helper->ask($input, $output, $emailQuestion)
        ));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 180) {
            $io->error('Adresse email invalide.');
            return Command::FAILURE;
        }

        if ($this->utilisateurRepository->findOneBy(['email' => $email])) {
            $io->error('Cette adresse email est déjà utilisée.');
            return Command::FAILURE;
        }

        $passwordQuestion = new Question('Mot de passe : ');
        $passwordQuestion->setHidden(true);
        $passwordQuestion->setHiddenFallback(false);

        $password = (string) $helper->ask(
            $input,
            $output,
            $passwordQuestion
        );

        if (
            mb_strlen($password) < 12 ||
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[0-9]/', $password) ||
            !preg_match('/[^A-Za-z0-9]/', $password)
        ) {
            $io->error('Mot de passe : 12 caractères minimum, majuscule, minuscule, chiffre et caractère spécial.');
            return Command::FAILURE;
        }

        $admin = new Utilisateur();

        $admin->setEmail($email);
        $admin->setNom('Administrateur');
        $admin->setPrenom('José');
        $admin->setTelephone('');
        $admin->setAdresse('');
        $admin->setCodePostal('');
        $admin->setVille('');
        $admin->setRoles(['ROLE_ADMIN']);

        $admin->setPassword(
            $this->passwordHasher->hashPassword($admin, $password)
        );

        $this->entityManager->persist($admin);
        $this->entityManager->flush();

        $io->success('Le compte administrateur de José a été créé.');

        return Command::SUCCESS;
    }
}
