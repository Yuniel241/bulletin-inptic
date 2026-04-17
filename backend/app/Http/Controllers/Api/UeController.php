<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ue;
use Illuminate\Http\Request;

class UeController extends Controller
{
    public function index() {
        return response()->json(Ue::with('matieres')->get()); // On récupère aussi la liste des matières associées
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'code' => 'required|string|unique:ues,code',
            'libelle' => 'required|string',
            'semestre_id' => 'required|exists:semestres,id',
        ]);

        $ue = Ue::create($validated);
        return response()->json($ue, 201);
    }

    public function show(Ue $ue) {
        return response()->json($ue->load('matieres'));
    }

    public function update(Request $request, Ue $ue) {
        $ue->update($request->validate([
            'libelle' => 'string',
            'semestre_id' => 'exists:semestres,id',
        ]));
        return response()->json($ue);
    }

    public function destroy(Ue $ue) {
        $ue->delete();
        return response()->json(['message' => 'UE supprimée']);
    }
}