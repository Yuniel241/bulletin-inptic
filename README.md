🎓 Système de Gestion des Bulletins - INPTIC
Ce projet est une solution complète (Fullstack) pour la gestion des notes, des absences et la génération de bulletins scolaires. Le projet garantit une fidélité visuelle entre l'écran et le PDF grâce à l'intégration de Puppeteer.

📋 Prérequis
Avant de commencer, assurez-vous d'avoir installé :

PHP (>= 8.2) & Composer

Node.js (LTS) & NPM

MySQL (via XAMPP, WAMP, ou Laragon)

🚀 Installation rapide
1. Récupérer le projet
Ouvrez un terminal et clonez le dépôt depuis GitHub :

Bash
git clone https://github.com/Yuniel241/bulletin-inptic.git
cd bulletin-inptic
2. Configuration du Backend (Laravel)
Le serveur gère l'API et la logique de calcul des moyennes.

Bash
# Entrer dans le dossier backend
cd backend

# Installer les dépendances
composer install

# Configurer l'environnement
cp .env.example .env

# Générer la clé de sécurité
php artisan key:generate
Configuration de la base de données :
Ouvrez le fichier .env dans VS Code et modifiez les lignes suivantes avec vos accès :

Extrait de code
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=votre_nom_de_bdd
DB_USERNAME=root
DB_PASSWORD=
Initialisation de la base (Migrations + Seeders) :
Cette commande crée les tables et remplit la base avec les rôles (Admin, Étudiant, Enseignant) et les données de test :

Bash
php artisan migrate --seed
Lancer le serveur API :

Bash
php artisan serve
L'API est maintenant active sur http://127.0.0.1:8000.

3. Configuration du Frontend (React)
L'interface utilisateur est rapide et réactive.

Bash
# Revenir à la racine puis entrer dans le frontend
cd ../frontend

# Installer les dépendances (installe aussi Puppeteer pour les PDF)
npm install

# Lancer l'application
npm run dev
L'interface est disponible sur http://localhost:5173