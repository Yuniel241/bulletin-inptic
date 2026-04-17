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
        Schema::create('matieres', function (Blueprint $table) {
$table->id();
    $table->string('code')->unique();
    $table->string('libelle');
    $table->decimal('coefficient', 5, 2);
    $table->integer('credits');
    $table->foreignId('ue_id')->constrained('ues');
    // On lie au user qui a le rôle 'enseignant'
    $table->foreignId('enseignant_id')->nullable()->constrained('users'); 
    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matieres');
    }
};
