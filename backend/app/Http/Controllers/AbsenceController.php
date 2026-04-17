<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use Illuminate\Http\Request;
use App\Http\Controllers\EvaluationController;
use Illuminate\Support\Facades\Auth;

class AbsenceController extends Controller
{
    /**
     * Liste toutes les absences (pour l'admin)
     */
    public function index()
    {
        return response()->json(Absence::with(['etudiant', 'matiere'])->get());
    }

    /**
     * Enregistrer une absence (Point 5.4)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'matiere_id'  => 'required|exists:matieres,id',
            'heures'      => 'required|integer|min:1',
        ]);

        $absence = Absence::create($validated);

        // Recalcul immédiat de la moyenne de la matière
        (new EvaluationController())->recalculerMoyenneMatiere($absence->etudiant_id, $absence->matiere_id);

        return response()->json($absence, 201);
    }

    /**
     * Afficher une absence précise
     */
    public function show($id)
    {
        $absence = Absence::with(['etudiant', 'matiere'])->find($id);
        return $absence ? response()->json($absence) : response()->json(['message' => 'Absence non trouvée'], 404);
    }

    /**
     * Mettre à jour une absence (ex: modification du nombre d'heures)
     */
    public function update(Request $request, $id)
    {
        $absence = Absence::findOrFail($id);
        $validated = $request->validate([
            'heures' => 'sometimes|integer|min:1',
        ]);

        $absence->update($validated);

        // Recalcul en cas de changement d'heures
        (new EvaluationController())->recalculerMoyenneMatiere($absence->etudiant_id, $absence->matiere_id);

        return response()->json($absence);
    }

    /**
     * Supprimer une absence (et annuler la pénalité)
     */
    public function destroy($id)
    {
        $absence = Absence::findOrFail($id);
        $etudiant_id = $absence->etudiant_id;
        $matiere_id = $absence->matiere_id;
        
        $absence->delete();

        // On recalcule pour "rendre" les points à l'étudiant
        (new EvaluationController())->recalculerMoyenneMatiere($etudiant_id, $matiere_id);

        return response()->json(['message' => 'Absence supprimée, moyenne recalculée.']);
    }

    /**
     * Route personnalisée pour le profil étudiant
     */
     public function byEtudiant($id)
    {
        $user = Auth::user();

        if($user->role?->nom === 'etudiant') {
            $etudiant = \App\Models\Etudiant::where('user_id', $user->id)->first();
        }

        // Si c'est un étudiant (4), il ne peut voir que les siennes
        if ($user->role_id == 4 && $etudiant->id != $id) {
            return response()->json(['message' => 'Vous ne pouvez pas consulter les absences d\'un autre étudiant.'], 403);
        }

        // L'admin et le secrétariat peuvent consulter n'importe quel ID
        return response()->json(
            Absence::where('etudiant_id', $id)->with('matiere')->get()
        );
    }
}