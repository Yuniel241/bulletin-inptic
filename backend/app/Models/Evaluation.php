<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    //
protected $fillable = ['matiere_id', 'etudiant_id', 'type', 'note', 'date_saisie'];

public function etudiant() { return $this->belongsTo(Etudiant::class); }
public function matiere() { return $this->belongsTo(Matiere::class); }
}
