<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ue extends Model
{
    //
protected $fillable = ['code', 'libelle', 'semestre_id'];

public function semestre() { return $this->belongsTo(Semestre::class); }
public function matieres() { return $this->hasMany(Matiere::class); }
}
