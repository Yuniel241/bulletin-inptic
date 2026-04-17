import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { etudiantsAPI, evaluationsAPI, semestresAPI, uesAPI, matieresAPI, enseignantsAPI } from '../utils/api';
import { LoadingPage, ErrorBox, PageHeader } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

function gradeClass(n) {
  if (n == null) return '';
  if (n >= 14) return 'grade-excellent';
  if (n >= 12) return 'grade-good';
  if (n >= 10) return 'grade-pass';
  return 'grade-fail';
}

function NoteInput({ value, onChange, onBlur }) {
  return (
    <input className="note-input" type="number" min="0" max="20" step="0.25" placeholder="—"
      value={value ?? ''} onChange={e => {
        const v = e.target.value;
        if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 20)) onChange(v);
      }} onBlur={onBlur} />
  );
}

// Build a notes map from API evaluations array
function buildNotesMap(evals) {
  const map = {};
  for (const ev of (evals || [])) {
    if (!map[ev.matiere_id]) map[ev.matiere_id] = {};
    map[ev.matiere_id][ev.type] = { id: ev.id, note: ev.note };
  }
  return map;
}

export default function NotesPage() {
  const { user } = useAuthStore();
  const role = user?.role?.nom?.toLowerCase();
  const isAdmin = role === 'admin';
  const isEnseignant = role === 'enseignant';
  const isSecretariat = role === 'secretariat';
  const canAccess = isAdmin || isEnseignant || isSecretariat;

  const { data: etudiantsData, loading: loadEtu } = useApi(async () => {
    if (isEnseignant) {
      // Enseignants: tenter /etudiants, sinon dériver des évaluations
      try {
        return await etudiantsAPI.list();
      } catch (e) {
        return await evaluationsAPI.list();
      }
    }
    // Admin et Secrétariat: listing complet
    return await etudiantsAPI.list();
  }, [isEnseignant, isSecretariat]);
  const { data: semestres, loading: loadSem } = useApi(() => {
    if (isEnseignant) return Promise.resolve({ data: [{ id: 'all', libelle: 'Mes matières' }] });
    // Admin et Secrétariat: tous les semestres
    return semestresAPI.list();
  }, [isEnseignant]);
  const { data: ues } = useApi(() => {
    if (isEnseignant) return Promise.resolve({ data: [{ id: 'mes', code: 'MES', libelle: 'Mes matières', semestre_id: 'all' }] });
    // Admin et Secrétariat: toutes les UEs
    return uesAPI.list();
  }, [isEnseignant]);
  const { data: allMatieres } = useApi(() => {
    if (isEnseignant) return enseignantsAPI.mesMatieres();
    // Admin et Secrétariat: toutes les matières
    return matieresAPI.list();
  }, [isEnseignant]);

  const [selectedEtu, setSelectedEtu] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [notesMap, setNotesMap] = useState({});
  const [saving, setSaving] = useState({});
  const [search, setSearch] = useState('');
  const [localNotes, setLocalNotes] = useState({});

  // Compute variables before useEffect
  const semList = semestres || [];
  const matieres = isEnseignant ? (allMatieres?.data || []) : (allMatieres || []);
  const ueList = ues || [];
  const etudiants = (() => {
    if (!isEnseignant) return etudiantsData || [];
    // If we got a students array, it has {nom, prenom}. If we got evaluations, derive students from them.
    if (Array.isArray(etudiantsData) && (etudiantsData[0]?.matricule || etudiantsData[0]?.nom)) {
      return etudiantsData;
    }
    return Array.from(
      new Map(
        (etudiantsData || [])
          .map(ev => ev.etudiant)
          .filter(Boolean)
          .map(et => [et.id, et])
      ).values()
    );
  })();

  // Load student notes when selection changes
  const loadNotes = useCallback(async (etuId) => {
    if (!etuId) return;
    try {
      await etudiantsAPI.notes(etuId);
      const evRes = await evaluationsAPI.list();
      const evsForStudent = (evRes.data || []).filter(ev => ev.etudiant_id === etuId);
      setNotesMap(buildNotesMap(evsForStudent));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (selectedEtu) loadNotes(selectedEtu);
  }, [selectedEtu, loadNotes]);

  useEffect(() => {
    if (etudiants?.length && !selectedEtu) setSelectedEtu(etudiants[0].id);
    if (semestres?.length && !selectedSem) setSelectedSem(semestres[0]?.id);
  }, [etudiants, semestres]);

  // Guards must come AFTER all hooks
  if (!canAccess) return <ErrorBox message="Accès non autorisé selon le rôle connecté." />;
  if (loadEtu || loadSem) return <LoadingPage />;

  const semUEs = ueList.filter(u => u.semestre_id === selectedSem);
  const etudiant = (etudiants || []).find(e => e.id === selectedEtu);
  const filtered = (etudiants || []).filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()));

  const saveNote = async (matiereId, type, value) => {
    if (!selectedEtu || value === '') return; // Ne pas sauvegarder les valeurs vides
    const key = `${matiereId}-${type}`;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await evaluationsAPI.create({
        etudiant_id: selectedEtu,
        matiere_id: matiereId,
        notes: [{ type, note: parseFloat(value), date_saisie: new Date().toISOString().split('T')[0] }]
      });
      // Reload notes
      await loadNotes(selectedEtu);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const deleteNote = async (matiereId, type) => {
    const evalId = notesMap[matiereId]?.[type]?.id;
    if (!evalId) return;
    const key = `${matiereId}-${type}`;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await evaluationsAPI.delete(evalId);
      setLocalNotes(n => {
        const updated = { ...n };
        delete updated[`${matiereId}-${type}`];
        return updated;
      });
      // Reload notes
      await loadNotes(selectedEtu);
      toast.success('Note supprimée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const getLocal = (mId, type) => {
    const k = `${mId}-${type}`;
    if (localNotes[k] !== undefined) return localNotes[k];
    return notesMap[mId]?.[type]?.note ?? '';
  };
  const setLocal = (mId, type, v) => setLocalNotes(n => ({ ...n, [`${mId}-${type}`]: v }));
  const handleBlur = (mId, type) => {
    const k = `${mId}-${type}`;
    const v = localNotes[k];
    if (v !== undefined && v !== '') saveNote(mId, type, v);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Saisie des Notes"
        sub="CC (40%) · Examen (60%) · Rattrapage remplace la moyenne"
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            {semList.map(s => (
              <button key={s.id} className={`btn ${selectedSem === s.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedSem(s.id)}>
                {s.libelle}
              </button>
            ))}
          </div>
        }
      />
      <div className="page-body">
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Student list */}
          <div style={{ width: 210, flexShrink: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <input className="input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
              </div>
              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {filtered.map(e => (
                  <button key={e.id} onClick={() => setSelectedEtu(e.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
                    background: selectedEtu === e.id ? 'rgba(59,130,246,0.07)' : 'transparent',
                    border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
                    borderLeft: selectedEtu === e.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                    <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{e.prenom?.[0]}{e.nom?.[0]}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: selectedEtu === e.id ? 700 : 500, color: selectedEtu === e.id ? 'var(--accent)' : 'var(--text-primary)' }}>{e.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.prenom}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes tables */}
          <div style={{ flex: 1 }}>
            {etudiant && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div className="avatar">{etudiant.prenom?.[0]}{etudiant.nom?.[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{etudiant.nom} {etudiant.prenom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{etudiant.matricule}</div>
                  </div>
                </div>

                {semUEs.map(ue => {
                  const matUE = isEnseignant ? matieres : matieres.filter(m => m.ue_id === ue.id);
                  return (
                    <div key={ue.id} className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-info">{ue.code}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{ue.libelle}</span>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '38%' }}>Matière</th>
                            <th style={{ textAlign: 'center' }}>Coeff.</th>
                            <th style={{ textAlign: 'center' }}>Crédits</th>
                            <th style={{ textAlign: 'center' }}>CC (40%)</th>
                            <th style={{ textAlign: 'center' }}>Examen (60%)</th>
                            <th style={{ textAlign: 'center' }}>Rattrapage</th>
                            <th style={{ textAlign: 'center' }}>Moy. calculée</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matUE.map(mat => {
                            const cc = getLocal(mat.id, 'CC');
                            const ex = getLocal(mat.id, 'Examen');
                            const ratt = getLocal(mat.id, 'Rattrapage');

                            let moy = null;
                            const ccN = parseFloat(cc), exN = parseFloat(ex), rattN = parseFloat(ratt);
                            if (!isNaN(rattN)) moy = rattN;
                            else if (!isNaN(ccN) && !isNaN(exN)) moy = ccN * 0.4 + exN * 0.6;
                            else if (!isNaN(ccN)) moy = ccN;
                            else if (!isNaN(exN)) moy = exN;

                            return (
                              <tr key={mat.id}>
                                <td style={{ fontSize: 12 }}>{mat.libelle}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span style={{ background: 'var(--bg-secondary)', borderRadius: 5, padding: '2px 7px', fontSize: 12, fontWeight: 700 }}>{mat.coefficient}</span>
                                </td>
                                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{mat.credits}</td>
                                {['CC', 'Examen', 'Rattrapage'].map(type => {
                                  const val = type === 'CC' ? cc : type === 'Examen' ? ex : ratt;
                                  const isRatt = type === 'Rattrapage' && !isNaN(parseFloat(val));
                                  const hasExisting = notesMap[mat.id]?.[type];
                                  return (
                                    <td key={type} style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <NoteInput
                                          value={val}
                                          onChange={v => setLocal(mat.id, type, v)}
                                          onBlur={() => handleBlur(mat.id, type)}
                                        />
                                        {type === 'Rattrapage' && hasExisting && (
                                          <button
                                            onClick={() => deleteNote(mat.id, type)}
                                            disabled={saving[`${mat.id}-${type}`]}
                                            style={{
                                              background: 'var(--danger)',
                                              border: 'none',
                                              color: 'white',
                                              padding: '4px 8px',
                                              borderRadius: 4,
                                              cursor: 'pointer',
                                              fontSize: 12,
                                              fontWeight: 700,
                                              opacity: saving[`${mat.id}-${type}`] ? 0.6 : 1,
                                            }}
                                            title="Supprimer le rattrapage"
                                          >
                                            {saving[`${mat.id}-${type}`] ? '⏳' : '✕'}
                                          </button>
                                        )}
                                      </div>
                                      {/* Save on blur via wrapper div */}
                                      {isRatt && <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 1 }}>★ Remplace</div>}
                                    </td>
                                  );
                                })}
                                <td style={{ textAlign: 'center' }}>
                                  {moy !== null
                                    ? <span className={`mono ${gradeClass(moy)}`} style={{ fontSize: 14, fontWeight: 800 }}>{moy.toFixed(2)}</span>
                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={async () => {
                    if (!selectedEtu) return;
                    // Save all local notes in one batch per matière
                    setSaving({ global: true });
                    try {
                      for (const [k, v] of Object.entries(localNotes)) {
                        if (v === '' || v === null) continue;
                        const [mId, type] = k.split('-');
                        await evaluationsAPI.create({
                          etudiant_id: selectedEtu,
                          matiere_id: parseInt(mId),
                          notes: [{ type, note: parseFloat(v), date_saisie: new Date().toISOString().split('T')[0] }]
                        });
                      }
                      toast.success('Notes enregistrées avec succès');
                      setLocalNotes({});
                      await loadNotes(selectedEtu);
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Erreur enregistrement');
                    } finally { setSaving({}); }
                  }} disabled={saving.global || Object.keys(localNotes).length === 0}>
                    {saving.global ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Enregistrement…</> : '💾 Enregistrer toutes les notes'}
                  </button>
                  {Object.keys(localNotes).length > 0 && (
                    <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--warning)' }}>
                      ⚠️ {Object.keys(localNotes).length} modification(s) non enregistrée(s)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
