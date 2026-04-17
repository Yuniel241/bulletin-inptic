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
       Schema::create('configs', function (Blueprint $table) {
        $table->id();
        $table->string('cle')->unique(); // ex: 'poids_cc'
        $table->string('valeur');        // ex: '0.4'
        $table->timestamps();
    });

    // Optionnel : Insérer les valeurs par défaut du cahier des charges immédiatement
    DB::table('configs')->insert([
        ['cle' => 'poids_cc', 'valeur' => '0.4', 'created_at' => now()],
        ['cle' => 'poids_examen', 'valeur' => '0.6', 'created_at' => now()],
        ['cle' => 'penalite_absence', 'valeur' => '0.01', 'created_at' => now()],
    ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configs');
    }
};
