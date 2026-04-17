<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id', // OK : Lie l'utilisateur à un rôle
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relation avec le rôle (Indispensable pour le Middleware CheckRole)
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // Relation avec l'étudiant (Pour faire $user->etudiant)
    public function etudiant()
    {
        return $this->hasOne(Etudiant::class, 'user_id');
    }
}