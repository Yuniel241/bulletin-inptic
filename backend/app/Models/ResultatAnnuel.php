<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResultatAnnuel extends Model
{
    //
    protected $fillable = ['etudiant_id', 'annee', 'moyenne_annuelle', 'decision_jury', 'mention'];


    /**
     * Relation vers l'étudiant
     */
    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }
}
