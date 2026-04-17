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
        Schema::create('resultat_annuels', function (Blueprint $table) {
          $table->id();
    $table->foreignId('etudiant_id')->constrained('etudiants')->onDelete('cascade');
    $table->string('annee'); // Ex: 2025-2026
    $table->decimal('moyenne_annuelle', 4, 2);
    $table->string('decision_jury')->nullable(); // Admis, Redouble, etc.
    $table->string('mention')->nullable(); // Passable, Bien, Très bien...
    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resultat_annuels');
    }
};
