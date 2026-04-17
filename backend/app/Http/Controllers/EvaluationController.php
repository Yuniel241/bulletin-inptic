<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\ResultatSemestre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\IOFactory;

class EvaluationController extends Controller
{
    /**
     * Liste toutes les notes (utile pour l'administration)
     */
    public function index()
    {
        return response()->json(Evaluation::with(['etudiant', 'matiere'])->get(), 200);
    }

    /**
     * Saisie individuelle d'une note (5.2)
     */
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'etudiant_id' => 'required|exists:etudiants,id',
        'matiere_id'  => 'required|exists:matieres,id',
        'notes'       => 'required|array|min:1',
        'notes.*.type' => 'required|in:CC,Examen,Rattrapage',
        'notes.*.note' => 'required|numeric|min:0|max:20',
        // Le champ date_saisie devient obligatoire pour chaque note du tableau
        'notes.*.date_saisie' => 'required|date', 
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $etudiant_id = $request->etudiant_id;
    $matiere_id = $request->matiere_id;
    $results = [];

    foreach ($request->notes as $noteData) {
        $results[] = Evaluation::updateOrCreate(
            [
                'etudiant_id' => $etudiant_id,
                'matiere_id'  => $matiere_id,
                'type'        => $noteData['type'],
            ],
            [
                'note'        => $noteData['note'],
                // On utilise la date fournie dans le tableau pour chaque type de note
                'date_saisie' => $noteData['date_saisie'], 
            ]
        );
    }

    // Calcul des moyennes en cascade (Matière -> UE -> Semestre -> Annuel)
    $this->recalculerMoyenneMatiere($etudiant_id, $matiere_id);

    return response()->json([
        'message' => 'Notes enregistrées avec succès',
        'data' => $results
    ], 200);
}

    /**
     * Afficher les notes d'un étudiant spécifique (5.2)
     */
    
public function byEtudiant($etudiant_id)
{
    $user = Auth::user();
    if($user->role?->nom === 'etudiant') {
        $etudiant = \App\Models\Etudiant::where('user_id', $user->id)->first();
    }

    // SÉCURITÉ : Si l'utilisateur n'est pas admin ET qu'il demande un ID qui n'est pas le sien
    if (($user->role?->nom !== 'admin' && $user->role?->nom !== 'secretariat' && $user->role?->nom !== 'enseignant') && ($etudiant->id != $etudiant_id)) {
        return response()->json(['message' => 'Action non autorisée. Vous ne pouvez voir que vos propres résultats.'], 403);
    }
    // 1. Récupérer l'étudiant avec ses notes ET ses moyennes calculées
    $etudiant = \App\Models\Etudiant::with([
        'evaluations.matiere', 
        'moyennesMatieres.matiere'
    ])->find($etudiant_id);

    if (!$etudiant) {
        return response()->json(['message' => 'Étudiant non trouvé'], 404);
    }

    // 2. Structurer la réponse pour le Front-End
    return response()->json([
        'etudiant' => [
            'nom' => $etudiant->nom,
            'prenom' => $etudiant->prenom,
        ],
        'details_par_matiere' => $etudiant->moyennesMatieres->map(function($moyenne) use ($etudiant) {
            return [
                'matiere' => $moyenne->matiere->libelle,
                'code' => $moyenne->matiere->code,
                'coefficient' => $moyenne->matiere->coefficient,
                'credits_potentiels' => $moyenne->matiere->credits,
                'moyenne_finale' => $moyenne->moyenne,
                'rattrapage_cloture' => $moyenne->rattrapage_utilise,
                'notes_detaillees' => $etudiant->evaluations->where('matiere_id', $moyenne->matiere_id)
            ];
        })
    ], 200);
}

    /**
     * Mettre à jour une note
     */
