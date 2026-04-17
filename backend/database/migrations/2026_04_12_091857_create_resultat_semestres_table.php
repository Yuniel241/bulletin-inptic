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
        Schema::create('resultat_semestres', function (Blueprint $table) {
           $table->id();
    $table->foreignId('etudiant_id')->constrained('etudiants')->onDelete('cascade');
    $table->foreignId('semestre_id')->constrained('semestres')->onDelete('cascade');
    $table->decimal('moyenne_semestre', 4, 2);
    $table->integer('credits_total')->default(0);
    $table->boolean('valide')->default(false);
    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resultat_semestres');
    }
};
