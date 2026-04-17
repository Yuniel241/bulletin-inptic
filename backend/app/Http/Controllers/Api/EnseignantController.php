<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enseignant;
use App\Models\User;
use App\Models\Role;
use App\Models\Matiere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class EnseignantController extends Controller
{
    /**
     * Liste des enseignants avec leurs matières et infos de compte.
     */
    public function index()
    {
        $enseignants = Enseignant::with(['user', 'matieres'])->get();
        return response()->json($enseignants, 200);
    }

    /**
     * Création d'un enseignant, de son compte utilisateur et attribution de matière.
     */
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nom' => 'required|string|max:255',
        'prenom' => 'required|string|max:255',
        'numero' => 'required|string|unique:enseignants,numero',
        'matiere_id' => 'nullable|exists:matieres,id'
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    // --- LOGIQUE DE GÉNÉRATION AUTOMATIQUE ---
    $nomNettoye = str_replace(' ', '', strtolower($request->nom));
    $prenomNettoye = str_replace(' ', '', strtolower($request->prenom));
    $emailGenere = $prenomNettoye . '.' . $nomNettoye . '@inptic.ga';

    // Vérification de l'unicité de l'email généré
    if (\App\Models\User::where('email', $emailGenere)->exists()) {
        return response()->json(['message' => 'Un compte avec cet email généré existe déjà (doublon de nom/prénom).'], 400);
    }

    return DB::transaction(function () use ($request, $emailGenere) {
        // 1. Créer le compte utilisateur
        // Le mot de passe est la concaténation du nom et du prénom (ex: koffijean)
        $user = User::create([
            'name' => $request->prenom . ' ' . $request->nom,
            'email' => $emailGenere,
            'password' => Hash::make($request->nom . $request->prenom),
            'role_id' => 2, // ID correspondant au rôle 'enseignant'
        ]);

        // 2. Créer le profil Enseignant
        $enseignant = Enseignant::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'numero' => $request->numero,
            'user_id' => $user->id,
        ]);

        // 3. Attribuer la matière si spécifiée
        if ($request->filled('matiere_id')) {
            Matiere::where('id', $request->matiere_id)->update([
                'enseignant_id' => $user->id 
            ]);
        }

        return response()->json([
            'message' => 'Enseignant créé avec succès',
            'email_genere' => $emailGenere,
            'data' => $enseignant->load('user')
        ], 201);
    });
}

    /**
     * Détails d'un enseignant spécifique.
     */
    public function show($id)
    {
        $enseignant = Enseignant::with(['user', 'matieres'])->find($id);

        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        return response()->json($enseignant, 200);
    }

    /**
     * Mise à jour de l'enseignant.
     */
    public function update(Request $request, $id)
    {
        $enseignant = Enseignant::findOrFail($id);
        
        $validated = $request->validate([
            'nom' => 'sometimes|string',
            'prenom' => 'sometimes|string',
            'numero' => 'sometimes|string|unique:enseignants,numero,' . $id,
        ]);

        $enseignant->update($validated);

        // Optionnel : Mettre à jour le nom dans la table Users aussi
        if ($request->has('nom') || $request->has('prenom')) {
            $enseignant->user->update([
                'name' => ($request->nom ?? $enseignant->nom) . ' ' . ($request->prenom ?? $enseignant->prenom)
            ]);
        }

        return response()->json(['message' => 'Enseignant mis à jour', 'data' => $enseignant]);
    }

    /**
     * Suppression d'un enseignant et de son compte.
     */
    public function destroy($id)
    {
        $enseignant = Enseignant::find($id);

        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        // Le compte User sera supprimé par cascade si défini dans la migration
        $enseignant->delete();

        return response()->json(['message' => 'Enseignant supprimé avec succès']);
    }

    /**
 * Permet d'attribuer une matière à un enseignant spécifique.
 */
public function attribuerMatiere(Request $request)
{
    $validator = Validator::make($request->all(), [
        'enseignant_id' => 'required|exists:users,id', // On lie à l'ID de l'utilisateur (rôle enseignant)
        'matiere_id'    => 'required|exists:matieres,id'
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    // On met à jour la table matieres
    $matiere = Matiere::find($request->matiere_id);
    $matiere->update([
        'enseignant_id' => $request->enseignant_id
    ]);

    return response()->json([
        'message' => 'La matière "' . $matiere->libelle . '" a été attribuée avec succès.',
        'enseignant_id' => $request->enseignant_id
    ], 200);
}
}