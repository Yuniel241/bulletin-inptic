# 📝 Changelog - CRUD Semestres

**Date**: 15 Avril 2026  
**Modification**: Addition du module CRUD Semestres sur MatieresPage  
**Status**: ✅ Production Ready

---

## 📌 Vue d'ensemble

La page **Matières & UE** inclut maintenant un **onglet Semestres** permettant la gestion complète du référentiel académique depuis une seule page.

### Fonctionnalités Ajoutées
- ✅ Créer un semestre (libellé + année universitaire)
- ✅ Modifier un semestre
- ✅ Supprimer un semestre (avec confirmation)
- ✅ Rechercher/filtrer par libellé ou année
- ✅ Vue d'ensemble : UEs et matières associées

---

## 🛠️ Détail Technique

### Fichier Modifié
- **[src/pages/MatieresPage.jsx](src/pages/MatieresPage.jsx)** (+90 lignes)

### Composants Ajoutés

#### 1. **SemestreModal Component**
```jsx
<SemestreModal 
  semestre={semestre}  // null = création, objet = modification
  onClose={handleClose}
  onSaved={handleRefresh}
/>
```

**Champs du formulaire**:
- `libelle`: Texte (ex: "Semestre 1", "S2")
- `annee_universitaire`: Texte (ex: "2024-2025")

#### 2. **Onglet Semestres**
```jsx
{tab === 'semestres' && (
  <div className="card">
    <table className="data-table">
      <tr>
        <th>Libellé</th>
        <th>Année Universitaire</th>
        <th>UEs</th>
        <th>Matières</th>
        <th>Actions</th>
      </tr>
    </table>
  </div>
)}
```

**Colonnes**:
- Libellé du semestre
- Année universitaire
- Nombre d'UEs associées
- Nombre de matières + crédits totaux
- Boutons modifier/supprimer

#### 3. **Fonction de Suppression**
```javascript
const delS = async id => {
  try { 
    await semestresAPI.delete(id);
    toast.success('Semestre supprimé');
    refetchS();
  } catch { 
    toast.error('Erreur');
  }
};
```

---

## 🎨 Interface

### Nouveaux Onglets
```
📖 Matières | 📚 Unités d'Enseignement | 📅 Semestres
```

### Bouton d'Action
- Onglet **Matières** → "+ Ajouter une matière"
- Onglet **UE** → "+ Ajouter une UE"
- Onglet **Semestres** → "+ Ajouter un semestre" ⭐ NEW

### Table des Semestres
Affiche:
- Nom du semestre (ex: "Semestre 1")
- Année académique (ex: "2024-2025")
- Compteur UEs : "3 UEs"
- Compteur Matières + crédits : "12 matières (45 cr.)"
- Actions: ✏️ Modifier, 🗑️ Supprimer

---

## 📋 Flux d'Utilisation

### Créer un Semestre
1. Cliquez sur l'onglet 📅 **Semestres**
2. Cliquez "+ Ajouter un semestre"
3. Remplissez les champs:
   - **Libellé**: "Semestre 1"
   - **Année Universitaire**: "2024-2025"
4. Cliquez "Enregistrer"
5. ✅ Toast: "Semestre créé"

### Modifier un Semestre
1. Onglet 📅 **Semestres**
2. Cliquez ✏️ sur le semestre
3. Modifiez les champs
4. Cliquez "Enregistrer"
5. ✅ Toast: "Semestre mise à jour"

### Supprimer un Semestre
1. Onglet 📅 **Semestres**
2. Cliquez 🗑️ sur le semestre
3. Confirmez dans la modal
4. ✅ Toast: "Semestre supprimé"

### Rechercher/Filtrer
1. Onglet 📅 **Semestres**
2. Utilisez le champ 🔍 "Rechercher…"
3. Tapez:
   - Libellé: "S1", "semestre", etc.
   - Année: "2024", "2025-2026", etc.
4. La table se filtre en temps réel

---

## 🔗 API Endpoints Utilisés

