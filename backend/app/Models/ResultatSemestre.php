<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResultatSemestre extends Model
{
    protected $fillable = [
        'etudiant_id',
        'semestre_id',
        'moyenne_semestre',
        'credits_total',
        'valide',
    ];

    protected $casts = [
        'valide' => 'boolean',
        'moyenne_semestre' => 'float',
        'credits_total' => 'integer',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }

    public function semestre()
    {
        return $this->belongsTo(Semestre::class);
    }
}
