<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Semestre;
use Illuminate\Http\Request;

class SemestreController extends Controller
{
    public function index()
    {
        // On récupère tout pour vérifier en un coup d'œil
        return response()->json(Semestre::all());
    }

    public function store(Request $request)
    {
        // On adapte la validation aux champs réels : libelle et annee_universitaire
        $validated = $request->validate([
            'libelle' => 'required|string',
            'annee_universitaire' => 'required|string', // ex: 2025-2026
        ]);

        $semestre = Semestre::create($validated);

        return response()->json([
            'message' => 'Semestre créé avec succès !',
            'data' => $semestre
        ], 201);
    }

    public function show(Semestre $semestre)
    {
        return response()->json($semestre);
    }

    public function update(Request $request, Semestre $semestre)
    {
        $validated = $request->validate([
            'libelle' => 'string',
            'annee_universitaire' => 'string',
        ]);

        $semestre->update($validated);
        return response()->json($semestre);
    }

    public function destroy(Semestre $semestre)
    {
        $semestre->delete();
        return response()->json(['message' => 'Semestre supprimé']);
    }
}