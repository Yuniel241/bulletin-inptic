<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
  public function run(): void
{
    // On récupère l'ID du rôle admin
    $adminRoleId = \DB::table('roles')->where('nom', 'admin')->first()->id;

    \App\Models\User::updateOrCreate(
        ['email' => 'admin@inptic.ga'], // Identifiant de connexion
        [
            'name' => 'Admin LP ASUR',
            'password' => Hash::make('password123'), // Mot de passe par défaut
            'role_id' => $adminRoleId,
        ]
    );
}
}