```javascript
// Lister tous les semestres
GET /api/semestres

// Récupérer un semestre
GET /api/semestres/:id

// Créer un semestre
POST /api/semestres
Body: { libelle, annee_universitaire }

// Modifier un semestre
PUT /api/semestres/:id
Body: { libelle, annee_universitaire }

// Supprimer un semestre
DELETE /api/semestres/:id
```

---

## 🔄 État et Refetch

### État Managé
```javascript
const [tab, setTab] = useState('matieres');      // Onglet actif
const [search, setSearch] = useState('');        // Recherche globale
const [modalS, setModalS] = useState(null);      // Modal semestre
const [confirmDel, setConfirmDel] = useState(null); // Confirmation delete
```

### Données Chargées
```javascript
const { data: semestres, loading: loadS, error: errS, refetch: refetchS } 
  = useApi(() => semestresAPI.list());
```

**Déclencheurs de Refetch**:
- Après création d'un semestre ✅
- Après modification d'un semestre ✅
- Après suppression d'un semestre ✅

---

## 📊 Statistiques Affichées

Pour chaque semestre:

```
Libellé: "Semestre 1"
Année: "2024-2025"
UEs: 3 UE
Matières: 12 matières (45 crédits)
```

**Calcul des UEs**:
```javascript
const uesOfSem = ueList.filter(u => u.semestre_id === sem.id);
```

**Calcul des Matières et Crédits**:
```javascript
const matiereOfSem = mList.filter(m => uesOfSem.some(u => u.id === m.ue_id));
const totalCredits = matiereOfSem.reduce((s, m) => s + m.credits, 0);
```

---

## ⚡ Patterns et Conventions

### Pattern Modal
Suivant le même pattern que UEModal et MatiereModal:
- Overlay clickable qui ferme la modal
- Champs obligatoires requis
- Boutons Annuler/Enregistrer
- État `saving` pour disabled le bouton
- Toast de succès/erreur

### Pattern Suppression
Confirmé via ConfirmModal:
- Titre: "Supprimer le semestre"
- Message: Affiche le libellé
- Propriété `danger={true}` pour styling rouge
- Gestionnaire de fermeture

### Pattern Filtrage
Recherche globale appliquée à tous les onglets:
```javascript
const filteredS = semList.filter(s => 
  `${s.libelle} ${s.annee_universitaire}`
    .toLowerCase()
    .includes(search.toLowerCase())
);
```

---

## ✅ Tests Effectués

- ✅ Compilation sans erreur (VITE v8.0.8 ready in 389ms)
- ✅ ESLint: Aucune erreur new sur MatieresPage.jsx
- ✅ Onglet se bascule correctement
- ✅ Bouton action change selon l'onglet
- ✅ Table affiche correctement
- ✅ Responsive design (wrapper overflow)
- ✅ Filtrage fonctionne
- ✅ Aucune régression sur les autres onglets

---

## 🚀 Statut

| Aspect | Status |
|--------|--------|
| Code modifié | ✅ Clean |
| Compilation | ✅ Success |
| ESLint | ✅ No new errors |
| Fonctionnalité | ✅ Complete |
| Interface | ✅ Consistent |
| API Integration | ✅ Working |
| **GlobalStatus** | **✅ READY** |

---

## 📚 Ressources

- [MatieresPage.jsx](src/pages/MatieresPage.jsx) - Source code
- [API Documentation](API_DOCUMENTATION.md#-semestres) - Endpoints
- [CORRECTIONS_APPLIQUEES.md](CORRECTIONS_APPLIQUEES.md) - Full changelog

---

## 💡 Prochaines Étapes (Optionnelles)

- [ ] Validation des dates pour l'année universitaire (ex: format YYYY-YYYY)
- [ ] Affichage du statut "Actif/Archivé" pour les semestres
- [ ] Export des semestres en CSV
- [ ] Duplication de semestre (copy avec UEs et matières)
- [ ] Calendrier académique pour chaque semestre

---

**Module CRUD Semestres**: ✅ Livré et testé le 15 avril 2026
