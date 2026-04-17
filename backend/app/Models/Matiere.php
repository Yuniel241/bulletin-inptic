<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    //
protected $fillable = ['code', 'libelle', 'coefficient', 'credits', 'ue_id', 'enseignant_id'];

public function ue() { return $this->belongsTo(Ue::class)->with('semestre'); }
public function enseignant() { return $this->belongsTo(Enseignant::class); }
public function evaluations() { return $this->hasMany(Evaluation::class); }
}
