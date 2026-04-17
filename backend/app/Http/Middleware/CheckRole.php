<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        // On charge la relation 'role' pour être sûr d'avoir accès à la table roles
        $user->loadMissing('role');

        // On vérifie si l'utilisateur a un rôle et si la colonne 'nom' existe
        if (!$user->role || !isset($user->role->nom)) {
            return response()->json([
                'message' => "Accès refusé. Structure du rôle invalide ou rôle inexistant.",
                'votre_role' => "Inconnu"
            ], 403);
        }

        $roleName = $user->role->nom;

        // On compare le nom du rôle avec les rôles autorisés dans la route
        // On utilise strtolower pour éviter les soucis de majuscules/minuscules
        if (!in_array(strtolower($roleName), array_map('strtolower', $roles))) {
            return response()->json([
                'message' => "Accès refusé. Droits insuffisants.",
                'votre_role' => $roleName,
                'roles_autorises' => $roles
            ], 403);
        }

        return $next($request);
    }
}