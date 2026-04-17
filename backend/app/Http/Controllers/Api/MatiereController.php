<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enseignant;
use App\Models\Matiere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MatiereController extends Controller
{
    /**
     * Liste toutes les matières (Vue Admin)
     */
    public function index()
    {
        return response()->json(Matiere::with(['ue', 'enseignant', 'evaluations'])->get());
    }

    /**
     * Créer une nouvelle matière
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:matieres,code',
            'libelle' => 'required|string',
            'coefficient' => 'required|numeric|min:1',
            'credits' => 'required|integer|min:1',
            'ue_id' => 'required|exists:ues,id',
            'enseignant_id' => 'nullable|exists:enseignants,id'
        ]);

        $matiere = Matiere::create($validated);
        return response()->json($matiere, 201);
    }

    /**
     * Mettre à jour une matière (avec sécurité Enseignant)
     */
    public function update(Request $request, $id)
    {
        $matiere = Matiere::findOrFail($id);
        

        $validated = $request->validate([
            'code' => 'sometimes|string|unique:matieres,code,' . $id,
            'libelle' => 'sometimes|string',
            'coefficient' => 'sometimes|numeric|min:1',
            'credits' => 'sometimes|integer|min:1',
            'ue_id' => 'sometimes|exists:ues,id',
            'enseignant_id' => 'nullable|exists:enseignants,id'
        ]);

        $matiere->update($validated);

        // Si le calcul de la moyenne change, on déclenche le job global
        if (isset($validated['coefficient']) || isset($validated['credits'])) {
            \App\Jobs\RecalculerTotaliteNotes::dispatch();
        }

        return response()->json($matiere, 200);
    }

    /**
     * Détails d'une matière spécifique
     */
    public function show($id)
    {
        $matiere = Matiere::with(['ue', 'enseignant'])->find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        return response()->json($matiere, 200);
    }

    /**
     * Supprimer une matière
     */
    public function destroy($id)
    {
        $matiere = Matiere::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $matiere->delete();
        return response()->json(['message' => 'Matière supprimée avec succès'], 200);
    }

    /**
     * ESPACE ENSEIGNANT : Récupère les matières assignées à l'utilisateur connecté
     * incluant les évaluations et les informations des étudiants.
     */
    public function mesMatieres()
    {
        $user = Auth::user();
        $enseignant = Enseignant::where('user_id', $user->id)->first();

        // Sécurité : Vérification du rôle enseignant (ID 3)
        if ($user->role_id != 2) {
            return response()->json(['message' => 'Accès non autorisé : Espace réservé aux enseignants.'], 403);
        }

        // Récupération filtrée
        $matieres = Matiere::where('enseignant_id', $enseignant->id)
            ->with([
                'ue', 
                'evaluations' => function($query) {
                    $query->select('id', 'etudiant_id', 'matiere_id', 'type', 'note', 'date_saisie')
                          ->with('etudiant:id,nom,prenom'); // Jointure pour avoir le nom de l'élève
                }
            ])
            ->get();

        return response()->json([
            'status' => 'success',
            'enseignant' => $user->name,
            'total_matieres' => $matieres->count(),
            'data' => $matieres
        ], 200);
    }
}