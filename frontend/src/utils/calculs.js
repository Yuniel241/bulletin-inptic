import { MATIERES, UES, SEMESTRES, POIDS_CC, POIDS_EXAM, PENALITE_ABSENCE } from '../data/referential';

/**
 * Calcule la moyenne d'une matière pour un étudiant
 * @param {object} evals - { cc, examen, rattrapage }
 * @param {number} absences - heures d'absence
 * @param {number} penalite - pénalité par heure
 */
export function calculerMoyenneMatiere(evals, absences = 0, penalite = PENALITE_ABSENCE) {
  const { cc, examen, rattrapage } = evals || {};
  let moyenne = null;

  if (rattrapage !== null && rattrapage !== undefined && rattrapage !== '') {
    moyenne = parseFloat(rattrapage);
  } else if (cc !== null && cc !== undefined && cc !== '' && examen !== null && examen !== undefined && examen !== '') {
    moyenne = parseFloat(cc) * POIDS_CC + parseFloat(examen) * POIDS_EXAM;
  } else if (cc !== null && cc !== undefined && cc !== '') {
    moyenne = parseFloat(cc);
  } else if (examen !== null && examen !== undefined && examen !== '') {
    moyenne = parseFloat(examen);
  }

  if (moyenne !== null && absences > 0) {
    moyenne = Math.max(0, moyenne - absences * penalite);
  }

  return moyenne !== null ? Math.round(moyenne * 100) / 100 : null;
}

/**
 * Calcule la moyenne d'une UE
 */
export function calculerMoyenneUE(ueId, moyennesMatiere) {
  const matieres = MATIERES.filter(m => m.ue_id === ueId);
  let somme = 0;
  let totalCoeff = 0;

  for (const mat of matieres) {
    const moy = moyennesMatiere[mat.id];
    if (moy !== null && moy !== undefined) {
      somme += moy * mat.coefficient;
      totalCoeff += mat.coefficient;
    }
  }

  if (totalCoeff === 0) return null;
  return Math.round((somme / totalCoeff) * 100) / 100;
}

/**
 * Calcule la moyenne de semestre
 */
export function calculerMoyenneSemestre(semestreId, moyennesUE) {
  const ues = UES.filter(u => u.semestre_id === semestreId);
  let somme = 0;
  let totalCoeff = 0;

  for (const ue of ues) {
    const moy = moyennesUE[ue.id];
    const matieres = MATIERES.filter(m => m.ue_id === ue.id);
    const coeff = matieres.reduce((s, m) => s + m.coefficient, 0);
    if (moy !== null && moy !== undefined) {
      somme += moy * coeff;
      totalCoeff += coeff;
    }
  }

  if (totalCoeff === 0) return null;
  return Math.round((somme / totalCoeff) * 100) / 100;
}

/**
 * Vérifie si une UE est acquise (directe ou par compensation)
 */
export function validerUE(ueId, moyennesUE, moyenneSemestre) {
  const moy = moyennesUE[ueId];
  if (moy === null || moy === undefined) return { acquise: false, compensation: false };

  if (moy >= 10) return { acquise: true, compensation: false };
  if (moyenneSemestre >= 10) return { acquise: true, compensation: true };
  return { acquise: false, compensation: false };
}

/**
 * Calcule les crédits acquis pour un semestre
 */
export function calculerCreditsSemestre(semestreId, moyennesUE, moyenneSemestre) {
  const ues = UES.filter(u => u.semestre_id === semestreId);
  let creditsAcquis = 0;
  const resultatUEs = {};

  for (const ue of ues) {
    const validation = validerUE(ue.id, moyennesUE, moyenneSemestre);
    const matieres = MATIERES.filter(m => m.ue_id === ue.id);
    const credits = matieres.reduce((s, m) => s + m.credits, 0);

    resultatUEs[ue.id] = { ...validation, credits, moyenneUE: moyennesUE[ue.id] };
    if (validation.acquise) creditsAcquis += credits;
  }

  const creditsTotal = SEMESTRES.find(s => s.id === semestreId)?.credits_total || 30;
  return {
    creditsAcquis,
    creditsTotal,
    valide: creditsAcquis >= creditsTotal,
    resultatUEs,
  };
}

/**
 * Décision annuelle
 */
export function decisionAnnuelle(resultS5, resultS6) {
  if (!resultS5 || !resultS6) return null;

  const moyAnnuelle = ((resultS5.moyenneSemestre || 0) + (resultS6.moyenneSemestre || 0)) / 2;

  // Vérifie si seulement UE6-2 manque
  const creditsS5 = resultS5.credits || {};
  const creditsS6 = resultS6.credits || {};

  const ue62 = creditsS6.resultatUEs?.['UE6-2'];
  const autresS6 = Object.entries(creditsS6.resultatUEs || {})
    .filter(([k]) => k !== 'UE6-2')
    .every(([, v]) => v.acquise);

  if (resultS5.valide && autresS6 && ue62 && !ue62.acquise) {
    return { decision: 'Reprise de soutenance', mention: getMention(moyAnnuelle), moyenneAnnuelle: moyAnnuelle };
  }

  if (resultS5.valide && resultS6.valide) {
    return { decision: 'Diplômé(e)', mention: getMention(moyAnnuelle), moyenneAnnuelle: moyAnnuelle };
  }

  return { decision: 'Redouble la Licence', mention: null, moyenneAnnuelle: moyAnnuelle };
}

export function getMention(moyenne) {
  if (moyenne >= 16) return 'Très Bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez Bien';
  if (moyenne >= 10) return 'Passable';
  return null;
}

/**
 * Calcule tous les résultats pour un étudiant
 */
export function calculerTousResultats(evaluations, absences, penalite = PENALITE_ABSENCE) {
  const moyennesMatiere = {};
  for (const mat of MATIERES) {
    const evals = evaluations?.[mat.id] || {};
    const abs = absences?.[mat.id] || 0;
    moyennesMatiere[mat.id] = calculerMoyenneMatiere(evals, abs, penalite);
  }

  const moyennesUE = {};
  for (const ue of UES) {
    moyennesUE[ue.id] = calculerMoyenneUE(ue.id, moyennesMatiere);
  }

  const resultats = {};
  for (const sem of ['S5', 'S6']) {
    const uesSem = UES.filter(u => u.semestre_id === sem);
    const moyUESem = {};
    for (const ue of uesSem) moyUESem[ue.id] = moyennesUE[ue.id];

    const moyenneSemestre = calculerMoyenneSemestre(sem, moyennesUE);
    const credits = calculerCreditsSemestre(sem, moyennesUE, moyenneSemestre);

    resultats[sem] = {
      moyenneSemestre,
      ...credits,
      valide: credits.valide,
    };
  }

  const annuel = decisionAnnuelle(resultats.S5, resultats.S6);

  return { moyennesMatiere, moyennesUE, resultats, annuel };
}

export function gradeClass(note) {
  if (note === null || note === undefined) return '';
  if (note >= 14) return 'grade-excellent';
  if (note >= 12) return 'grade-good';
  if (note >= 10) return 'grade-pass';
  return 'grade-fail';
}

export function formatNote(note) {
  if (note === null || note === undefined) return '—';
  return Number(note).toFixed(2);
}
