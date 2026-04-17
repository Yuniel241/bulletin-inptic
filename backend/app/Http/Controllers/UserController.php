<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Etudiant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    /**
     * Afficher la liste des utilisateurs avec leurs rôles.
     * Accessible par : Admin
     */
    public function index()
    {
        return response()->json(User::with('role')->get());
    }

    /**
     * Créer un nouvel utilisateur (Étudiant, Enseignant ou Admin).
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user->load('role')
        ], 201);
    }

    /**
     * Afficher un utilisateur spécifique.
     */
    public function show(User $user)
    {
        return response()->json($user->load(['role', 'matieres']));
    }

    /**
     * Mettre à jour un utilisateur (ex: changer son rôle ou son email).
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role_id' => ['sometimes', 'exists:roles,id'],
        ]);

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->update($request->only(['name', 'email', 'role_id']));

        return response()->json([
            'message' => 'Utilisateur mis à jour',
            'user' => $user->load('role')
        ]);
    }

    /**
     * Supprimer un utilisateur.
     */
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }


    public function getCurrentUser(Request $request){
        $user = $request->user();
        
        // Récupérer l'étudiant associé à cet utilisateur
        $etudiant = Etudiant::where('user_id', $user->id)->first();
        
        if (!$etudiant) {
            return response()->json(['message' => 'Étudiant non trouvé'], 404);
        }
        
        return response()->json($etudiant);
    }

}