import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { uesAPI, matieresAPI, semestresAPI, enseignantsAPI } from '../utils/api';
import { LoadingPage, ErrorBox, EmptyState, ConfirmModal, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';

// ── UE Modal ──────────────────────────────────────────
function UEModal({ ue, semestres, onClose, onSaved }) {
  const [form, setForm] = useState(ue ? { code: ue.code, libelle: ue.libelle, semestre_id: ue.semestre_id } : { code: '', libelle: '', semestre_id: '' });
  const [saving, setSaving] = useState(false);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (ue) { await uesAPI.update(ue.id, form); toast.success('UE mise à jour'); }
      else { await uesAPI.create(form); toast.success('UE créée'); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{ue ? 'Modifier l\'UE' : 'Ajouter une UE'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button></div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Code UE</label>
              <input className="input" value={form.code} onChange={e => s('code', e.target.value)} placeholder="UE5-1" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Libellé</label>
              <input className="input" value={form.libelle} onChange={e => s('libelle', e.target.value)} placeholder="Enseignement Général" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Semestre</label>
              <select className="input" value={form.semestre_id} onChange={e => s('semestre_id', e.target.value)} required>
                <option value="">— Choisir —</option>
                {semestres.map(s => <option key={s.id} value={s.id}>{s.libelle} — {s.annee_universitaire}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Semestre Modal ────────────────────────────────────
function SemestreModal({ semestre, onClose, onSaved }) {
  const [form, setForm] = useState(semestre ? { libelle: semestre.libelle, annee_universitaire: semestre.annee_universitaire } : { libelle: '', annee_universitaire: '' });
  const [saving, setSaving] = useState(false);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (semestre) { await semestresAPI.update(semestre.id, form); toast.success('Semestre mise à jour'); }
      else { await semestresAPI.create(form); toast.success('Semestre créé'); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{semestre ? 'Modifier le semestre' : 'Ajouter un semestre'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button></div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Libellé</label>
              <input className="input" value={form.libelle} onChange={e => s('libelle', e.target.value)} placeholder="Semestre 1" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Année Universitaire</label>
              <input className="input" value={form.annee_universitaire} onChange={e => s('annee_universitaire', e.target.value)} placeholder="2024-2025" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Matiere Modal ─────────────────────────────────────
function MatiereModal({ matiere, semestres, ues, enseignants, onClose, onSaved }) {
  // Get UE object and semestre_id from it
  const matiereUE = matiere?.ue || ues.find(u => u.id === matiere?.ue_id);
  const materiereSemestreId = matiereUE?.semestre_id;
  
  const [form, setForm] = useState(matiere
    ? { code: matiere.code, libelle: matiere.libelle, coefficient: matiere.coefficient, credits: matiere.credits, semestre_id: materiereSemestreId ? String(materiereSemestreId) : '', ue_id: matiere.ue_id ? String(matiere.ue_id) : '', enseignant_id: matiere.enseignant_id ? String(matiere.enseignant_id) : '' }
    : { code: '', libelle: '', coefficient: 1, credits: 1, semestre_id: '', ue_id: '', enseignant_id: '' }
  );
  const [saving, setSaving] = useState(false);
  
  // Générer le code basé sur le libellé
  const generateCodeFromLibelle = (libelle) => {
    if (!libelle || libelle.trim().length === 0) return '';
    const prefix = libelle.trim().substring(0, 6).toUpperCase().replace(/\s+/g, '');
    const suffix = String(Math.floor(Math.random() * 900) + 100);
    return `${prefix}${suffix}`;
  };
  
  // Générer automatiquement le code au premier chargement ou quand le libellé change
  useEffect(() => {
    if (!matiere && form.libelle && !form.code) {
      setForm(f => ({ ...f, code: generateCodeFromLibelle(form.libelle) }));
    }
  }, [form.libelle]);

  // Réinitialiser l'UE si le semestre change et que l'UE sélectionnée n'est pas valide pour ce semestre
  useEffect(() => {
    if (form.semestre_id && form.ue_id) {
      const selectedUE = ues.find(u => String(u.id) === String(form.ue_id));
      if (selectedUE && String(selectedUE.semestre_id) !== String(form.semestre_id)) {
        setForm(f => ({ ...f, ue_id: '' }));
      }
    }
  }, [form.semestre_id, ues]);
  
  const s = (k, v) => {
    if (k === 'libelle' && !matiere) {
      setForm(f => ({ ...f, [k]: v, code: generateCodeFromLibelle(v) }));
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
  };
  
  const generateNewCode = () => {
    setForm(f => ({ ...f, code: generateCodeFromLibelle(form.libelle) }));
  };
  
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (matiere) { await matieresAPI.update(matiere.id, form); toast.success('Matière mise à jour'); }
      else { await matieresAPI.create(form); toast.success('Matière créée'); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{matiere ? 'Modifier la matière' : 'Ajouter une matière'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
                <label className="form-label">Libellé</label>
                <input className="input" value={form.libelle} onChange={e => s('libelle', e.target.value)} placeholder="Algorithmique et Python" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <label className="form-label" style={{margin:0}}>Code</label>
                  {!matiere && (
                    <button type="button" className="btn btn-ghost btn-icon" style={{padding:'0 4px',fontSize:11,height:'20px'}} onClick={generateNewCode} title="Générer un nouveau code">🔄</button>
                  )}
                </div>
                <input className="input" value={form.code} onChange={e => s('code', e.target.value)} placeholder="PROG101" required readOnly={!matiere} style={{background: !matiere ? 'var(--bg-secondary)' : undefined, cursor: !matiere ? 'default' : 'text'}} />
                {!matiere && form.libelle && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>🔤 Basé sur: "{form.libelle}"</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Coefficient</label>
                <input className="input" type="number" min="1" max="10" value={form.coefficient} onChange={e => s('coefficient', parseInt(e.target.value))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Crédits ECTS</label>
                <input className="input" type="number" min="1" max="20" value={form.credits} onChange={e => s('credits', parseInt(e.target.value))} required />
              </div>
              <div className='form-group' style={{ marginBottom: 0, gridColumn: '1/-1' }}>
                <label className="form-label">Semestre</label>
                <select className="input" value={form.semestre_id} onChange={e => s('semestre_id', e.target.value)} required>
                  <option value="">— Choisir —</option>
                  {semestres.map(s => <option key={s.id} value={String(s.id)}>{s.code} — {s.libelle}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">UE</label>
                <select className="input" value={form.ue_id} onChange={e => s('ue_id', e.target.value)} required disabled={!form.semestre_id}>
                  <option value="">— Choisir —</option>
                  {ues.filter(u => !form.semestre_id || String(u.semestre_id) === String(form.semestre_id)).map(u => <option key={u.id} value={String(u.id)}>{u.code} — {u.libelle}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
                <label className="form-label">Enseignant</label>
                <select className="input" value={form.enseignant_id} onChange={e => s('enseignant_id', e.target.value ? String(e.target.value) : '')}>
                  <option value="">— Aucun —</option>
                  {enseignants.map(en => <option key={en.id} value={String(en.id)}>{en.nom} {en.prenom}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MatieresPage() {
  const { data: ues, loading: loadUE, error: errUE, refetch: refetchUE } = useApi(() => uesAPI.list());
  const { data: matieres, loading: loadM, error: errM, refetch: refetchM } = useApi(() => matieresAPI.list());
  const { data: semestres, loading: loadS, error: errS, refetch: refetchS } = useApi(() => semestresAPI.list());
  const { data: enseignants } = useApi(() => enseignantsAPI.list());

  const [tab, setTab] = useState('matieres');
  const [search, setSearch] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState(null);
  const [modalUE, setModalUE] = useState(null);
  const [modalM, setModalM] = useState(null);
  const [modalS, setModalS] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  if (loadUE || loadM || loadS) return <LoadingPage />;
  if (errUE || errM || errS) return <ErrorBox message={errUE || errM || errS} />;

  const mList = matieres || [];
  const ueList = ues || [];
  const semList = semestres || [];

  const filteredM = mList.filter(m => {
    const ue = ueList.find(u => u.id === m.ue_id) || m.ue;
    const matchesSearch = `${m.libelle} ${m.code}`.toLowerCase().includes(search.toLowerCase());
    const matchesSem = !selectedSemFilter || ue?.semestre_id === selectedSemFilter;
    return matchesSearch && matchesSem;
  });
  const filteredUE = ueList.filter(u => `${u.libelle} ${u.code}`.toLowerCase().includes(search.toLowerCase()));
  const filteredS = semList.filter(s => `${s.libelle} ${s.annee_universitaire}`.toLowerCase().includes(search.toLowerCase()));

  const delUE = async id => {
    try { await uesAPI.delete(id); toast.success('UE supprimée'); refetchUE(); } catch { toast.error('Erreur'); }
  };
  const delM = async id => {
    try { await matieresAPI.delete(id); toast.success('Matière supprimée'); refetchM(); } catch { toast.error('Erreur'); }
  };
  const delS = async id => {
    try { await semestresAPI.delete(id); toast.success('Semestre supprimé'); refetchS(); } catch { toast.error('Erreur'); }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Matières & UE"
        sub="Référentiel pédagogique LP ASUR"
        actions={
          tab === 'semestres' ? (
            <button className="btn btn-primary" onClick={() => setModalS('add')}>+ Ajouter un semestre</button>
          ) : (
            <button className="btn btn-primary" onClick={() => tab === 'ues' ? setModalUE('add') : setModalM('add')}>
              + {tab === 'ues' ? 'Ajouter une UE' : 'Ajouter une matière'}
            </button>
          )
        }
      />
      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[['matieres', '📖 Matières'], ['ues', '📚 Unités d\'Enseignement'], ['semestres', '📅 Semestres']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="btn" style={{
              background: tab === id ? 'white' : 'transparent',
              color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: tab === id ? 'var(--shadow-sm)' : 'none',
              fontWeight: tab === id ? 700 : 500, fontSize: 13
            }}>{label}</button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <input className="input" style={{ maxWidth: 300 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Matières table */}
        {tab === 'matieres' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 80 }}>Filtrer par:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSelectedSemFilter(null)}
                  className="btn"
                  style={{
                    background: selectedSemFilter === null ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: selectedSemFilter === null ? 'white' : 'var(--text-primary)',
                    fontSize: 12,
                    padding: '6px 12px',
                  }}
                >
                  Tous les semestres
                </button>
                {semList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSemFilter(s.id)}
                    className="btn"
                    style={{
                      background: selectedSemFilter === s.id ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: selectedSemFilter === s.id ? 'white' : 'var(--text-primary)',
                      fontSize: 12,
                      padding: '6px 12px',
                    }}
                  >
                    {s.libelle}
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>Code</th><th>Libellé</th><th>UE</th><th>Semestre</th><th style={{ textAlign: 'center' }}>Coeff.</th><th style={{ textAlign: 'center' }}>Crédits</th><th>Enseignant</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredM.reduce((acc, m, idx) => {
                  const ue = ueList.find(u => u.id === m.ue_id) || m.ue;
                  const semester = semList.find(s => s.id === ue?.semestre_id);
                  const prevM = idx > 0 ? filteredM[idx - 1] : null;
                  const prevUE = prevM ? (ueList.find(u => u.id === prevM.ue_id) || prevM.ue) : null;
                  const showUEHeader = !prevUE || prevUE.id !== ue?.id;
                  
                  if (showUEHeader) {
                    acc.push(
                      <tr key={`ue-${ue?.id}`} style={{ background: 'var(--bg-secondary)', fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                        <td style={{ padding: '6px 12px' }}>
                          <span className="badge badge-info" style={{ fontSize: 11 }}>{ue?.code}</span>
                        </td>
                        <td style={{ padding: '6px 12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 12 }}>{ue?.libelle}</span>
                        </td>
                        <td colSpan={6} style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {semester?.libelle}</span>
                        </td>
                      </tr>
                    );
                  }
                  
                  acc.push(
                    <tr key={m.id}>
                      <td><span className="mono badge badge-muted" style={{ fontSize: 11 }}>{m.code}</span></td>
                      <td style={{ fontWeight: 500 }}>{m.libelle}</td>
                      <td><span className="badge badge-info">{ue?.code || '—'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{semester?.libelle || `S${ue?.semestre_id}` || '?'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 700 }}>{m.coefficient}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{m.credits} cr.</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {m.enseignant ? `${m.enseignant.name || m.enseignant.nom || ''}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalM(m)}>✏️</button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDel({ type: 'matiere', item: m })}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                  return acc;
                }, [])}
              </tbody>
            </table>
            {filteredM.length === 0 && <EmptyState icon="📖" text="Aucune matière trouvée" />}
          </div>
          </>
        )}

        {/* UEs table */}
        {tab === 'ues' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>Code</th><th>Libellé</th><th>Semestre</th><th>Matières</th><th>Crédits total</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUE.map(ue => {
                  const matUE = mList.filter(m => m.ue_id === ue.id);
                  const totalCredits = matUE.reduce((s, m) => s + m.credits, 0);
                  return (
                    <tr key={ue.id}>
                      <td><span className="badge badge-info">{ue.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{ue.libelle}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {(semestres || []).find(s => s.id === ue.semestre_id)?.libelle || `Semestre ${ue.semestre_id}`}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {matUE.slice(0, 3).map(m => <span key={m.id} className="badge badge-muted" style={{ fontSize: 10 }}>{m.code || m.libelle.slice(0, 12)}</span>)}
                          {matUE.length > 3 && <span className="badge badge-muted" style={{ fontSize: 10 }}>+{matUE.length - 3}</span>}
                          {matUE.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucune</span>}
                        </div>
                      </td>
                      <td><span className="badge badge-success">{totalCredits} crédits</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalUE(ue)}>✏️</button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDel({ type: 'ue', item: ue })}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUE.length === 0 && <EmptyState icon="📚" text="Aucune UE trouvée" />}
          </div>
        )}

        {/* Semestres table */}
        {tab === 'semestres' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>Libellé</th><th>Année Universitaire</th><th>UEs</th><th>Matières</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredS.map(sem => {
                  const uesOfSem = ueList.filter(u => u.semestre_id === sem.id);
                  const matiereOfSem = mList.filter(m => uesOfSem.some(u => u.id === m.ue_id));
                  const totalCredits = matiereOfSem.reduce((s, m) => s + m.credits, 0);
                  return (
                    <tr key={sem.id}>
                      <td style={{ fontWeight: 600 }}>{sem.libelle}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sem.annee_universitaire}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: 12 }}>{uesOfSem.length} UE{uesOfSem.length > 1 ? 's' : ''}</span>
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ fontSize: 12 }}>{matiereOfSem.length} matière{matiereOfSem.length > 1 ? 's' : ''} ({totalCredits} cr.)</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalS(sem)}>✏️</button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDel({ type: 'semestre', item: sem })}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredS.length === 0 && <EmptyState icon="📅" text="Aucun semestre trouvé" />}
          </div>
        )}
      </div>

      {modalUE && <UEModal ue={modalUE === 'add' ? null : modalUE} semestres={semList} onClose={() => setModalUE(null)} onSaved={refetchUE} />}
      {modalM && <MatiereModal matiere={modalM === 'add' ? null : modalM} semestres={semList} ues={ueList} enseignants={enseignants || []} onClose={() => setModalM(null)} onSaved={refetchM} />}
      {modalS && <SemestreModal semestre={modalS === 'add' ? null : modalS} onClose={() => setModalS(null)} onSaved={refetchS} />}
      {confirmDel && (
        <ConfirmModal
          title={`Supprimer ${confirmDel.type === 'ue' ? 'l\'UE' : confirmDel.type === 'semestre' ? 'le semestre' : 'la matière'}`}
          message={`Confirmer la suppression de "${confirmDel.item.libelle}" ?`}
          danger={true}
          onConfirm={() => confirmDel.type === 'ue' ? delUE(confirmDel.item.id) : confirmDel.type === 'semestre' ? delS(confirmDel.item.id) : delM(confirmDel.item.id)}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
