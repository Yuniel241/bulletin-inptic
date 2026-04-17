// ============================================================
// RÉFÉRENTIEL PÉDAGOGIQUE LP ASUR — INPTIC
// ============================================================

export const SEMESTRES = [
  { id: 'S5', libelle: 'Semestre 5', annee_universitaire: '2025/2026', credits_total: 30 },
  { id: 'S6', libelle: 'Semestre 6', annee_universitaire: '2025/2026', credits_total: 30 },
];

export const UES = [
  { id: 'UE5-1', code: 'UE5-1', libelle: 'Enseignement Général', semestre_id: 'S5' },
  { id: 'UE5-2', code: 'UE5-2', libelle: 'Connaissances de Base et Outils pour les Réseaux d\'Entreprise', semestre_id: 'S5' },
  { id: 'UE6-1', code: 'UE6-1', libelle: 'Sciences de Base', semestre_id: 'S6' },
  { id: 'UE6-2', code: 'UE6-2', libelle: 'Télécommunications et Réseaux', semestre_id: 'S6' },
];

export const MATIERES = [
  // UE5-1
  { id: 'm1',  libelle: 'Anglais technique',                           coefficient: 1, credits: 2, ue_id: 'UE5-1' },
  { id: 'm2',  libelle: 'Management d\'équipe',                        coefficient: 1, credits: 1, ue_id: 'UE5-1' },
  { id: 'm3',  libelle: 'Communication',                               coefficient: 2, credits: 1, ue_id: 'UE5-1' },
  { id: 'm4',  libelle: 'Droit de l\'informatique',                    coefficient: 2, credits: 2, ue_id: 'UE5-1' },
  { id: 'm5',  libelle: 'Gestion de projets',                          coefficient: 1, credits: 1, ue_id: 'UE5-1' },
  { id: 'm6',  libelle: 'Veille technologique',                        coefficient: 1, credits: 1, ue_id: 'UE5-1' },
  { id: 'm7',  libelle: 'Consolidation bases de la programmation',     coefficient: 2, credits: 2, ue_id: 'UE5-1' },
  { id: 'm8',  libelle: 'Conception BDD et SQL',                       coefficient: 2, credits: 2, ue_id: 'UE5-1' },
  // UE5-2
  { id: 'm9',  libelle: 'Remise à niveau IOS',                         coefficient: 2, credits: 2, ue_id: 'UE5-2' },
  { id: 'm10', libelle: 'Connaissance des réseaux LAN',                coefficient: 2, credits: 2, ue_id: 'UE5-2' },
  { id: 'm11', libelle: 'Les langages du script',                      coefficient: 2, credits: 2, ue_id: 'UE5-2' },
  { id: 'm12', libelle: 'Virtualisation',                              coefficient: 3, credits: 3, ue_id: 'UE5-2' },
  { id: 'm13', libelle: 'Application client-serveur',                  coefficient: 2, credits: 2, ue_id: 'UE5-2' },
  { id: 'm14', libelle: 'Téléphonie IP avancée',                       coefficient: 2, credits: 2, ue_id: 'UE5-2' },
  { id: 'm15', libelle: 'Services à valeur ajoutée',                   coefficient: 2, credits: 2, ue_id: 'UE5-2' },
  { id: 'm16', libelle: 'CCNA2',                                       coefficient: 1, credits: 2, ue_id: 'UE5-2' },
  // UE6-1
  { id: 'm17', libelle: 'Environnement Windows',                       coefficient: 3, credits: 3, ue_id: 'UE6-1' },
  { id: 'm18', libelle: 'Environnement Linux',                         coefficient: 3, credits: 3, ue_id: 'UE6-1' },
  { id: 'm19', libelle: 'Interopérabilité',                            coefficient: 3, credits: 3, ue_id: 'UE6-1' },
  { id: 'm20', libelle: 'Cryptage et Authentification',                coefficient: 2, credits: 2, ue_id: 'UE6-1' },
  { id: 'm21', libelle: 'Prévention et Sécurité',                      coefficient: 3, credits: 3, ue_id: 'UE6-1' },
  { id: 'm22', libelle: 'Optimisation de l\'accès Internet',           coefficient: 3, credits: 3, ue_id: 'UE6-1' },
  { id: 'm23', libelle: 'Contrôle d\'accès distant',                   coefficient: 2, credits: 2, ue_id: 'UE6-1' },
  { id: 'm24', libelle: 'CCNA3',                                       coefficient: 1, credits: 1, ue_id: 'UE6-1' },
  // UE6-2
  { id: 'm25', libelle: 'Méthodologie de rédaction du rapport de stage', coefficient: 2, credits: 2, ue_id: 'UE6-2' },
  { id: 'm26', libelle: 'Soutenance',                                  coefficient: 8, credits: 8, ue_id: 'UE6-2' },
];

// Sample students
export const SAMPLE_STUDENTS = [
  { id: 'e1', nom: 'MBOUMBA', prenom: 'Serge Aurélien', date_naissance: '1998-03-14', lieu_naissance: 'Libreville', bac: 'Bac C', provenance: 'Lycée national Léon MBA' },
  { id: 'e2', nom: 'NKOGHE', prenom: 'Marie Claire', date_naissance: '1999-07-22', lieu_naissance: 'Port-Gentil', bac: 'Bac D', provenance: 'Lycée technique de Port-Gentil' },
  { id: 'e3', nom: 'OBAME', prenom: 'Jean-Baptiste', date_naissance: '1997-11-05', lieu_naissance: 'Oyem', bac: 'Bac S', provenance: 'Université Omar Bongo' },
  { id: 'e4', nom: 'MOUSSAVOU', prenom: 'Princesse Stéphanie', date_naissance: '2000-01-18', lieu_naissance: 'Libreville', bac: 'Bac C', provenance: 'Institut Supérieur de Technologie' },
  { id: 'e5', nom: 'ENGONE', prenom: 'Thierry Romuald', date_naissance: '1998-09-30', lieu_naissance: 'Franceville', bac: 'Bac D', provenance: 'Lycée de Franceville' },
  { id: 'e6', nom: 'BIYOGHE', prenom: 'Fatoumata Aminata', date_naissance: '1999-04-12', lieu_naissance: 'Cotonou', bac: 'Bac S', provenance: 'Université d\'Abomey-Calavi' },
  { id: 'e7', nom: 'MINTSA', prenom: 'Patrick Olivier', date_naissance: '1997-12-28', lieu_naissance: 'Libreville', bac: 'Bac C', provenance: 'Lycée national Léon MBA' },
  { id: 'e8', nom: 'NZIGOU', prenom: 'Sandrine Lucie', date_naissance: '2000-06-15', lieu_naissance: 'Mouila', bac: 'Bac D', provenance: 'Lycée de Mouila' },
];

// Pénalité absences : 0.01 pt/heure (paramétrable)
export const PENALITE_ABSENCE = 0.01;

// Pondérations CC/Examen (paramétrable)
export const POIDS_CC = 0.4;
export const POIDS_EXAM = 0.6;
