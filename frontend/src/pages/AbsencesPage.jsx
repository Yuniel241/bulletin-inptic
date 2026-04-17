import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { etudiantsAPI, absencesAPI, semestresAPI, uesAPI, matieresAPI, configAPI } from '../utils/api';
import { LoadingPage, ErrorBox, PageHeader } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function AbsencesPage() {
  const { user } = useAuthStore();
  const role = user?.role?.nom?.toLowerCase();
  const canAccess = role === 'admin' || role === 'secretariat';

  const { data: etudiants, loading: loadEtu } = useApi(() => etudiantsAPI.list());
  const { data: semestres } = useApi(() => semestresAPI.list());
  const { data: ues } = useApi(() => uesAPI.list());
  const { data: allMatieres } = useApi(() => matieresAPI.list());
  const { data: config } = useApi(() => configAPI.get());

  const [selectedEtu, setSelectedEtu] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [absMap, setAbsMap] = useState({}); // { matiereId: { id, heures } }
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

  if (!canAccess) return <ErrorBox message="Accès non autorisé selon le rôle connecté." />;
  if (loadEtu) return <LoadingPage />;

  const semList = semestres || [];
  const matieres = allMatieres || [];
  const ueList = ues || [];
  const semUEs = ueList.filter(u => u.semestre_id === selectedSem);
  const etudiant = (etudiants || []).find(e => e.id === selectedEtu);
  const filtered = (etudiants || []).filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()));

  const getHeures = (mId) => {
    if (localAbs[mId] !== undefined) return Number(localAbs[mId]) || 0;
    return Number(absMap[mId]?.heures) || 0;
  };

  // Stats for selected semester
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
      // reload
      const res = await etudiantsAPI.absences(selectedEtu);
      const map = {};
      for (const ab of (res.data || [])) map[ab.matiere_id] = { id: ab.id, heures: ab.heures };
      setAbsMap(map);
      setLocalAbs({});
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Gestion des Absences"
        sub={`Pénalité : ${penalite} pt/heure d'absence`}
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
                {filtered.map(e => {
                  const totalH = Object.values({ ...Object.fromEntries(Object.entries(absMap).map(([k, v]) => [k, Number(v.heures) || 0])), ...Object.fromEntries(Object.entries(localAbs).map(([k, v]) => [k, Number(v) || 0])) }).reduce((s, h) => s + h, 0);
                  const eAbs = (etudiants || []).find(et => et.id === e.id);
                  return (
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
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {etudiant && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="stat-card warning">
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total absences (sem.)</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: totalHeures > 0 ? 'var(--warning)' : 'var(--text-primary)', marginTop: 4 }}>{totalHeures.toFixed(2)}h</div>
                  </div>
                  <div className="stat-card danger">
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pénalité cumulée</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: totalPenalite > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: 4 }}>-{totalPenalite.toFixed(2)} pts</div>
                  </div>
                </div>

                {semUEs.map(ue => {
                  const matUE = matieres.filter(m => m.ue_id === ue.id);
                  return (
                    <div key={ue.id} className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-info">{ue.code}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{ue.libelle}</span>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '45%' }}>Matière</th>
                            <th style={{ textAlign: 'center' }}>Heures d'absence</th>
                            <th style={{ textAlign: 'center' }}>Pénalité appliquée</th>
                            <th style={{ textAlign: 'center' }}>Justifiée</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matUE.map(mat => {
                            const h = getHeures(mat.id);
                            const pen = h * penalite;
                            return (
                              <tr key={mat.id}>
                                <td style={{ fontSize: 12 }}>{mat.libelle}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    className="note-input"
                                    type="number" min="0" step="1"
                                    value={h > 0 ? h : ''}
                                    placeholder="0"
                                    onChange={e => setLocalAbs(a => ({ ...a, [mat.id]: e.target.value }))}
                                    style={{ width: 70 }}
                                  />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {h > 0
                                    ? <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 13 }}>-{pen.toFixed(2)} pt</span>
                                    : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                  }
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <input type="checkbox" style={{ cursor: 'pointer' }} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                <button className="btn btn-primary" onClick={saveAll} disabled={saving || Object.keys(localAbs).length === 0}>
                  {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Enregistrement…</> : '💾 Enregistrer les absences'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
