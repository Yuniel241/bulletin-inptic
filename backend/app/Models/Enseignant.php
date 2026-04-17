<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignant extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'numero',
        'user_id'
    ];

    /**
     * Récupérer le compte utilisateur associé à cet enseignant
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Récupérer les matières enseignées par cet enseignant
     * (Assure-toi que la table matieres a une colonne enseignant_id)
     */
    public function matieres()
    {
        return $this->hasMany(Matiere::class, 'enseignant_id');
    }
}