public function update(Request $request, $id = null)
{
    // 1. Validation de base
    $validator = Validator::make($request->all(), [
        'etudiant_id' => 'required|exists:etudiants,id',
        'matiere_id'  => 'required|exists:matieres,id',
        'notes'       => 'required|array|min:1',
        'notes.*.type' => 'required|in:CC,Examen,Rattrapage',
        'notes.*.note' => 'required|numeric|min:0|max:20',
        // Rendre la date obligatoire ici aussi pour la cohérence des données
        'notes.*.date_saisie' => 'required|date', 
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $etudiant_id = $request->etudiant_id;
    $matiere_id = $request->matiere_id;

    // 2. Traitement des notes (mise à jour ou création si absente)
    foreach ($request->notes as $n) {
        Evaluation::updateOrCreate(
            [
                'etudiant_id' => $etudiant_id,
                'matiere_id'  => $matiere_id,
                'type'        => $n['type'],
            ],
            [
                'note'        => $n['note'],
                // On utilise la date fournie dans la requête
                'date_saisie' => $n['date_saisie'] 
            ]
        );
    }

    // 3. Un seul recalcul pour déclencher la cascade (UE -> Semestre -> Annuel)
    $this->recalculerMoyenneMatiere($etudiant_id, $matiere_id);

    return response()->json([
        'message' => 'Mise à jour réussie et moyennes recalculées',
        'etudiant_id' => $etudiant_id,
        'matiere_id'  => $matiere_id
    ], 200);
}

    /**
     * Supprimer une note
     */
public function destroy(string $id)
{
    // 1. Trouver la note
    $evaluation = Evaluation::find($id);

    if (!$evaluation) {
        return response()->json(['message' => 'Note non trouvée'], 404);
    }

    // 2. Sauvegarder les IDs avant la suppression pour le recalcul
    $etudiant_id = $evaluation->etudiant_id;
    $matiere_id = $evaluation->matiere_id;

    // 3. Supprimer la note
    $evaluation->delete();

    // 4. Recalculer la moyenne en cascade
    // Puisque la note n'existe plus en BDD, le calcul prendra 0 ou les notes restantes
    $this->recalculerMoyenneMatiere($etudiant_id, $matiere_id);

    return response()->json([
        'message' => 'Note supprimée avec succès et moyennes mises à jour'
    ], 200);
}


//Fonction pour le calcul auto
public function recalculerMoyenneMatiere($etudiant_id, $matiere_id){
    // 1. Récupération des paramètres dynamiques depuis la table 'configs'
    $configs = \DB::table('configs')->pluck('valeur', 'cle');

    $poidsCC = isset($configs['poids_cc']) ? (float)$configs['poids_cc'] : 0.40;
    $poidsExamen = isset($configs['poids_examen']) ? (float)$configs['poids_examen'] : 0.60;
    $penaliteParHeure = isset($configs['penalite_absence']) ? (float)$configs['penalite_absence'] : 0.01;

    // 2. Récupération des notes
    $notes = Evaluation::where('etudiant_id', $etudiant_id)
                ->where('matiere_id', $matiere_id)
                ->get();

    $cc = $notes->where('type', 'CC')->first()?->note;
    $examen = $notes->where('type', 'Examen')->first()?->note;
    $rattrapage = $notes->where('type', 'Rattrapage')->first()?->note;

    $moyenneBase = 0;
    $aUtiliseRattrapage = false;

    // 3. Logique de calcul (Rattrapage prioritaire 4.1)
    if ($rattrapage !== null) {
        $moyenneBase = $rattrapage;
        $aUtiliseRattrapage = true;
    } 
    elseif ($cc !== null && $examen !== null) {
        $moyenneBase = ($cc * $poidsCC) + ($examen * $poidsExamen);
    } 
    else {
        $moyenneBase = $cc ?? $examen ?? 0;
    }

    // 4. Pénalité d'absence (Point 4.9 & 5.4)
    $totalHeuresAbsence = \DB::table('absences')
        ->where('etudiant_id', $etudiant_id)
        ->where('matiere_id', $matiere_id)
        ->sum('heures');

    $moyenneFinale = max(0, $moyenneBase - ($totalHeuresAbsence * $penaliteParHeure));

    // 5. Enregistrement
    \App\Models\MoyenneMatiere::updateOrCreate(
        ['etudiant_id' => $etudiant_id, 'matiere_id' => $matiere_id],
        ['moyenne' => round($moyenneFinale, 2), 'rattrapage_utilise' => $aUtiliseRattrapage]
    );

    // Cascade vers l'UE
    $matiere = \App\Models\Matiere::find($matiere_id);
    if ($matiere) {
        $this->recalculerMoyenneUE($etudiant_id, $matiere->ue_id);
    }
}

/**
 * RECALCUL DE L'UE (Point 4.2)
 */
private function recalculerMoyenneUE($etudiant_id, $ue_id)
{
    // 1. Récupérer toutes les matières de cette UE avec leurs moyennes actuelles
    $ue = \App\Models\UE::with('matieres')->find($ue_id);
    $matieresIds = $ue->matieres->pluck('id');

    $moyennesMatieres = \App\Models\MoyenneMatiere::where('etudiant_id', $etudiant_id)
                        ->whereIn('matiere_id', $matieresIds)
                        ->get();

    $sommeNotesCoeff = 0;
    $sommeCoeffs = 0;

    foreach ($ue->matieres as $matiere) {
        $moyenneMatiere = $moyennesMatieres->where('matiere_id', $matiere->id)->first()?->moyenne ?? 0;
        $sommeNotesCoeff += ($moyenneMatiere * $matiere->coefficient);
        $sommeCoeffs += $matiere->coefficient;
    }

    $moyenneUE = $sommeCoeffs > 0 ? ($sommeNotesCoeff / $sommeCoeffs) : 0;

    // 2. Mise à jour de MoyenneUE (Note: le champ 'compensé' et 'crédits_acquis' seront mis à jour par le semestre)
    $moyenneUEObj = \App\Models\MoyenneUE::updateOrCreate(
        ['etudiant_id' => $etudiant_id, 'ue_id' => $ue_id],
        ['moyenne' => $moyenneUE]
    );

    // 3. On continue la cascade vers le semestre
    $this->recalculerResultatSemestre($etudiant_id, $ue->semestre_id);
}

/**
 * RECALCUL DU SEMESTRE & COMPENSATION (Points 4.3, 4.5, 4.6)
 */
private function recalculerResultatSemestre($etudiant_id, $semestre_id)
{
    // 1. Récupérer les UEs avec leurs matières (pour avoir les coefficients)
    $ues = \App\Models\UE::with('matieres')->where('semestre_id', $semestre_id)->get();
    $uesIds = $ues->pluck('id');

    $moyennesUEs = \App\Models\MoyenneUE::where('etudiant_id', $etudiant_id)
                    ->whereIn('ue_id', $uesIds)
                    ->get();

    $totalPointsSemestre = 0;
    $totalCoeffsSemestre = 0;
    $totalCreditsSemestre = 0;

    // Calculer le poids total du semestre
    foreach ($ues as $ue) {
        $moyUE = $moyennesUEs->where('ue_id', $ue->id)->first();
        $moyenneNote = $moyUE?->moyenne ?? 0;
        
        // Le coefficient de l'UE est la somme des coefficients de ses matières
        $poidsUE = $ue->matieres->sum('coefficient'); 
        
        $totalPointsSemestre += ($moyenneNote * $poidsUE);
        $totalCoeffsSemestre += $poidsUE;
    }

    $moyenneSemestre = $totalCoeffsSemestre > 0 ? ($totalPointsSemestre / $totalCoeffsSemestre) : 0;

    // 2. Application de la COMPENSATION avec la nouvelle moyenne pondérée
    foreach ($ues as $ue) {
        $moyUE = \App\Models\MoyenneUE::where('etudiant_id', $etudiant_id)
                                      ->where('ue_id', $ue->id)
                                      ->first();
        $moyenneNote = $moyUE?->moyenne ?? 0;

        $estAcquise = ($moyenneNote >= 10) || ($moyenneNote < 10 && $moyenneSemestre >= 10);
        $estCompensee = ($moyenneNote < 10 && $moyenneSemestre >= 10);

        $creditsObtenus = $estAcquise ? $ue->matieres->sum('credits') : 0;
        $totalCreditsSemestre += $creditsObtenus;

        if ($moyUE) {
            $moyUE->update([
                'credits_acquis' => $creditsObtenus,
                'compense' => $estCompensee
            ]);
        }
    }

    // 3. Enregistrement final du semestre
    ResultatSemestre::updateOrCreate(
        ['etudiant_id' => $etudiant_id, 'semestre_id' => $semestre_id],
        [
            'moyenne_semestre' => $moyenneSemestre,
            'credits_total' => $totalCreditsSemestre,
            'valide' => ($totalCreditsSemestre >= 30)
        ]
    );

    $this->recalculerResultatAnnuel($etudiant_id);
}
private function recalculerResultatAnnuel($etudiant_id)
{
    // 1. Récupérer les résultats des semestres en joignant la table 'semestres' pour filtrer par libellé
    $resultatsSemestres = ResultatSemestre::join('semestres', 'resultat_semestres.semestre_id', '=', 'semestres.id')
        ->where('etudiant_id', $etudiant_id)
        ->select('resultat_semestres.*', 'semestres.libelle as nom_semestre') // On récupère le nom du semestre 
        ->get();
    
    // Recherche par libellé au lieu de l'ID fixe 5 ou 6
    $moyenneS5 = $resultatsSemestres->where('nom_semestre', 'Semestre 5')->first()?->moyenne_semestre ?? 0;
    $moyenneS6 = $resultatsSemestres->where('nom_semestre', 'Semestre 6')->first()?->moyenne_semestre ?? 0;
    
    // Formule : (Moyenne S5 + Moyenne S6) / 2
    $moyenneAnnuelle = ($moyenneS5 + $moyenneS6) / 2;

    // 2. Vérification des conditions de diplomation
    $creditsS5 = $resultatsSemestres->where('nom_semestre', 'Semestre 5')->first()?->credits_total ?? 0;
    $creditsS6 = $resultatsSemestres->where('nom_semestre', 'Semestre 6')->first()?->credits_total ?? 0;
    $totalCreditsAnnuel = $creditsS5 + $creditsS6;

    // Vérifier spécifiquement l'UE6-2 (Soutenance) [cite: 90, 93]
    $ueSoutenance = \App\Models\UE::where('code', 'UE6-2')->first();
    $moyenneSoutenance = \App\Models\MoyenneUE::where('etudiant_id', $etudiant_id)
                        ->where('ue_id', $ueSoutenance?->id)
                        ->first();
    
    $decision = 'Redouble la Licence 3';
    
    // Si l'étudiant a validé 30 crédits dans chaque semestre
    if ($creditsS5 >= 30 && $creditsS6 >= 30) {
        $decision = 'Diplômé(e)';
    } 
    // Règle de reprise si seule la soutenance manque 
    elseif ($totalCreditsAnnuel >= (60 - ($ueSoutenance?->matieres->sum('credits') ?? 0)) && ($moyenneSoutenance?->moyenne < 10)) {
        $decision = 'Reprise de soutenance';
    }

    // 3. Attribution de la mention
    $mention = 'Néant';
    if ($moyenneAnnuelle >= 10) {
        if ($moyenneAnnuelle >= 16) $mention = 'Très Bien';
        elseif ($moyenneAnnuelle >= 14) $mention = 'Bien';
        elseif ($moyenneAnnuelle >= 12) $mention = 'Assez Bien';
        else $mention = 'Passable';
    }

    // 4. Enregistrement final avec l'année en cours
    \App\Models\ResultatAnnuel::updateOrCreate(
        ['etudiant_id' => $etudiant_id, 'annee' => date('Y')],
        [
            'moyenne_annuelle' => $moyenneAnnuelle,
            'decision_jury' => $decision,
            'mention' => $mention
        ]
    );
}

public function getStatsGlobalesSemestre($semestre_id)
{
    // 1. Stats de toutes les matières du semestre
    // On rejoint la table 'matieres' et 'ues' pour filtrer par 'semestre_id'
    $statsMatieres = \App\Models\MoyenneMatiere::join('matieres', 'moyenne_matieres.matiere_id', '=', 'matieres.id')
        ->join('ues', 'matieres.ue_id', '=', 'ues.id')
        ->where('ues.semestre_id', $semestre_id)
        ->selectRaw('
            moyenne_matieres.matiere_id, 
            AVG(moyenne_matieres.moyenne) as avg, 
            MIN(moyenne_matieres.moyenne) as min, 
            MAX(moyenne_matieres.moyenne) as max
        ')
        ->groupBy('moyenne_matieres.matiere_id')
        ->get()
        ->keyBy('matiere_id');

    // 2. Stats de toutes les UE du semestre
    $statsUE = \App\Models\MoyenneUE::join('ues', 'moyenne_ues.ue_id', '=', 'ues.id')
        ->where('ues.semestre_id', $semestre_id)
        ->selectRaw('
            moyenne_ues.ue_id, 
            AVG(moyenne_ues.moyenne) as avg, 
            MIN(moyenne_ues.moyenne) as min, 
            MAX(moyenne_ues.moyenne) as max
        ')
        ->groupBy('moyenne_ues.ue_id')
        ->get()
        ->keyBy('ue_id');

    // 3. Stats globale du semestre (déjà lié au semestre directement)
    $statsSemestre = \App\Models\ResultatSemestre::where('semestre_id', $semestre_id)
        ->selectRaw('AVG(moyenne_semestre) as avg, MIN(moyenne_semestre) as min, MAX(moyenne_semestre) as max')
        ->first();

    return response()->json([
        'status' => 'success',
        'semestre_id' => $semestre_id,
        'stats' => [
            'matieres' => $statsMatieres,
            'ues'      => $statsUE,
            'general'  => $statsSemestre
        ]
    ], 200);
}
/**
 * Récupère les paramètres actuels du système
 */
public function getConfig(){
    // On peut stocker ça dans une table 'configs' simple (clé/valeur)
    $config = \DB::table('configs')->pluck('valeur', 'cle');

    return response()->json([
        'poidsCC' => $config['poids_cc'] ?? 0.40,
        'poidsExamen' => $config['poids_examen'] ?? 0.60,
        'penaliteParHeure' => $config['penalite_absence'] ?? 0.01,
    ]);
}

/**
 * Met à jour les paramètres depuis le Front
 */
public function updateConfig(Request $request){
    $data = $request->validate([
        'poids_cc' => 'required|numeric|between:0,1',
        'poids_examen' => 'required|numeric|between:0,1',
        'penalite_absence' => 'required|numeric',
    ]);

    foreach ($data as $cle => $valeur) {
        \DB::table('configs')->updateOrInsert(['cle' => $cle], ['valeur' => $valeur]);
    }

    // DÉCLENCHEMENT DU JOB (Point 5.3)
    // On lance le recalcul global en arrière-plan
    \App\Jobs\RecalculerTotaliteNotes::dispatch();

    return response()->json([
        'message' => 'Configuration mise à jour. Le recalcul global de la promotion a été lancé en arrière-plan.'
    ]);
}

/**
 * Génère le tableau récapitulatif de la promotion (Point 5.6)
 */
public function getRecapitulatifJury()
{
    // 1. On cherche dynamiquement les IDs des semestres par leurs noms
    $idS5 = \App\Models\Semestre::where('libelle', 'LIKE', '%Semestre 5%')->value('id');
    $idS6 = \App\Models\Semestre::where('libelle', 'LIKE', '%Semestre 6%')->value('id');

    // 2. On charge les étudiants avec leurs résultats
    $promotion = \App\Models\Etudiant::with([
        'resultatsSemestres.semestre', 
        'resultatAnnuel'
    ])->get();

    $recapitulatif = $promotion->map(function ($etudiant) use ($idS5, $idS6) {
        // 3. On utilise les IDs récupérés dynamiquement
        $resS5 = $idS5 ? $etudiant->resultatsSemestres->where('semestre_id', $idS5)->first() : null;
        $resS6 = $idS6 ? $etudiant->resultatsSemestres->where('semestre_id', $idS6)->first() : null;
        
        $annuel = $etudiant->resultatAnnuel;

        return [
            'identite' => [
                'nom' => $etudiant->nom,
                'prenom' => $etudiant->prenom,
                'matricule' => $etudiant->id,
            ],
            'semestre_A' => [
    'id' => $idS5,
    // On cherche le nom dans l'objet relationnel, sinon on utilise une valeur par défaut propre
    'nom' => ($resS5 && $resS5->semestre) ? $resS5->semestre->libelle : \App\Models\Semestre::find($idS5)?->libelle ?? 'Semestre 5',
    'moyenne' => $resS5 ? round($resS5->moyenne_semestre, 2) : 0,
    'credits' => $resS5 ? $resS5->credits_total : 0,
    'valide' => $resS5 ? (bool)$resS5->valide : false,
],
'semestre_B' => [
    'id' => $idS6,
    'nom' => ($resS6 && $resS6->semestre) ? $resS6->semestre->libelle : \App\Models\Semestre::find($idS6)?->libelle ?? 'Semestre 6',
    'moyenne' => $resS6 ? round($resS6->moyenne_semestre, 2) : 0,
    'credits' => $resS6 ? $resS6->credits_total : 0,
    'valide' => $resS6 ? (bool)$resS6->valide : false,
],
            'resultat_final' => [
                'moyenne_annuelle' => $annuel ? round($annuel->moyenne_annuelle, 2) : 0,
                'total_credits' => ($resS5 ? $resS5->credits_total : 0) + ($resS6 ? $resS6->credits_total : 0),
                'decision' => $annuel ? $annuel->decision_jury : 'En attente',
                'mention' => $annuel ? $annuel->mention : 'Néant',
            ]
        ];
    });

    return response()->json([
        'annee_universitaire' => '2025-2026', 
        'promotion' => 'Licence Professionnelle ASUR',
        'data' => $recapitulatif
    ], 200);
}

/**
 * Importation de masse des notes via un fichier Excel (Format: nom_prenom,note_cc,note_examen)
 * @param Request $request
 * @param int $matiere_id
 */
public function importNotes(Request $request, $matiere_id)
{
    // 1. Validation : accepte désormais les formats Excel
    $request->validate([
        'file' => 'required|mimes:csv,txt,xls,xlsx|max:2048'
    ]);

    try {
        $file = $request->file('file');
        
        // 2. Chargement automatique du fichier (Excel ou CSV)
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(); // Convertit la feuille en tableau PHP

        // Retirer l'en-tête
        array_shift($rows);

        $importCount = 0;
        $errors = [];

        // 3. Parcours des données
        foreach ($rows as $index => $row) {
            // On ignore les lignes vides
            if (empty($row[0]) && empty($row[1])) continue;

            $matricule  = trim($row[0]);
            $fullName   = trim($row[1]);
            // PhpSpreadsheet gère déjà les types numériques, mais on sécurise
            $noteCC     = (isset($row[2]) && $row[2] !== '') ? floatval($row[2]) : null;
            $noteExamen = (isset($row[3]) && $row[3] !== '') ? floatval($row[3]) : null;

            // Recherche de l'étudiant
            $etudiant = \App\Models\Etudiant::find($matricule);

            if (!$etudiant && !empty($fullName)) {
                $parts = explode(' ', $fullName, 2);
                $nom = $parts[0];
                $prenom = $parts[1] ?? '';
                $etudiant = \App\Models\Etudiant::where('nom', $nom)->where('prenom', $prenom)->first();
            }

            if ($etudiant) {
                // Validation des bornes 0-20
                if (($noteCC !== null && ($noteCC < 0 || $noteCC > 20)) || 
                    ($noteExamen !== null && ($noteExamen < 0 || $noteExamen > 20))) {
                    $errors[] = "Ligne " . ($index + 2) . " : Notes hors limites pour $fullName";
                    continue;
                }

                // Note CC
                if ($noteCC !== null) {
                    \App\Models\Evaluation::updateOrCreate(
                        ['etudiant_id' => $etudiant->id, 'matiere_id' => $matiere_id, 'type' => 'CC'],
                        ['note' => $noteCC, 'date_saisie' => now()]
                    );
                }

                // Note Examen
                if ($noteExamen !== null) {
                    \App\Models\Evaluation::updateOrCreate(
                        ['etudiant_id' => $etudiant->id, 'matiere_id' => $matiere_id, 'type' => 'Examen'],
                        ['note' => $noteExamen, 'date_saisie' => now()]
                    );
                }

                // Recalcul en cascade
                $this->recalculerMoyenneMatiere($etudiant->id, $matiere_id);
                $importCount++;
            } else {
                $errors[] = "Ligne " . ($index + 2) . " : Étudiant introuvable ($matricule - $fullName)";
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "$importCount étudiants importés avec succès.",
            'erreurs' => $errors
        ], 200);

    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur lors de la lecture du fichier : ' . $e->getMessage()], 500);
    }
}
//Pour le bulletin du semestre 
public function getBulletinSemestre(Request $request, $etudiant_id, $semestre_id)
{
    $user = Auth::user();

    if($user->role?->nom === 'etudiant') {
        $etudiant = \App\Models\Etudiant::where('user_id', $user->id)->first();
    }

    // SÉCURITÉ : Admin (1) et Secrétariat (3) ou l'étudiant lui-même (ID match)
    if (!in_array($user->role_id, [1, 3]) && ($etudiant->id != $etudiant_id)) {
        return response()->json(['message' => 'Action non autorisée.'], 403);
    }

    // 1. Récupération des données de base de l'étudiant
    $etudiant = \App\Models\Etudiant::findOrFail($etudiant_id);
    
    // 2. Récupération du résultat du semestre pour cet étudiant
    $resultat = \App\Models\ResultatSemestre::with('semestre')
        ->where('etudiant_id', $etudiant_id)
        ->where('semestre_id', $semestre_id)
        ->first();

    if (!$resultat) {
        return response()->json(['message' => 'Aucun résultat trouvé.'], 404);
    }

    // --- LOGIQUE DU CALCUL DU RANG ---
    // On compte combien d'étudiants ont une moyenne strictement supérieure à la sienne
    $rang = \App\Models\ResultatSemestre::where('semestre_id', $semestre_id)
        ->where('moyenne_semestre', '>', $resultat->moyenne_semestre)
        ->count() + 1;

    // Nombre total d'étudiants ayant composé dans ce semestre (pour le "sur X")
    $totalEtudiants = \App\Models\ResultatSemestre::where('semestre_id', $semestre_id)->count();

    // --- LOGIQUE DE LA MENTION ---
    $moyenne = $resultat->moyenne_semestre;
    $mention = $this->definirMention($moyenne);

    // 3. Récupération des moyennes d'UE détaillées
    $moyennesUE = \App\Models\MoyenneUE::with(['ue.matieres'])
        ->where('etudiant_id', $etudiant_id)
        ->whereHas('ue', function($q) use ($semestre_id) {
            $q->where('semestre_id', $semestre_id);
        })
        ->get();

    return response()->json([
        'statut' => 'success',
        'data' => [
            'identite' => [
                'nom' => $etudiant->nom,
                'prenom' => $etudiant->prenom,
                'matricule' => $etudiant->id,
                'date_naissance' => $etudiant->date_naissance,
                'lieu_naissance' => $etudiant->lieu_naissance,
            ],
            'semestre' => [
                'id' => $semestre_id,
                'nom' => $resultat->semestre?->nom ?? "Semestre " . $semestre_id,
            ],
            'resultats_detailles' => $moyennesUE,
            'bilan' => [
                'moyenne' => round($moyenne, 2),
                'rang' => $rang,
                'effectif' => $totalEtudiants,
                'credits_obtenus' => $resultat->credits_total,
                'valide' => $resultat->valide,
                'mention' => $mention
            ]
        ]
    ], 200);
}

/**
 * Fonction helper pour la mention
 */
private function definirMention($moyenne) {
    if ($moyenne >= 16) return 'Très Bien';
    if ($moyenne >= 14) return 'Bien';
    if ($moyenne >= 12) return 'Assez Bien';
    if ($moyenne >= 10) return 'Passable';
    return 'Insuffisant';
}
//Pour que l'étudiant puisse voir son resultat annuel
public function getResultatAnnuel($etudiant_id)
{
    $user = Auth::user();

    if($user->role?->nom === 'etudiant') {
        $etudiant = \App\Models\Etudiant::where('user_id', $user->id)->first();
    }

    // SÉCURITÉ : Si l'utilisateur n'est pas admin ET qu'il demande un ID qui n'est pas le sien
    if ($user->role->nom !== 'admin' && $user->role->nom !== 'secretariat' && $etudiant->id != $etudiant_id) {
        return response()->json(['message' => 'Action non autorisée. Vous ne pouvez voir que vos propres résultats.'], 403);
    }
    $resultat = \App\Models\ResultatAnnuel::where('etudiant_id', $etudiant_id)
        ->where('annee', date('Y'))
        ->first();

    if (!$resultat) {
        return response()->json(['message' => 'Résultats non encore calculés par le jury'], 404);
    }

    return response()->json([
        'statut' => 'success',
        'decision_finale' => [
            'moyenne_generale' => $resultat->moyenne_annuelle,
            'mention' => $resultat->mention,
            'decision' => $resultat->decision_jury, 
            'annee_academique' => $resultat->annee
        ]
    ], 200);
}



}
