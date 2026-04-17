<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Etudiant extends Model
{
    //
protected $fillable = [
    'nom', 'prenom', 'matricule', 'date_naissance', 
    'lieu_naissance', 'bac', 'provenance','user_id',
];

public function evaluations() { return $this->hasMany(Evaluation::class); }
public function absences() { return $this->hasMany(Absence::class); }
public function moyennesMatieres() { return $this->hasMany(MoyenneMatiere::class); }
public function moyennesUe() { return $this->hasMany(MoyenneUe::class); }
public function resultatsSemestre() { return $this->hasMany(ResultatSemestre::class); }

/**
     * Relation : Un étudiant est lié à un compte utilisateur.
     */
    public function user() {
    return $this->belongsTo(User::class, 'user_id');
}

// Dans app/Models/Etudiant.php

public function resultatsSemestres()
{
    // Remplace 'ResultatSemestre' par le nom exact de ton modèle de résultats
    return $this->hasMany(ResultatSemestre::class); 
}

public function resultatAnnuel()
{
    // Assure-toi que le nom de ton modèle est bien ResultatAnnuel
    return $this->hasOne(ResultatAnnuel::class); 
}
}
