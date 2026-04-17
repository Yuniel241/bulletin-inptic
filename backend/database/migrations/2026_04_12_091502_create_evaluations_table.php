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
        Schema::create('evaluations', function (Blueprint $table) {
     $table->id();
    $table->foreignId('matiere_id')->constrained();
    $table->foreignId('etudiant_id')->constrained();
    $table->enum('type', ['CC', 'Examen', 'Rattrapage']);
    $table->decimal('note', 4, 2);
    $table->date('date_saisie');
    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
