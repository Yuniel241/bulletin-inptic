import { useState } from 'react';
import { useAuthStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { juryAPI, bulletinsAPI, enseignantsAPI, etudiantsAPI, uesAPI, semestresAPI } from '../utils/api';
import { LoadingPage, StatCard, ErrorBox, PageHeader } from '../components/UI';

function gradeClass(n) {
  if (n == null) return '';
  if (n >= 14) return 'grade-excellent';
  if (n >= 12) return 'grade-good';
  if (n >= 10) return 'grade-pass';
  return 'grade-fail';
}

// Normaliser notes_detaillees : array OU object → array
function normalizeNotesDetaillees(notesDetaillees) {
  if (!notesDetaillees) return [];
  if (Array.isArray(notesDetaillees)) return notesDetaillees;
  if (typeof notesDetaillees === 'object') {
    return Object.values(notesDetaillees);
  }
  return [];
}

// Helper: extraire une note du tableau notes_detaillees par type
function getNoteByType(notesDetaillees, type) {
  const normalized = normalizeNotesDetaillees(notesDetaillees);
  const found = normalized.find(nd => nd.type === type);
  return found?.note;
}

function EtudiantDashboard({ user }) {
  const [selectedSemestre, setSelectedSemestre] = useState(null);
  
  // Récupérer l'étudiant actuel
  const { data: etudiantData, loading: etudiantLoading } = useApi(() => etudiantsAPI.current(), []);
  const etudiantId = etudiantData?.id;
  
  // Récupérer les notes
  const { data: notesData, loading: notesLoading, error: notesError } = useApi(
    () => etudiantId ? etudiantsAPI.notes(etudiantId) : Promise.resolve(null), 
    [etudiantId]
  );

  // Récupérer les absences
  const { data: absencesData, loading: absencesLoading, error: absencesError } = useApi(
    () => etudiantId ? etudiantsAPI.absences(etudiantId) : Promise.resolve(null),
    [etudiantId]
  );

  // Récupérer les UEs pour le mapping ue_id → semestre_id
  const { data: uesData } = useApi(() => uesAPI.list(), []);

  // Récupérer les semestres pour le mapping semestre_id → libelle
  const { data: semestresData } = useApi(() => semestresAPI.list(), []);

  if (etudiantLoading || notesLoading || absencesLoading) return <LoadingPage />;
  if (notesError) return <ErrorBox message={`Erreur notes: ${notesError}`} />;
  if (absencesError) return <ErrorBox message={`Erreur absences: ${absencesError}`} />;

  const notes = notesData?.details_par_matiere || [];
  const absences = Array.isArray(absencesData) ? absencesData : (absencesData?.data || []);
  const ues = Array.isArray(uesData) ? uesData : (uesData?.data || []);
  const semestres = Array.isArray(semestresData) ? semestresData : (semestresData?.data || []);

  // Créer un mapping semestre_id → {libelle, ...}
  const semestreMap = new Map();
  semestres.forEach(sem => {
    semestreMap.set(sem.id, sem);
  });

  // Créer un mapping ue_id → semestre_id et ue_id → ue_object
  const ueSemestreMap = new Map();
  const ueMap = new Map();
  ues.forEach(ue => {
    ueSemestreMap.set(ue.id, ue.semestre_id);
    ueMap.set(ue.id, ue);
  });

  // Créer une map des absences par matière_id
  const absencesByMatiereId = new Map();
  absences.forEach(abs => {
    if (abs.matiere_id) {
      absencesByMatiereId.set(abs.matiere_id, abs);
    }
  });

  // Grouper les notes par UE (extraire ue_id depuis notes_detaillees[0].matiere.ue_id)
  const notesByUE = {};
  notes.forEach(note => {
    const normalized = normalizeNotesDetaillees(note.notes_detaillees);
    const ueId = normalized[0]?.matiere?.ue_id;
    const semId = ueSemestreMap.get(ueId); // Obtenir semestre_id depuis le mapping
    
    if (ueId) {
      if (!notesByUE[ueId]) notesByUE[ueId] = { notes: [], semestre_id: semId };
      notesByUE[ueId].notes.push(note);
    }
  });

  // Extraire les semestres uniques et trier
  const semestreIds = Array.from(new Set(Object.values(notesByUE).map(ue => ue.semestre_id)))
    .filter(Boolean)
    .sort((a, b) => a - b);
  
  // Si aucun semestre sélectionné, sélectionner le premier
  const currentSemestre = selectedSemestre ?? semestreIds[0];
  
  // Filtrer les UEs pour le semestre sélectionné
  const filteredNotesByUE = Object.fromEntries(
    Object.entries(notesByUE).filter(([, ueData]) => ueData.semestre_id === currentSemestre)
  );

  return (
    <div className="fade-in">
      <PageHeader title={`Bonjour, ${user.name}`} sub="LP ASUR — Vos notes" />
      <div className="page-body">
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
              {user.name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{user.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Compte étudiant — Vos notes et bulletins</div>
            </div>
          </div>

          {/* Sélecteur de semestres */}
          {semestreIds.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {semestreIds.map(sem => {
                const semInfo = semestreMap.get(sem);
                const semLabel = semInfo?.libelle || `Semestre ${sem}`;
                return (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemestre(sem)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: currentSemestre === sem ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: currentSemestre === sem ? 'var(--accent)' : 'transparent',
                      color: currentSemestre === sem ? '#fff' : 'var(--text)',
                      fontWeight: currentSemestre === sem ? 600 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {semLabel}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tableaux par UE */}
          {Object.entries(filteredNotesByUE)
            .sort(([, uea], [, ueb]) => (uea.semestre_id || 0) - (ueb.semestre_id || 0))
            .map(([ueId, ueData]) => {
              const ueNotes = ueData.notes;
              const semId = ueData.semestre_id;
              
              // Obtenir les infos UE depuis le mapping
              const ueInfo = ueMap.get(Number(ueId));
              const ueLabel = ueInfo ? `${ueInfo.code} — ${ueInfo.libelle}` : `UE ${ueId}`;
              
              // Obtenir le libelle du semestre depuis le mapping
              const semestreInfo = semestreMap.get(semId);
              const semLabel = semestreInfo ? semestreInfo.libelle : `Semestre ${semId}`;
              
              return (
                <div key={`ue-${ueId}`} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{semLabel}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid var(--accent)' }}>
                    {ueLabel}
                  </div>
                  <table className="data-table" style={{ marginBottom: 16 }}>
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th style={{ textAlign: 'center' }}>CC</th>
                        <th style={{ textAlign: 'center' }}>Examen</th>
                        <th style={{ textAlign: 'center' }}>Absences</th>
                        <th style={{ textAlign: 'center', fontWeight: 900 }}>Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ueNotes.length > 0 ? (
                        <>
                          {ueNotes.map((note, idx) => {
                            const noteCC = getNoteByType(note.notes_detaillees, 'CC') || note.note_cc;
                            const noteExamen = getNoteByType(note.notes_detaillees, 'Examen') || note.note_examen;
                            
                            // Extraire matiere_id et libellé depuis notes_detaillees
                            const norm = normalizeNotesDetaillees(note.notes_detaillees);
                            const matiereId = norm[0]?.matiere_id;
                            const matiereLibelle = norm[0]?.matiere?.libelle || note.matiere;
                            const absence = absencesByMatiereId.get(matiereId);
                            
                            return (
                              <tr key={`${ueId}-note-${matiereId || idx}`}>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{matiereLibelle}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note.code}</div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`mono ${gradeClass(noteCC)}`} style={{ fontWeight: 600 }}>
                                    {noteCC != null ? Number(noteCC).toFixed(2) : '—'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`mono ${gradeClass(noteExamen)}`} style={{ fontWeight: 600 }}>
                                    {noteExamen != null ? Number(noteExamen).toFixed(2) : '—'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center', fontSize: 12, color: absence?.heures > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: absence?.heures > 0 ? 600 : 400 }}>
                                  {absence?.heures ? `${Number(absence.heures).toFixed(1)}h` : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`mono ${gradeClass(note.moyenne_finale)}`} style={{ fontWeight: 900, fontSize: 13 }}>
                                    {note.moyenne_finale != null ? Number(note.moyenne_finale).toFixed(2) : '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      ) : (
                        <tr key={`${ueId}-empty`}><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Aucune note saisie</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}





          {notes.length === 0 && (
            <div className="alert" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)', fontSize: 13 }}>
               Aucune note saisie pour le moment. Vérifiez auprès de vos enseignants.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EnseignantDashboard({ user }) {
  const { data, loading, error } = useApi(() => enseignantsAPI.mesMatieres());

  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const matieres = data?.data || [];
  const allEvaluations = matieres.flatMap(m => m.evaluations || []);
  const uniqueEtudiants = new Set(
    allEvaluations
      .map(ev => ev.etudiant?.id)
      .filter(Boolean)
  ).size;

  return (
    <div className="fade-in">
      <PageHeader title={`Bonjour, ${user.name}`} sub="Espace enseignant — matières assignées" />
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
          <StatCard label="Matières" value={matieres.length} icon="📚" color="accent" sub="Assignées" />
          <StatCard label="Étudiants suivis" value={uniqueEtudiants} icon="👥" color="success" sub="Avec notes saisies" />
          <StatCard label="Évaluations" value={allEvaluations.length} icon="✏️" color="warning" sub="Total enregistrées" />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>UE</th>
                <th style={{ textAlign: 'center' }}>Coeff.</th>
                <th style={{ textAlign: 'center' }}>Notes saisies</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.libelle}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.code}</div>
                  </td>
                  <td>{m.ue?.code || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{m.coefficient ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>{(m.evaluations || []).length}</td>
                </tr>
              ))}
              {matieres.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>Aucune matière assignée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const role = user?.role?.nom?.toLowerCase();

  if (role === 'etudiant') return <EtudiantDashboard user={user} />;
  if (role === 'enseignant') return <EnseignantDashboard user={user} />;

  const { data: recap, loading, error } = useApi(() => juryAPI.recapitulatif());

  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const rows = recap?.data || [];
  const diplomes = rows.filter(r => r.resultat_final?.decision === 'Diplômé(e)').length;
  const reprise = rows.filter(r => r.resultat_final?.decision?.includes('soutenance')).length;
  const redouble = rows.filter(r => r.resultat_final?.decision?.includes('Redouble')).length;

  const moyS5 = rows.filter(r => r.semestre_A?.moyenne != null).map(r => r.semestre_A.moyenne);
  const moyS6 = rows.filter(r => r.semestre_B?.moyenne != null).map(r => r.semestre_B.moyenne);
  const avgS5 = moyS5.length ? (moyS5.reduce((a, b) => a + b, 0) / moyS5.length).toFixed(2) : '—';
  const avgS6 = moyS6.length ? (moyS6.reduce((a, b) => a + b, 0) / moyS6.length).toFixed(2) : '—';

  const top = [...rows]
    .filter(r => r.resultat_final?.moyenne_annuelle != null)
    .sort((a, b) => b.resultat_final.moyenne_annuelle - a.resultat_final.moyenne_annuelle)
    .slice(0, 10);

  return (
    <div className="fade-in">
      <PageHeader
        title="Tableau de bord"
        sub={`Promotion LP ASUR — ${recap?.annee_universitaire || '2025-2026'} · ${rows.length} étudiant${rows.length > 1 ? 's' : ''}`}
      />
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Total étudiants" value={rows.length} icon="👥" color="accent" sub="Promotion" />
          <StatCard label="Diplômés" value={diplomes} icon="🎓" color="success" sub={`${rows.length ? Math.round(diplomes / rows.length * 100) : 0}% de réussite`} />
          <StatCard label="Moy. S5" value={avgS5} icon="📊" color="accent" sub="/20" />
          <StatCard label="Moy. S6" value={avgS6} icon="📊" color="warning" sub="/20" />
          <StatCard label="Reprise" value={reprise} icon="⏳" color="warning" sub="soutenance" />
          <StatCard label="Redoublants" value={redouble} icon="↩️" color="danger" sub="crédits insuffisants" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Classement */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Classement de la promotion</div>
              <span className="badge badge-info">{rows.length} étudiants</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Rang</th><th>Étudiant</th><th style={{ textAlign: 'center' }}>S5</th><th style={{ textAlign: 'center' }}>S6</th><th style={{ textAlign: 'center' }}>Annuelle</th><th>Mention</th><th>Décision</th></tr>
              </thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 14, color: i === 0 ? 'var(--gold)' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c39' : 'var(--text-muted)' }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                          {r.identite?.nom?.[0]}{r.identite?.prenom?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{r.identite?.nom}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.identite?.prenom}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`mono ${gradeClass(r.semestre_A?.moyenne)}`} style={{ fontSize: 12 }}>
                        {r.semestre_A?.moyenne?.toFixed(2) ?? '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`mono ${gradeClass(r.semestre_B?.moyenne)}`} style={{ fontSize: 12 }}>
                        {r.semestre_B?.moyenne?.toFixed(2) ?? '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`mono ${gradeClass(r.resultat_final?.moyenne_annuelle)}`} style={{ fontWeight: 800, fontSize: 14 }}>
                        {r.resultat_final?.moyenne_annuelle?.toFixed(2) ?? '—'}
                      </span>
                    </td>
                    <td>
                      {r.resultat_final?.mention && (
                        <span className="badge badge-gold" style={{ fontSize: 10 }}>{r.resultat_final.mention}</span>
                      )}
                    </td>
                    <td>
                      {r.resultat_final?.decision && (
                        <span className={`badge ${r.resultat_final.decision === 'Diplômé(e)' ? 'badge-success' : r.resultat_final.decision.includes('soutenance') ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                          {r.resultat_final.decision}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {top.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Aucune donnée disponible</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Side panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Décisions du jury</div>
              {[
                { label: 'Diplômé(e)', count: diplomes, color: 'var(--success)' },
                { label: 'Reprise soutenance', count: reprise, color: 'var(--warning)' },
                { label: 'Redouble', count: redouble, color: 'var(--danger)' },
                { label: 'Non calculé', count: Math.max(0, rows.length - diplomes - reprise - redouble), color: 'var(--text-muted)' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${rows.length ? item.count / rows.length * 100 : 0}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Distribution des mentions</div>
              {['Très Bien', 'Bien', 'Assez Bien', 'Passable'].map(m => {
                const count = rows.filter(r => r.resultat_final?.mention === m).length;
                return (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="badge badge-gold" style={{ fontSize: 10 }}>{m}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
