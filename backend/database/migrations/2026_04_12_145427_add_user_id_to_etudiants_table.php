<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('etudiants', function (Blueprint $table) {
            // 1. On ajoute la colonne user_id
        // onConstrained('users') lie cette colonne à la table users
        // cascadeOnDelete() : si on supprime le User, l'Etudiant est supprimé aussi
        $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('etudiants', function (Blueprint $table) {
           $table->dropForeign(['user_id']);
        $table->dropColumn('user_id');
        });
    }
};
