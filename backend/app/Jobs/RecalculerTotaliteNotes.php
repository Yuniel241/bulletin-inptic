<?php
namespace App\Jobs;

use App\Models\Etudiant;
use App\Models\Matiere;
use App\Http\Controllers\EvaluationController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculerTotaliteNotes implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        $controller = new EvaluationController();
        $etudiants = Etudiant::all();
        $matieres = Matiere::all();

        foreach ($etudiants as $etudiant) {
            foreach ($matieres as $matiere) {
                // On appelle ta méthode privée via Reflection ou en la passant en public
                // Ici, pour l'exemple, on considère qu'on lance le cycle de calcul
                $controller->recalculerMoyenneMatiere($etudiant->id, $matiere->id);
            }
        }
    }
}