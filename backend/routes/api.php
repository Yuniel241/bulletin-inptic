<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EtudiantController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\Api\UeController;
use App\Http\Controllers\Api\MatiereController;
use App\Http\Controllers\Api\SemestreController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\EnseignantController;






/* --- ROUTES PUBLIQUES --- */
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});


Route::post('/login', [AuthController::class, 'login']);

/* --- ROUTES PROTÉGÉES --- */
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/enseignant/mes-matieres',[MatiereController::class, 'mesMatieres']);

    // 1. Profil & Déconnexion (Accessible par TOUS les connectés)
    Route::get('/user', function (Request $request) {
        return $request->user()->load('role');
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    /* -----------------------------------------------------------
       NIVEAU A : ADMINISTRATION & SECRÉTARIAT (Gestion totale)
       ----------------------------------------------------------- */
    Route::middleware('role:admin,secretariat,etudiant,enseignant')->group(function () {
        Route::apiResource('etudiants', EtudiantController::class);
        Route::apiResource('ues', UeController::class);
        Route::apiResource('matieres', MatiereController::class);
        Route::apiResource('semestres', SemestreController::class);
        Route::apiResource('absences', AbsenceController::class);
        Route::apiResource('enseignants', EnseignantController::class);
        // Route spécifique pour l'attribution
        Route::post('/enseignants/attribuer-matiere', [EnseignantController::class, 'attribuerMatiere']);
        
        // Configuration du système (Pondérations)
        Route::get('/config/systeme', [EvaluationController::class, 'getConfig']);
        Route::post('/config/systeme', [EvaluationController::class, 'updateConfig']);
        
        // Jury
        Route::get('/jury/recapitulatif-annuel', [EvaluationController::class, 'getRecapitulatifJury']);
    });

    /* -----------------------------------------------------------
       NIVEAU B : ENSEIGNANTS (Saisie des notes)
       ----------------------------------------------------------- */
    Route::middleware('role:enseignant,admin,etudiant,secretariat')->group(function () {

        Route::apiResource('etudiants', EtudiantController::class);
            // Dans le groupe Enseignant/Admin
        Route::post('/matieres/{id}/import', [EvaluationController::class, 'importNotes']);
        // On garde l'apiResource mais on exclut l'update standard si tu ne l'utilises plus
        Route::apiResource('evaluations', EvaluationController::class)->except(['update']);

        // On ajoute la nouvelle route de mise à jour groupée
        Route::put('/evaluations-update', [EvaluationController::class, 'update']);
        
        Route::get('/stats/semestre/{semestre_id}', [EvaluationController::class, 'getStatsGlobalesSemestre']);
    });

    Route::get('/etudiants/{id}/notes', [EvaluationController::class, 'byEtudiant']); 

    Route::get('/etudiants/{id}/absences', [AbsenceController::class, 'byEtudiant']);

    /* -----------------------------------------------------------
       NIVEAU C : CONSULTATION (Étudiants & Parents)
       ----------------------------------------------------------- */


    // Encapsuler dans le préfixe "bulletins" pour correspondre à ton test
    Route::prefix('bulletins')->group(function () {
        Route::middleware(['role:admin,etudiant,secretariat'])->group(function () {
            // Accessible via : api/bulletins/semestre/{id}/{sid}
            Route::get('/semestre/{etudiant_id}/{semestre_id}', [EvaluationController::class, 'getBulletinSemestre']);
            // Accessible via : api/bulletins/annuel/{id}
            Route::get('/annuel/{etudiant_id}', [EvaluationController::class, 'getResultatAnnuel']);
        });

    });

    
    Route::get('/etudiant/current', [UserController::class, 'getCurrentUser']);

});