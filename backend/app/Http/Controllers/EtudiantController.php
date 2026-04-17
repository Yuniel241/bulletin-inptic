<?php

namespace App\Http\Controllers;

use App\Models\Etudiant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class EtudiantController extends Controller
{
    /**
     * Liste tous les étudiants avec leur compte utilisateur (Utile pour l'Admin)
     */
    public function index()
    {
        // On utilise eager loading pour avoir les infos de compte et de rôle
        $etudiants = Etudiant::with('user.role')->get();
        return response()->json($etudiants, 200);
    }

    /**
     * Enregistrer un étudiant ET son compte utilisateur
     */
   public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nom' => 'required|string|max:100',
        'prenom' => 'required|string|max:100',
        'matricule' => 'required|string|unique:etudiants,matricule|max:50',
        'date_naissance' => 'required|date',
        'lieu_naissance' => 'required|string|max:150',
        'bac' => 'required|string|max:50',
        'provenance' => 'nullable|string|max:150',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    try {
        // Génération automatique de l'email : prenom.nom@inptic.ga
        // strtolower convertit en minuscules, str_replace retire les espaces
        $nomNettoye = str_replace(' ', '', strtolower($request->nom));
        $prenomNettoye = str_replace(' ', '', strtolower($request->prenom));
        $emailGenere = $prenomNettoye . '.' . $nomNettoye . '@inptic.ga';

        // Vérification si cet email généré n'existe pas déjà dans la table users
        if (\App\Models\User::where('email', $emailGenere)->exists()) {
            return response()->json(['message' => 'Un compte avec cet email généré existe déjà.'], 400);
        }

        $result = DB::transaction(function () use ($request, $emailGenere) {
            
            // 1. Créer le compte utilisateur
            // Le mot de passe est la concaténation du nom et du prénom
            $user = User::create([
                'name' => $request->prenom . ' ' . $request->nom,
                'email' => $emailGenere,
                'password' => Hash::make($request->nom . $request->prenom),
                'role_id' => 4, // ID correspondant à 'etudiant'
            ]);

            // 2. Créer l'étudiant lié au User
            $etudiant = Etudiant::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'matricule' => $request->matricule,
                'date_naissance' => $request->date_naissance,
                'lieu_naissance' => $request->lieu_naissance,
                'bac' => $request->bac,
                'provenance' => $request->provenance,
                'user_id' => $user->id,
            ]);

            return $etudiant;
        });

       return response()->json([
    'message' => 'Étudiant créé avec succès',
    'email_genere' => $emailGenere,
    'data' => $result->refresh()->load('user.role') // refresh() est la clé ici
], 201);

    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur lors de la création : ' . $e->getMessage()], 500);
    }
}

    /**
     * Afficher un étudiant spécifique avec ses notes et absences
     */
    public function show(string $id)
    {
        // On récupère l'étudiant avec ses relations pour le profil complet
        $etudiant = Etudiant::with(['user', 'absences'])->find($id);

        if (!$etudiant) {
            return response()->json(['message' => 'Étudiant non trouvé'], 404);
        }

        return response()->json($etudiant, 200);
    }
    /**
     * Mettre à jour les informations d'un étudiant
     */
    public function update(Request $request, string $id)
    {
        $etudiant = Etudiant::find($id);

        if (!$etudiant) {
            return response()->json(['message' => 'Étudiant non trouvé'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'matricule' => 'sometimes|string|max:50|unique:etudiants,matricule,' . $id,
            'date_naissance' => 'sometimes|date',
            'lieu_naissance' => 'sometimes|string|max:150',
            'bac' => 'sometimes|string|max:50',
            'provenance' => 'nullable|string|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $etudiant->update($request->all());

        return response()->json([
            'message' => 'Informations mises à jour',
            'data' => $etudiant
        ], 200);
    }

    /**
     * Supprimer un étudiant
     */
    public function destroy(string $id)
    {
        $etudiant = Etudiant::find($id);

        if (!$etudiant) {
            return response()->json(['message' => 'Étudiant non trouvé'], 404);
        }

        $etudiant->delete();

        return response()->json(['message' => 'Étudiant supprimé avec succès'], 200);
    }
}