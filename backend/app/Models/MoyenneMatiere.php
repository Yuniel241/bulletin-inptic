<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoyenneMatiere extends Model
{
    //
    protected $fillable = ['etudiant_id', 'matiere_id', 'moyenne', 'rattrapage_utilise'];

    /**
     * Relation vers la matière
     */
    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }

    /**
     * Relation vers l'étudiant
     */
    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }
}
