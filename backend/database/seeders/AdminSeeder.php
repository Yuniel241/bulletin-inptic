<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Administrateur Système',
            'email' => 'admin@inptic.ga',
            'password' => Hash::make('Admin2026'),
            'role_id' => 1,
        ]);
    }
}