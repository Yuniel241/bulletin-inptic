# 📚 DOCUMENTATION COMPLÈTE - API REST - GESTION DES BULLETINS

## Table des Matières
1. [Authentification & Sécurité](#authentification--sécurité)
2. [Gestion des Comptes Utilisateurs](#gestion-des-comptes-utilisateurs)
3. [Gestion des Étudiants](#gestion-des-étudiants)
4. [Gestion des Enseignants](#gestion-des-enseignants)
5. [Gestion des Semestres](#gestion-des-semestres)
6. [Gestion des Unités d'Enseignement (UE)](#gestion-des-unités-denseignement-ue)
7. [Gestion des Matières](#gestion-des-matières)
8. [Gestion des Notes & Évaluations](#gestion-des-notes--évaluations)
9. [Gestion des Absences](#gestion-des-absences)
10. [Bulletins & Résultats](#bulletins--résultats)
11. [Configuration & Jury](#configuration--jury)

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ

### 1. LOGIN - Connexion et obtention du Token
**Endpoint:** `POST /api/login`  
**Authentification:** Aucune (route publique)  
**Rôle requis:** Tous  
**Statut HTTP:** 200/401

**Corps de la requête:**
```json
{
    "email": "admin@inptic.ga",
    "password": "Admin2026"
}
```

**Réponse (200 OK):**
```json
{
    "access_token": "24|ZhT5vL9kqM2pQ8aB3rX7eY1wF4gJ6nO9sP",
    "token_type": "Bearer",
    "user": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@inptic.ga",
        "role": {
            "id": 1,
            "nom": "admin"
        }
    }
}
```

**Réponse (401 Unauthorized):**
```json
{
    "message": "Les identifiants fournis sont incorrects."
}
```

---

### 2. GET USER - Informations du Profil Connecté
**Endpoint:** `GET /api/user`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Tous (connecté)  
**Headers requis:**
```
Authorization: Bearer {votre_token}
```

**Réponse (200 OK):**
```json
{
    "id": 1,
    "name": "Admin User",
    "email": "admin@inptic.ga",
    "role": {
        "id": 1,
        "nom": "admin"
    }
}
```

---

### 3. LOGOUT - Déconnexion et destruction du Token
**Endpoint:** `POST /api/logout`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Tous (connecté)  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "message": "Déconnexion réussie."
}
```

---

## 👥 GESTION DES COMPTES UTILISATEURS

### 4. LIST USERS - Liste tous les utilisateurs
**Endpoint:** `GET /api/users`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "name": "Admin User",
        "email": "admin@inptic.ga",
        "role": {
            "id": 1,
            "nom": "admin"
        },
        "matieres": []
    },
    {
        "id": 2,
        "name": "Enseignant Nom",
        "email": "enseignant.nom@inptic.ga",
        "role": {
            "id": 2,
            "nom": "enseignant"
        },
        "matieres": [
            { "id": 1, "libelle": "Algorithmique et Python" }
        ]
    }
]
```

---

### 5. CREATE USER - Créer un nouvel utilisateur
**Endpoint:** `POST /api/users`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin  
**Status HTTP:** 201

**Corps de la requête:**
```json
{
    "name": "Jean Dupont",
    "email": "jean.dupont@inptic.ga",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!",
    "role_id": 2
}
```

**Réponse (201 Created):**
```json
{
    "message": "Utilisateur créé avec succès",
    "user": {
        "id": 5,
        "name": "Jean Dupont",
        "email": "jean.dupont@inptic.ga",
        "role": {
            "id": 2,
            "nom": "enseignant"
        }
    }
}
```

---

### 6. SHOW USER - Afficher les détails d'un utilisateur
**Endpoint:** `GET /api/users/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "id": 2,
    "name": "Enseignant Nom",
    "email": "enseignant.nom@inptic.ga",
    "role": {
        "id": 2,
        "nom": "enseignant"
    },
    "matieres": [
        {
            "id": 1,
            "code": "PROG101",
            "libelle": "Algorithmique et Python"
        }
    ]
}
```

---

### 7. UPDATE USER - Mettre à jour un utilisateur
**Endpoint:** `PUT /api/users/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin  
**Status HTTP:** 200

**Corps de la requête:**
```json
{
    "name": "Jean Dupont Modifié",
    "email": "jean.nouveau@inptic.ga",
    "role_id": 3
}
```

**Réponse (200 OK):**
```json
{
    "message": "Utilisateur mis à jour",
    "user": {
        "id": 5,
        "name": "Jean Dupont Modifié",
        "email": "jean.nouveau@inptic.ga",
        "role": {
            "id": 3,
            "nom": "secrétariat"
        }
    }
}
```

---

### 8. DELETE USER - Supprimer un utilisateur
**Endpoint:** `DELETE /api/users/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "message": "Utilisateur supprimé"
}
```

---

## 🎓 GESTION DES ÉTUDIANTS

### 9. LIST ETUDIANTS - Liste tous les étudiants
**Endpoint:** `GET /api/etudiants`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "nom": "OBAME",
        "prenom": "Jean-Pierre",
        "matricule": "INPTIC-2026-001",
        "date_naissance": "2005-03-12",
        "lieu_naissance": "Lambaréné",
        "bac": "Série C",
        "provenance": "Lycée Charles Mefane",
        "user_id": 4,
        "user": {
            "id": 4,
            "name": "Jean-Pierre OBAME",
            "email": "jean-pierre.obame@inptic.ga",
            "role": {
                "id": 4,
                "nom": "etudiant"
            }
        }
    }
]
```

---

### 10. CREATE ETUDIANT - Créer un étudiant (auto-génération du compte)
**Endpoint:** `POST /api/etudiants`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 201

**Corps de la requête:**
```json
{
    "nom": "OBAME",
    "prenom": "Jean-Pierre",
    "matricule": "INPTIC-2026-006",
    "date_naissance": "2005-03-12",
    "lieu_naissance": "Lambaréné",
    "bac": "Série C",
    "provenance": "Lycée Charles Mefane"
}
```

**Réponse (201 Created):**
```json
{
    "message": "Étudiant créé avec succès",
    "email_genere": "jean-pierre.obame@inptic.ga",
    "data": {
        "id": 1,
        "nom": "OBAME",
        "prenom": "Jean-Pierre",
        "matricule": "INPTIC-2026-006",
        "date_naissance": "2005-03-12",
        "lieu_naissance": "Lambaréné",
        "bac": "Série C",
        "provenance": "Lycée Charles Mefane",
        "user_id": 4,
        "user": {
            "id": 4,
            "name": "Jean-Pierre OBAME",
            "email": "jean-pierre.obame@inptic.ga",
            "role": {
                "id": 4,
                "nom": "etudiant"
            }
        }
    }
}
```

**Note:** 
- Email généré automatiquement : `prenom.nom@inptic.ga`
- Mot de passe généré automatiquement : `{nom}{prenom}` (ex: OBAMEJEAN-PIERRE)
- Le compte utilisateur est créé en même temps que l'étudiant

---

### 11. SHOW ETUDIANT - Afficher les détails d'un étudiant
**Endpoint:** `GET /api/etudiants/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "id": 1,
    "nom": "OBAME",
    "prenom": "Jean-Pierre",
    "matricule": "INPTIC-2026-006",
    "date_naissance": "2005-03-12",
    "lieu_naissance": "Lambaréné",
    "bac": "Série C",
    "provenance": "Lycée Charles Mefane",
    "user_id": 4,
    "user": {
        "id": 4,
        "name": "Jean-Pierre OBAME",
        "email": "jean-pierre.obame@inptic.ga",
        "role": {
            "id": 4,
            "nom": "etudiant"
        }
    },
    "absences": []
}
```

---

### 12. UPDATE ETUDIANT - Mettre à jour les informations d'un étudiant
**Endpoint:** `PUT /api/etudiants/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Corps de la requête:**
```json
{
    "nom": "OBAME-UPDATED",
    "prenom": "Jean-Pierre",
    "date_naissance": "2005-04-15"
}
```

**Réponse (200 OK):**
```json
{
    "message": "Informations mises à jour",
    "data": {
        "id": 1,
        "nom": "OBAME-UPDATED",
        "prenom": "Jean-Pierre",
        "matricule": "INPTIC-2026-006",
        "date_naissance": "2005-04-15",
        "lieu_naissance": "Lambaréné",
        "bac": "Série C",
        "provenance": "Lycée Charles Mefane"
    }
}
```

---

### 13. DELETE ETUDIANT - Supprimer un étudiant
**Endpoint:** `DELETE /api/etudiants/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "message": "Étudiant supprimé avec succès"
}
```

---

## 👨‍🏫 GESTION DES ENSEIGNANTS

### 14. LIST ENSEIGNANTS - Liste tous les enseignants
**Endpoint:** `GET /api/enseignants`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "nom": "DUPONT",
        "prenom": "Marc",
        "numero": "ENS001",
        "user_id": 2,
        "user": {
            "id": 2,
            "name": "Marc DUPONT",
            "email": "marc.dupont@inptic.ga",
            "role": {
                "id": 2,
                "nom": "enseignant"
            }
        },
        "matieres": [
            {
                "id": 1,
                "code": "PROG101",
                "libelle": "Algorithmique et Python",
                "coefficient": 3
            }
        ]
    }
]
```

---

### 15. CREATE ENSEIGNANT - Créer un enseignant
**Endpoint:** `POST /api/enseignants`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 201

**Corps de la requête:**
```json
{
    "nom": "DUPONT",
    "prenom": "Marc",
    "numero": "ENS001",
    "matiere_id": 1
}
```

**Réponse (201 Created):**
```json
{
    "message": "Enseignant créé avec succès",
    "email_genere": "marc.dupont@inptic.ga",
    "data": {
        "id": 1,
        "nom": "DUPONT",
        "prenom": "Marc",
        "numero": "ENS001",
        "user_id": 2,
        "user": {
            "id": 2,
            "name": "Marc DUPONT",
            "email": "marc.dupont@inptic.ga"
        }
    }
}
```

**Note:** 
- Email généré automatiquement : `prenom.nom@inptic.ga`
- Mot de passe généré automatiquement : `{nom}{prenom}`

---

### 16. SHOW ENSEIGNANT - Afficher les détails d'un enseignant
**Endpoint:** `GET /api/enseignants/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "id": 1,
    "nom": "DUPONT",
    "prenom": "Marc",
    "numero": "ENS001",
    "user_id": 2,
    "user": {
        "id": 2,
        "name": "Marc DUPONT",
        "email": "marc.dupont@inptic.ga"
    },
    "matieres": [
        {
            "id": 1,
            "code": "PROG101",
            "libelle": "Algorithmique et Python"
        }
    ]
}
```

---

### 17. UPDATE ENSEIGNANT - Mettre à jour un enseignant
**Endpoint:** `PUT /api/enseignants/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Corps de la requête:**
```json
{
    "nom": "DUPONT-UPDATED",
    "prenom": "Marc"
}
```

**Réponse (200 OK):**
```json
{
    "message": "Enseignant mis à jour",
    "data": {
        "id": 1,
        "nom": "DUPONT-UPDATED",
        "prenom": "Marc",
        "numero": "ENS001"
    }
}
```

---

### 18. DELETE ENSEIGNANT - Supprimer un enseignant
**Endpoint:** `DELETE /api/enseignants/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "message": "Enseignant supprimé avec succès"
}
```

---

### 19. ATTRIBUER MATIERE - Attribuer une matière à un enseignant
**Endpoint:** `POST /api/enseignants/attribuer-matiere`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Corps de la requête:**
```json
{
    "enseignant_id": 2,
    "matiere_id": 1
}
```

**Réponse (200 OK):**
```json
{
    "message": "Matière attribuée avec succès"
}
```

---

## 📚 GESTION DES SEMESTRES

### 20. LIST SEMESTRES - Liste tous les semestres
**Endpoint:** `GET /api/semestres`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 5,
        "libelle": "Semestre 5",
        "annee_universitaire": "2025-2026"
    },
    {
        "id": 6,
        "libelle": "Semestre 6",
        "annee_universitaire": "2025-2026"
    }
]
```

---

### 21. CREATE SEMESTRE - Créer un semestre
**Endpoint:** `POST /api/semestres`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 201

**Corps de la requête:**
```json
{
    "libelle": "Semestre 5",
    "annee_universitaire": "2025-2026"
}
```

**Réponse (201 Created):**
```json
{
    "message": "Semestre créé avec succès !",
    "data": {
        "id": 5,
        "libelle": "Semestre 5",
        "annee_universitaire": "2025-2026"
    }
}
```

---

### 22. SHOW SEMESTRE - Afficher un semestre
**Endpoint:** `GET /api/semestres/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "id": 5,
    "libelle": "Semestre 5",
    "annee_universitaire": "2025-2026"
}
```

---

### 23. UPDATE SEMESTRE - Mettre à jour un semestre
**Endpoint:** `PUT /api/semestres/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Corps de la requête:**
```json
{
    "libelle": "Semestre 5 - Modifié",
    "annee_universitaire": "2026-2027"
}
```

**Réponse (200 OK):**
```json
{
    "id": 5,
    "libelle": "Semestre 5 - Modifié",
    "annee_universitaire": "2026-2027"
}
```

---

### 24. DELETE SEMESTRE - Supprimer un semestre
**Endpoint:** `DELETE /api/semestres/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "message": "Semestre supprimé"
}
```

---

## 🎯 GESTION DES UNITÉS D'ENSEIGNEMENT (UE)

### 25. LIST UES - Liste toutes les UEs
**Endpoint:** `GET /api/ues`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "code": "UE5-1",
        "libelle": "Fondamentaux de Programmation",
        "semestre_id": 5,
        "matieres": [
            {
                "id": 1,
                "code": "PROG101",
                "libelle": "Algorithmique et Python",
                "coefficient": 3
            }
        ]
    }
]
```

---

### 26. CREATE UE - Créer une UE
**Endpoint:** `POST /api/ues`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 201

**Corps de la requête:**
```json
{
    "code": "UE5-3",
    "libelle": "Management et Communication",
    "semestre_id": 5
}
```

**Réponse (201 Created):**
```json
{
    "id": 3,
    "code": "UE5-3",
    "libelle": "Management et Communication",
    "semestre_id": 5
}
```

---

### 27. SHOW UE - Afficher une UE
**Endpoint:** `GET /api/ues/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "id": 1,
    "code": "UE5-1",
    "libelle": "Fondamentaux de Programmation",
    "semestre_id": 5,
    "matieres": [
        {
            "id": 1,
            "code": "PROG101",
            "libelle": "Algorithmique et Python",
            "coefficient": 3
        }
    ]
}
```

---

### 28. UPDATE UE - Mettre à jour une UE
**Endpoint:** `PUT /api/ues/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Corps de la requête:**
```json
{
    "libelle": "Développement Web et Mobile",
    "semestre_id": 5
}
```

**Réponse (200 OK):**
```json
{
    "id": 1,
    "code": "UE5-1",
    "libelle": "Développement Web et Mobile",
    "semestre_id": 5
}
```

---

### 29. DELETE UE - Supprimer une UE
**Endpoint:** `DELETE /api/ues/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "message": "UE supprimée"
}
```

---

## 📖 GESTION DES MATIÈRES

### 30. LIST MATIERES - Liste toutes les matières
**Endpoint:** `GET /api/matieres`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "code": "PROG101",
        "libelle": "Algorithmique et Python",
        "coefficient": 3,
        "credits": 4,
        "ue_id": 1,
        "enseignant_id": 2,
        "ue": {
            "id": 1,
            "code": "UE5-1",
            "libelle": "Fondamentaux de Programmation"
        },
        "enseignant": {
            "id": 2,
            "name": "Marc DUPONT"
        }
    }
]
```

---

### 31. CREATE MATIERE - Créer une matière
**Endpoint:** `POST /api/matieres`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 201

**Corps de la requête (Cas normal):**
```json
{
    "code": "PROG101",
    "libelle": "Algorithmique et Python",
    "coefficient": 3,
    "credits": 4,
    "ue_id": 1,
    "enseignant_id": 2
}
```

**Corps de la requête (Cas Soutenance - UE6-2):**
```json
{
    "code": "STAGE6",
    "libelle": "Projet de Fin d'Études",
    "coefficient": 5,
    "credits": 10,
    "ue_id": 4
}
```

**Réponse (201 Created):**
```json
{
    "id": 1,
    "code": "PROG101",
    "libelle": "Algorithmique et Python",
    "coefficient": 3,
    "credits": 4,
    "ue_id": 1,
    "enseignant_id": 2
}
```

---

### 32. SHOW MATIERE - Afficher une matière
**Endpoint:** `GET /api/matieres/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "id": 1,
    "code": "PROG101",
    "libelle": "Algorithmique et Python",
    "coefficient": 3,
    "credits": 4,
    "ue_id": 1,
    "enseignant_id": 2,
    "ue": {
        "id": 1,
        "code": "UE5-1",
        "libelle": "Fondamentaux de Programmation"
    },
    "enseignant": {
        "id": 2,
        "name": "Marc DUPONT"
    }
}
```

---

### 33. UPDATE MATIERE - Mettre à jour une matière
**Endpoint:** `PUT /api/matieres/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Corps de la requête:**
```json
{
    "libelle": "Développement Web et Mobile",
    "coefficient": 4,
    "credits": 5
}
```

**Réponse (200 OK):**
```json
{
    "id": 1,
    "code": "PROG101",
    "libelle": "Développement Web et Mobile",
    "coefficient": 4,
    "credits": 5,
    "ue_id": 1
}
```

---

### 34. DELETE MATIERE - Supprimer une matière
**Endpoint:** `DELETE /api/matieres/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "message": "Matière supprimée avec succès"
}
```

---

### 35. MES MATIERES - Récupérer les matières assignées (Enseignant)
**Endpoint:** `GET /api/enseignant/mes-matieres`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant  
**Status HTTP:** 200/403

**Réponse (200 OK):**
```json
{
    "status": "success",
    "enseignant": "Marc DUPONT",
    "total_matieres": 2,
    "data": [
        {
            "id": 1,
            "code": "PROG101",
            "libelle": "Algorithmique et Python",
            "coefficient": 3,
            "ue_id": 1,
            "ue": {
                "id": 1,
                "code": "UE5-1",
                "libelle": "Fondamentaux de Programmation"
            },
            "evaluations": [
                {
                    "id": 1,
                    "etudiant_id": 1,
                    "type": "CC",
                    "note": 14.50,
                    "date_saisie": "2026-04-12",
                    "etudiant": {
                        "id": 1,
                        "nom": "OBAME",
                        "prenom": "Jean-Pierre"
                    }
                }
            ]
        }
    ]
}
```

---

## 📝 GESTION DES NOTES & ÉVALUATIONS

### 36. LIST EVALUATIONS - Liste toutes les notes
**Endpoint:** `GET /api/evaluations`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "etudiant_id": 1,
        "matiere_id": 1,
        "type": "CC",
        "note": 14.50,
        "date_saisie": "2026-04-12",
        "etudiant": {
            "id": 1,
            "nom": "OBAME",
            "prenom": "Jean-Pierre"
        },
        "matiere": {
            "id": 1,
            "libelle": "Algorithmique et Python"
        }
    }
]
```

---

### 37. CREATE EVALUATIONS - Saisir une ou plusieurs notes
**Endpoint:** `POST /api/evaluations`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin  
**Status HTTP:** 200

**Corps de la requête (Format groupé - Recommandé):**
```json
{
    "etudiant_id": 4,
    "matiere_id": 1,
    "notes": [
        {
            "type": "CC",
            "note": 14.50,
            "date_saisie": "2026-04-12"
        },
        {
            "type": "Examen",
            "note": 7.50,
            "date_saisie": "2026-04-12"
        },
        {
            "type": "Rattrapage",
            "note": 19.50,
            "date_saisie": "2026-04-12"
        }
    ]
}
```

**Réponse (200 OK):**
```json
{
    "message": "Notes enregistrées avec succès",
    "data": [
        {
            "id": 1,
            "etudiant_id": 4,
            "matiere_id": 1,
            "type": "CC",
            "note": 14.50,
            "date_saisie": "2026-04-12"
        },
        {
            "id": 2,
            "etudiant_id": 4,
            "matiere_id": 1,
            "type": "Examen",
            "note": 7.50,
            "date_saisie": "2026-04-12"
        },
        {
            "id": 3,
            "etudiant_id": 4,
            "matiere_id": 1,
            "type": "Rattrapage",
            "note": 19.50,
            "date_saisie": "2026-04-12"
        }
    ]
}
```

**Note:** Les moyennes sont recalculées automatiquement en cascade :
- Matière → UE → Semestre → Annuel

---

### 38. UPDATE EVALUATIONS - Mettre à jour les notes (groupé)
**Endpoint:** `PUT /api/evaluations-update`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin  
**Status HTTP:** 200

**Corps de la requête:**
```json
{
    "etudiant_id": 4,
    "matiere_id": 1,
    "notes": [
        {
            "type": "CC",
            "note": 16.00,
            "date_saisie": "2026-04-12"
        },
        {
            "type": "Examen",
            "note": 8.50,
            "date_saisie": "2026-04-12"
        }
    ]
}
```

**Réponse (200 OK):**
```json
{
    "message": "Mise à jour réussie et moyennes recalculées",
    "etudiant_id": 4,
    "matiere_id": 1
}
```

---

### 39. DELETE EVALUATION - Supprimer une note
**Endpoint:** `DELETE /api/evaluations/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "message": "Note supprimée avec succès et moyennes mises à jour"
}
```

---

### 40. GET ETUDIANT NOTES - Récupérer les notes d'un étudiant
**Endpoint:** `GET /api/etudiants/{id}/notes`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin, Etudiant (soi-même)  
**Status HTTP:** 200/403/404

**Réponse (200 OK):**
```json
{
    "etudiant": {
        "nom": "OBAME",
        "prenom": "Jean-Pierre"
    },
    "details_par_matiere": [
        {
            "matiere": "Algorithmique et Python",
            "code": "PROG101",
            "coefficient": 3,
            "credits_potentiels": 4,
            "moyenne_finale": 13.75,
            "rattrapage_cloture": false,
            "notes_detaillees": [
                {
                    "id": 1,
                    "type": "CC",
                    "note": 14.50
                },
                {
                    "id": 2,
                    "type": "Examen",
                    "note": 13.00
                }
            ]
        }
    ]
}
```

**Note de sécurité:** 
- Les étudiants ne peuvent voir que leurs propres notes
- Les admin et enseignants peuvent voir les notes de tous

---

### 41. IMPORT NOTES - Importer les notes via fichier CSV
**Endpoint:** `POST /api/matieres/{id}/import`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin  
**Status HTTP:** 200

**Format du fichier CSV:**
```
nom_prenom,note_cc,note_examen
OBAME Jean-Pierre,14.50,7.50
DUPONT Marie,16.00,18.50
MARTIN Jean,12.00,14.00
```

**Requête (multipart/form-data):**
```
POST /api/matieres/1/import
Content-Type: multipart/form-data

file: [fichier.csv]
```

**Réponse (200 OK):**
```json
{
    "status": "success",
    "message": "3 étudiants traités avec succès.",
    "erreurs": []
}
```

---

### 42. STATS MATIERE - Récupérer les statistiques d'une matière
**Endpoint:** `GET /api/stats/matiere/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Enseignant, Admin  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "matiere_id": 1,
    "moyenne_classe": 14.25,
    "min": 8.50,
    "max": 18.75,
    "ecart_type": 2.45
}
```

---

## 🚫 GESTION DES ABSENCES

### 43. LIST ABSENCES - Liste toutes les absences
**Endpoint:** `GET /api/absences`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "etudiant_id": 1,
        "matiere_id": 2,
        "heures": 3,
        "etudiant": {
            "id": 1,
            "nom": "OBAME",
            "prenom": "Jean-Pierre"
        },
        "matiere": {
            "id": 2,
            "libelle": "Bases de Données"
        }
    }
]
```

---

### 44. CREATE ABSENCE - Enregistrer une absence
**Endpoint:** `POST /api/absences`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 201

**Corps de la requête:**
```json
{
    "etudiant_id": 4,
    "matiere_id": 2,
    "heures": 3
}
```

**Réponse (201 Created):**
```json
{
    "id": 1,
    "etudiant_id": 4,
    "matiere_id": 2,
    "heures": 3
}
```

**Note:** La pénalité d'absence est appliquée automatiquement :
- Formule: `Moyenne Finale = Moyenne Matière - (Heures × Pénalité)`
- Pénalité par défaut: 0.01 point/heure

---

### 45. SHOW ABSENCE - Afficher une absence
**Endpoint:** `GET /api/absences/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200/404

**Réponse (200 OK):**
```json
{
    "id": 1,
    "etudiant_id": 1,
    "matiere_id": 2,
    "heures": 3,
    "etudiant": {
        "id": 1,
        "nom": "OBAME",
        "prenom": "Jean-Pierre"
    },
    "matiere": {
        "id": 2,
        "libelle": "Bases de Données"
    }
}
```

---

### 46. UPDATE ABSENCE - Modifier le nombre d'heures d'absence
**Endpoint:** `PUT /api/absences/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Corps de la requête:**
```json
{
    "heures": 5
}
```

**Réponse (200 OK):**
```json
{
    "id": 1,
    "etudiant_id": 1,
    "matiere_id": 2,
    "heures": 5
}
```

---

### 47. DELETE ABSENCE - Supprimer une absence
**Endpoint:** `DELETE /api/absences/{id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "message": "Absence supprimée, moyenne recalculée."
}
```

---

### 48. GET ETUDIANT ABSENCES - Récupérer les absences d'un étudiant
**Endpoint:** `GET /api/etudiants/{id}/absences`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat, Etudiant (soi-même)  
**Status HTTP:** 200/403

**Réponse (200 OK):**
```json
[
    {
        "id": 1,
        "etudiant_id": 1,
        "matiere_id": 2,
        "heures": 3,
        "matiere": {
            "id": 2,
            "libelle": "Bases de Données"
        }
    }
]
```

---

## 📊 BULLETINS & RÉSULTATS

### 49. BULLETIN SEMESTRE - Récupérer le bulletin d'un semestre
**Endpoint:** `GET /api/bulletins/semestre/{etudiant_id}/{semestre_id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Etudiant (soi-même)  
**Status HTTP:** 200/403/404

**Réponse (200 OK):**
```json
{
    "statut": "success",
    "data": {
        "identite": {
            "nom": "OBAME",
            "prenom": "Jean-Pierre",
            "matricule": "INPTIC-2026-006"
        },
        "semestre_id": 5,
        "resultats_detailles": [
            {
                "id": 1,
                "etudiant_id": 1,
                "ue_id": 1,
                "moyenne": 14.25,
                "ue": {
                    "id": 1,
                    "code": "UE5-1",
                    "libelle": "Fondamentaux de Programmation",
                    "matieres": [
                        {
                            "id": 1,
                            "code": "PROG101",
                            "libelle": "Algorithmique et Python",
                            "coefficient": 3,
                            "credits": 4
                        }
                    ]
                }
            }
        ],
        "bilan": {
            "id": 1,
            "etudiant_id": 1,
            "semestre_id": 5,
            "moyenne_semestre": 14.25,
            "credits_total": 30,
            "valide": true
        }
    }
}
```

**Note de sécurité:**
- Les étudiants ne peuvent voir que leurs propres bulletins
- Les admin peuvent accéder aux bulletins de tous

---

### 50. RESULTAT ANNUEL - Récupérer les résultats annuels
**Endpoint:** `GET /api/bulletins/annuel/{etudiant_id}`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Etudiant (soi-même)  
**Status HTTP:** 200/403/404

**Réponse (200 OK):**
```json
{
    "statut": "success",
    "decision_finale": {
        "moyenne_generale": 14.50,
        "mention": "Bien",
        "decision": "Diplômé(e)",
        "annee_academique": 2026
    }
}
```

**Décisions possibles:**
- `Diplômé(e)` : 30 crédits validés dans chaque semestre
- `Reprise de soutenance` : Crédits acquis suffisant mais soutenance < 10
- `Redouble la Licence 3` : Crédits insuffisant

**Mentions possibles:**
- `Très Bien` : >= 16
- `Bien` : >= 14 et < 16
- `Assez Bien` : >= 12 et < 14
- `Passable` : >= 10 et < 12
- `Néant` : < 10

---

## ⚙️ CONFIGURATION & JURY

### 51. GET CONFIG - Récupérer la configuration du système
**Endpoint:** `GET /api/config/systeme`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "poidsCC": "0.40",
    "poidsExamen": "0.60",
    "penaliteParHeure": "0.01"
}
```

---

### 52. UPDATE CONFIG - Modifier la configuration du système
**Endpoint:** `POST /api/config/systeme`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Corps de la requête:**
```json
{
    "poids_cc": "0.35",
    "poids_examen": "0.65",
    "penalite_absence": "0.02"
}
```

**Réponse (200 OK):**
```json
{
    "message": "Configuration mise à jour. Le recalcul global de la promotion a été lancé en arrière-plan."
}
```

**Note:** 
- Les poids doivent être entre 0 et 1
- La somme poids_cc + poids_examen doit être 1
- Un job asynchrone recalcule l'ensemble des moyennes

---

### 53. RECAPITULATIF JURY - Tableau récapitulatif de la promotion
**Endpoint:** `GET /api/jury/recapitulatif-annuel`  
**Authentification:** Bearer Token (obligatoire)  
**Rôle requis:** Admin, Secrétariat  
**Status HTTP:** 200

**Réponse (200 OK):**
```json
{
    "annee_universitaire": "2025-2026",
    "promotion": "Licence Professionnelle ASUR",
    "data": [
        {
            "identite": {
                "nom": "OBAME",
                "prenom": "Jean-Pierre",
                "matricule": 1
            },
            "semestre_A": {
                "id": 5,
                "nom": "Semestre 5",
                "moyenne": 14.25,
                "credits": 30,
                "valide": true
            },
            "semestre_B": {
                "id": 6,
                "nom": "Semestre 6",
                "moyenne": 14.75,
                "credits": 30,
                "valide": true
            },
            "resultat_final": {
                "moyenne_annuelle": 14.50,
                "total_credits": 60,
                "decision": "Diplômé(e)",
                "mention": "Bien"
            }
        }
    ]
}
```

---

## 🔒 TABLEAU DE SÉCURITÉ - CONTRÔLE D'ACCÈS PAR RÔLE

| Endpoint | Admin | Secrétariat | Enseignant | Étudiant |
|----------|-------|-------------|-----------|----------|
| POST /api/login | ✅ | ✅ | ✅ | ✅ |
| GET /api/user | ✅ | ✅ | ✅ | ✅ |
| POST /api/logout | ✅ | ✅ | ✅ | ✅ |
| GET/POST /api/users | ✅ | ❌ | ❌ | ❌ |
| GET/POST /api/etudiants | ✅ | ✅ | ❌ | ❌ |
| GET/POST /api/enseignants | ✅ | ✅ | ❌ | ❌ |
| GET/POST /api/ues | ✅ | ✅ | ❌ | ❌ |
| GET/POST /api/matieres | ✅ | ✅ | ❌ | ❌ |
| GET /api/enseignant/mes-matieres | ✅ | ❌ | ✅ | ❌ |
| GET/POST /api/evaluations | ✅ | ❌ | ✅ | ❌ |
| GET /api/etudiants/{id}/notes | ✅ | ❌ | ✅ | ✅ (soi-même) |
| GET /api/etudiants/{id}/absences | ✅ | ✅ | ❌ | ✅ (soi-même) |
| GET/POST /api/absences | ✅ | ✅ | ❌ | ❌ |
| GET /api/bulletins/semestre/{id}/{sid} | ✅ | ❌ | ❌ | ✅ (soi-même) |
| GET /api/bulletins/annuel/{id} | ✅ | ❌ | ❌ | ✅ (soi-même) |
| GET/POST /api/config/systeme | ✅ | ✅ | ❌ | ❌ |
| GET /api/jury/recapitulatif-annuel | ✅ | ✅ | ❌ | ❌ |

---

## 📋 CODES D'ERREUR COURANTS

| Code | Message | Cause |
|------|---------|-------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Données invalides ou manquantes |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Utilisateur n'a pas les permissions |
| 404 | Not Found | Ressource non trouvée |
| 500 | Internal Server Error | Erreur serveur |

---

## 🧪 DONNÉES DE TEST

### Admin
```json
{
    "email": "admin@inptic.ga",
    "password": "Admin2026"
}
```

### Étudiant (auto-généré après création)
```json
Email: prenom.nom@inptic.ga
Mot de passe: {nom}{prenom}
Exemple: 
  Email: jean-pierre.obame@inptic.ga
  Password: OBAMEJean-Pierre
```

---

## 📞 CONTACT & SUPPORT

**Endpoint API Base:** `http://localhost:8000/api/`  
**Environnement de développement:** Laravel 11

---

## 🔄 FLUX DE CALCUL DES MOYENNES

```
1. Enregistrement d'une note
   ↓
2. Calcul de la moyenne de la matière
   - Logique: Rattrapage prioritaire OU (CC × poids_cc) + (Examen × poids_examen)
   - Pénalité d'absence appliquée
   ↓
3. Calcul de la moyenne de l'UE
   - Moyenne pondérée des matières
   ↓
4. Calcul du résultat du semestre
   - Moyenne pondérée des UEs
   - Compensation appliquée (UE < 10 mais Semestre >= 10)
   - Crédits acquis déterminés
   ↓
5. Calcul du résultat annuel
   - Moyenne annuelle = (Moyenne S5 + Moyenne S6) / 2
   - Décision jury générée
   - Mention attribuée
```

---

## ✅ RÉSUMÉ COMPLET

**Total d'endpoints documentés:** 53  
- Authentification: 3
- Gestion des comptes: 5
- Gestion des étudiants: 5
- Gestion des enseignants: 6
- Gestion des semestres: 5
- Gestion des UEs: 5
- Gestion des matières: 6
- Gestion des évaluations: 7
- Gestion des absences: 6
- Bulletins & Résultats: 2
- Configuration & Jury: 3

**Rôles disponibles:** Admin, Secrétariat, Enseignant, Étudiant

---

*Documentation complétée le 14 avril 2026*
*API Base URL: http://localhost:8000/api/*
