<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semestre extends Model
{
    //
    protected $fillable = ['libelle', 'annee_universitaire'];

public function ues() {
    return $this->hasMany(Ue::class);
}
}
