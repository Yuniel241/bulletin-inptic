import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { etudiantsAPI, evaluationsAPI, absencesAPI, semestresAPI, uesAPI, matieresAPI, bulletinsAPI, configAPI } from '../utils/api';
import { LoadingPage, ErrorBox, PageHeader } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

// ============================================
// HELPER: Build notes map from evaluations
// ============================================
function buildNotesMap(evals) {
  const map = {};
  for (const ev of (evals || [])) {
    if (!map[ev.matiere_id]) map[ev.matiere_id] = {};
    map[ev.matiere_id][ev.type] = { id: ev.id, note: ev.note };
  }
  return map;
}

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

// ============================================
// TAB 1: Saisie des Notes (comme NotesPage)
// ============================================
function SaisieNotesTab() {
  const { data: etudiantsData, loading: loadEtu } = useApi(() => etudiantsAPI.list());
  const { data: semestres, loading: loadSem } = useApi(() => semestresAPI.list());
  const { data: ues } = useApi(() => uesAPI.list());
  const { data: allMatieres } = useApi(() => matieresAPI.list());

  const [selectedEtu, setSelectedEtu] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [notesMap, setNotesMap] = useState({});
  const [saving, setSaving] = useState({});
  const [search, setSearch] = useState('');
  const [localNotes, setLocalNotes] = useState({});

  const semList = semestres || [];
  const matieres = allMatieres || [];
  const ueList = ues || [];
  const etudiants = etudiantsData || [];

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

  if (loadEtu || loadSem) return <LoadingPage />;

  const semUEs = ueList.filter(u => u.semestre_id === selectedSem);
  const etudiant = etudiants.find(e => e.id === selectedEtu);
  const filtered = etudiants.filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()));
  const semMatieres = matieres.filter(m => semUEs.some(u => u.id === m.ue_id));

  const saveNote = async (matiereId, type, value) => {
    if (!selectedEtu || value === '') return;
    const key = `${matiereId}-${type}`;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await evaluationsAPI.create({
        etudiant_id: selectedEtu,
        matiere_id: matiereId,
        notes: [{ type, note: parseFloat(value), date_saisie: new Date().toISOString().split('T')[0] }]
      });
      await loadNotes(selectedEtu);
      toast.success(`Note ${type} enregistrée`);
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
      await loadNotes(selectedEtu);
      toast.success('Note supprimée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
      {/* Sidebar - Sélection d'étudiant */}
      <div style={{ width: 220, flexShrink: 0, background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
          <input className="input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(e => (
            <button key={e.id} onClick={() => { setSelectedEtu(e.id); setSelectedSem(semestres?.[0]?.id); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px',
              background: selectedEtu === e.id ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
              borderLeft: selectedEtu === e.id ? '3px solid var(--accent)' : '3px solid transparent',
            }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{e.prenom?.[0]}{e.nom?.[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nom}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.prenom}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main - Saisie des notes */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedEtu && etudiant ? (
          <>
            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {etudiant.nom} {etudiant.prenom}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {semList.map(s => (
                  <button key={s.id} className={`btn ${selectedSem === s.id ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setSelectedSem(s.id)} style={{ fontSize: 11 }}>
                    {s.libelle}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 8, padding: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: '#f5f5f5' }}>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Matière</th>
                    <th style={{ padding: 8, textAlign: 'center', fontWeight: 600 }}>CC</th>
                    <th style={{ padding: 8, textAlign: 'center', fontWeight: 600 }}>Examen</th>
                    <th style={{ padding: 8, textAlign: 'center', fontWeight: 600 }}>Rattrapage</th>
                  </tr>
                </thead>
                <tbody>
                  {semMatieres.map(mat => (
                    <tr key={mat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 8, fontSize: '9pt' }}>
                        <div style={{ fontWeight: 500 }}>{mat.code}</div>
                        <div style={{ fontSize: '8pt', color: 'var(--text-muted)' }}>{mat.libelle}</div>
                      </td>
                      {['CC', 'Examen', 'Rattrapage'].map(type => {
                        const val = localNotes[`${mat.id}-${type}`] ?? notesMap[mat.id]?.[type]?.note ?? '';
                        const isSaving = saving[`${mat.id}-${type}`];
                        return (
                          <td key={type} style={{ padding: 8, textAlign: 'center' }}>
                            <NoteInput value={val} onChange={v => setLocalNotes(n => ({ ...n, [`${mat.id}-${type}`]: v }))}
                              onBlur={() => {
                                if (val !== '' && val !== (notesMap[mat.id]?.[type]?.note ?? '')) saveNote(mat.id, type, val);
                              }} />
                            {val && val !== (notesMap[mat.id]?.[type]?.note ?? '') && (
                              <button onClick={() => deleteNote(mat.id, type)} disabled={isSaving} style={{ marginLeft: 4, fontSize: '10px', padding: '2px 4px' }} className="btn btn-ghost">🗑</button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Sélectionnez un étudiant</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 2: Gestion des Absences (comme AbsencesPage)
// ============================================
function GestionAbsencesTab() {
  const { data: etudiants, loading: loadEtu } = useApi(() => etudiantsAPI.list());
  const { data: semestres } = useApi(() => semestresAPI.list());
  const { data: ues } = useApi(() => uesAPI.list());
  const { data: allMatieres } = useApi(() => matieresAPI.list());
  const { data: config } = useApi(() => configAPI.get());

  const [selectedEtu, setSelectedEtu] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [absMap, setAbsMap] = useState({});
  const [localAbs, setLocalAbs] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const penalite = parseFloat(config?.penaliteParHeure || 0.01);

  useEffect(() => {
    if (etudiants?.length && !selectedEtu) setSelectedEtu(etudiants[0].id);
    if (semestres?.length && !selectedSem) setSelectedSem(semestres[0]?.id);
  }, [etudiants, semestres]);

  useEffect(() => {
    if (!selectedEtu) return;
    etudiantsAPI.absences(selectedEtu).then(res => {
      const map = {};
      for (const ab of (res.data || [])) map[ab.matiere_id] = { id: ab.id, heures: ab.heures };
      setAbsMap(map);
      setLocalAbs({});
    }).catch(() => {});
  }, [selectedEtu]);

  if (loadEtu) return <LoadingPage />;

  const semList = semestres || [];
  const matieres = allMatieres || [];
  const ueList = ues || [];
  const semUEs = ueList.filter(u => u.semestre_id === selectedSem);
  const etudiant = etudiants?.find(e => e.id === selectedEtu);
  const filtered = etudiants?.filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase())) || [];

  const getHeures = (mId) => {
    if (localAbs[mId] !== undefined) return Number(localAbs[mId]) || 0;
    return Number(absMap[mId]?.heures) || 0;
  };

  const semMatieres = matieres.filter(m => semUEs.some(u => u.id === m.ue_id));
  const totalHeures = semMatieres.reduce((s, m) => s + getHeures(m.id), 0);
  const totalPenalite = semMatieres.reduce((s, m) => s + (getHeures(m.id) * penalite), 0);

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [mId, heures] of Object.entries(localAbs)) {
        const h = parseInt(heures) || 0;
        const existing = absMap[parseInt(mId)];
        if (existing) {
          await absencesAPI.update(existing.id, { heures: h });
        } else if (h > 0) {
          await absencesAPI.create({ etudiant_id: selectedEtu, matiere_id: parseInt(mId), heures: h });
        }
      }
      toast.success('Absences enregistrées');
      const res = await etudiantsAPI.absences(selectedEtu);
      const map = {};
      for (const ab of (res.data || [])) map[ab.matiere_id] = { id: ab.id, heures: ab.heures };
      setAbsMap(map);
      setLocalAbs({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
          <input className="input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(e => (
            <button key={e.id} onClick={() => { setSelectedEtu(e.id); setSelectedSem(semestres?.[0]?.id); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px',
              background: selectedEtu === e.id ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
              borderLeft: selectedEtu === e.id ? '3px solid var(--accent)' : '3px solid transparent',
            }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{e.prenom?.[0]}{e.nom?.[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{e.nom}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.prenom}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedEtu && etudiant ? (
          <>
            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {etudiant.nom} {etudiant.prenom}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {semList.map(s => (
                  <button key={s.id} className={`btn ${selectedSem === s.id ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setSelectedSem(s.id)} style={{ fontSize: 11 }}>
                    {s.libelle}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 8, padding: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: '#f5f5f5' }}>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Matière</th>
                    <th style={{ padding: 8, textAlign: 'center', fontWeight: 600 }}>Heures</th>
                  </tr>
                </thead>
                <tbody>
                  {semMatieres.map(mat => (
                    <tr key={mat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 8 }}>
                        <div style={{ fontWeight: 500 }}>{mat.code}</div>
                        <div style={{ fontSize: '8pt', color: 'var(--text-muted)' }}>{mat.libelle}</div>
                      </td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        <input type="number" min="0" step="0.5" placeholder="0"
                          value={localAbs[mat.id] ?? absMap[mat.id]?.heures ?? ''}
                          onChange={e => setLocalAbs(a => ({ ...a, [mat.id]: e.target.value }))}
                          style={{ width: 60, padding: 4, textAlign: 'center' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'white', padding: 12, borderRadius: 4, marginBottom: 12, fontSize: '9pt' }}>
                <div style={{ marginBottom: 6 }}><strong>Total heures:</strong> {totalHeures.toFixed(1)}h</div>
                <div><strong>Pénalité:</strong> -{totalPenalite.toFixed(2)} pts (@ {penalite}/h)</div>
              </div>

              <button className="btn btn-primary" onClick={saveAll} disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Enregistrement…' : '💾 Enregistrer absences'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Sélectionnez un étudiant</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 3: Édition des Bulletins (comme BulletinsPage)
// ============================================
function EditionBulletinsTab() {
  const { data: etudiants, loading: loadEtu } = useApi(() => etudiantsAPI.list());
  const { data: semestres } = useApi(() => semestresAPI.list());

  const [selectedEtu, setSelectedEtu] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [search, setSearch] = useState('');

  const { data: bulletin, loading: loadBulletin } = useApi(async () => {
    if (!selectedEtu || !selectedSem) return null;
    try {
      const res = await bulletinsAPI.semestre(selectedEtu, selectedSem);
      return res.data.data;
    } catch (e) {
      return null;
    }
  }, [selectedEtu, selectedSem]);

  useEffect(() => {
    if (etudiants?.length && !selectedEtu) setSelectedEtu(etudiants[0].id);
  }, [etudiants]);

  if (loadEtu) return <LoadingPage />;

  const filtered = (etudiants || []).filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()));
  const etudiant = etudiants?.find(e => e.id === selectedEtu);

  const handlePrint = () => window.print();

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
          <input className="input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(e => (
            <button key={e.id} onClick={() => { setSelectedEtu(e.id); setSelectedSem(null); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px',
              background: selectedEtu === e.id ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
              borderLeft: selectedEtu === e.id ? '3px solid var(--accent)' : '3px solid transparent',
            }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{e.prenom?.[0]}{e.nom?.[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{e.nom}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.prenom}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedEtu && etudiant ? (
          <>
            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {etudiant.nom} {etudiant.prenom}
                </div>
                {selectedSem && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {semestres?.find(s => s.id === selectedSem)?.libelle}
                  </div>
                )}
              </div>
              {selectedSem && <button className="btn btn-primary" onClick={handlePrint} style={{ fontSize: 11 }}>🖨️ Imprimer</button>}
            </div>

            {!selectedSem ? (
              <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, overflowY: 'auto' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Sélectionnez un semestre</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                  {(semestres || []).map(s => (
                    <button key={s.id} className="btn btn-secondary" onClick={() => setSelectedSem(s.id)} style={{ fontSize: 11 }}>
                      {s.libelle}
                    </button>
                  ))}
                </div>
              </div>
            ) : loadBulletin ? (
              <LoadingPage />
            ) : bulletin ? (
              <div id={`bulletin-${selectedSem}`} style={{ flex: 1, background: 'white', borderRadius: 8, padding: 16, overflowY: 'auto', color: '#111', fontSize: '10pt', fontFamily: 'Arial' }}>
                <div style={{ marginBottom: 12, textAlign: 'center', paddingBottom: 12, borderBottom: '1px solid #333' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 'bold' }}>Bulletin de Notes</h3>
                  <p style={{ margin: 0, fontSize: 9, color: '#666' }}>
                    {semestres?.find(s => s.id === selectedSem)?.libelle}
                  </p>
                </div>

                <div style={{ marginBottom: 12, fontSize: '9pt' }}>
                  <div style={{ marginBottom: 4 }}><strong>Nom:</strong> {bulletin.identite?.nom}</div>
                  <div><strong>Prénom:</strong> {bulletin.identite?.prenom}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: '#e0e7ff', borderBottom: '1px solid #333' }}>
                      <th style={{ border: '1px solid #333', padding: 6, textAlign: 'left' }}>UE / Matière</th>
                      <th style={{ border: '1px solid #333', padding: 6, textAlign: 'center' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bulletin.resultats_detailles || []).map((ueRes, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ border: '1px solid #333', padding: 6 }}>
                          <span style={{ fontWeight: 'bold' }}>{ueRes.ue?.code}</span> — {ueRes.ue?.libelle}
                        </td>
                        <td style={{ border: '1px solid #333', padding: 6, textAlign: 'center', fontWeight: 'bold', color: ueRes.moyenne >= 10 ? '#1a7a4a' : '#c0392b' }}>
                          {Number(ueRes.moyenne).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'center', fontSize: '9pt', paddingTop: 8, borderTop: '1px solid #333' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Moyenne: {Number(bulletin.bilan?.moyenne).toFixed(2)}</div>
                  <div>Rang: {bulletin.bilan?.rang || 'N/A'}</div>
                  <div>{bulletin.bilan?.valide ? '✓ Acquis' : '✗ Non acquis'}</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--danger)', paddingTop: 40 }}>Bulletin non disponible</div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Sélectionnez un étudiant</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SecretariatPage() {
  const { user } = useAuthStore();
  const role = user?.role?.nom?.toLowerCase();
  const canAccess = role === 'admin' || role === 'secretariat';

  const [activeTab, setActiveTab] = useState('notes');

  if (!canAccess) {
    return <ErrorBox message="Accès réservé au secrétariat et administrateurs" />;
  }

  const tabs = [
    { id: 'notes', label: 'Saisie des notes', icon: '✏️' },
    { id: 'absences', label: 'Gestion des absences', icon: '📋' },
    { id: 'bulletins', label: 'Édition des bulletins', icon: '📄' },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Secrétariat Pédagogique"
        sub="Saisie des notes, gestion des absences, édition des bulletins"
      />
      <div className="page-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontSize: 12 }}
            >
              <span style={{ marginRight: 4 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'notes' && <SaisieNotesTab />}
        {activeTab === 'absences' && <GestionAbsencesTab />}
        {activeTab === 'bulletins' && <EditionBulletinsTab />}
      </div>
    </div>
  );
}
