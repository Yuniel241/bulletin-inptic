<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoyenneUe extends Model
{
    //
    protected $fillable = ['etudiant_id', 'ue_id', 'moyenne', 'credits_acquis', 'compense'];
    /**
     * Relation vers la matière
     */
    public function ue()
    {
        return $this->belongsTo(Ue::class);
    }

    /**
     * Relation vers l'étudiant
     */
    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }
}
