<?php

namespace Database\Seeders;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
public function run(): void
{
    $roles = [
        ['nom' => 'admin', 'description' => 'Gestion totale du système'],
        ['nom' => 'enseignant', 'description' => 'Saisie des notes et gestion des cours'],
        ['nom' => 'secretariat', 'description' => 'Gestion administrative et bulletins'],
        ['nom' => 'etudiant', 'description' => 'Consultation des notes'],
    ];

    foreach ($roles as $role) {
        // Pour DB::table, on utilise updateOrInsert
        \DB::table('roles')->updateOrInsert(
            ['nom' => $role['nom']], // La condition de recherche
            ['description' => $role['description']] // Les données à mettre à jour ou insérer
        );
    }
}
}
