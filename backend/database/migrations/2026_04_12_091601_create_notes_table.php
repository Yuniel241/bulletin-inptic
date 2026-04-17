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
        Schema::create('notes', function (Blueprint $table) {
          $table->id();
        $table->foreignId('etudiant_id')->constrained('etudiant')->onDelete('cascade');
        $table->foreignId('matiere_id')->constrained('matiere')->onDelete('cascade');
        $table->decimal('note_cc', 4, 2)->nullable(); // Note Contrôle Continu
        $table->decimal('note_examen', 4, 2)->nullable();
        $table->decimal('note_rattrapage', 4, 2)->nullable();
        $table->string('semestre', 20); // Ex: Semestre 1
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
