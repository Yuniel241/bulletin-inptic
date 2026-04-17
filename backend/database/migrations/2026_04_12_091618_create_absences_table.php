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
        Schema::create('absences', function (Blueprint $table) {
        $table->id();
        $table->foreignId('etudiant_id')->constrained('etudiant')->onDelete('cascade');
        $table->foreignId('matiere_id')->constrained('matiere')->onDelete('cascade');
        $table->decimal('heures', 5, 2)->default(0);
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absences');
    }
};
