import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { enseignantsAPI, matieresAPI } from '../utils/api';
import { LoadingPage, ErrorBox, EmptyState, ConfirmModal, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';

function EnseignantModal({ enseignant, matieres, onClose, onSaved }) {
  const [form, setForm] = useState(enseignant
    ? { nom: enseignant.nom, prenom: enseignant.prenom, numero: enseignant.numero, matiere_id: enseignant.matieres?.[0]?.id || '', role_id: 2 }
    : { nom: '', prenom: '', numero: '', matiere_id: '', role_id: 2 }
  );
  const [saving, setSaving] = useState(false);
  
  // Générer automatiquement le numéro enseignant au premier chargement
  useEffect(() => {
    if (!enseignant && !form.numero) {
      const randomNum = String(Math.floor(Math.random() * 9000) + 1000);
      setForm(f => ({ ...f, numero: `ENS${randomNum}` }));
    }
  }, []);
  
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const generateNewNumero = () => {
    const randomNum = String(Math.floor(Math.random() * 9000) + 1000);
    setForm(f => ({ ...f, numero: `ENS${randomNum}` }));
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const submitForm = {
        ...form,
        role_id: 2 // Enseignant
      };
      if (enseignant) {
        await enseignantsAPI.update(enseignant.id, submitForm);
        toast.success('Enseignant mis à jour');
      } else {
        const r = await enseignantsAPI.create(submitForm);
        toast.success(`Créé — email: ${r.data.email_genere}`);
      }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{enseignant ? 'Modifier' : 'Ajouter un enseignant'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nom</label>
                <input className="input" value={form.nom} onChange={e => s('nom', e.target.value)} placeholder="NOM" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Prénom(s)</label>
                <input className="input" value={form.prenom} onChange={e => s('prenom', e.target.value)} placeholder="Prénom" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <label className="form-label" style={{margin:0}}>Numéro enseignant</label>
                  {!enseignant && (
                    <button type="button" className="btn btn-ghost btn-icon" style={{padding:'0 4px',fontSize:11,height:'20px'}} onClick={generateNewNumero} title="Générer un nouveau numéro">🔄</button>
                  )}
                </div>
                <input className="input" value={form.numero} onChange={e => s('numero', e.target.value)} placeholder="ENS001" readOnly={!enseignant} style={{background: !enseignant ? 'var(--bg-secondary)' : undefined, cursor: !enseignant ? 'default' : 'text'}} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Matière principale</label>
                <select className="input" value={form.matiere_id} onChange={e => s('matiere_id', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                </select>
              </div>
            </div>
            {!enseignant && (
              <div className="alert" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent)', marginTop: 14, fontSize: 12 }}>
                 Email auto : prenom.nom@inptic.ga / Mot de passe : NOMPrenom
              </div>
            )}
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

function AttribuerMatiereModal({ enseignant, matieres, onClose, onSaved }) {
  const [matiereId, setMatiereId] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); if (!matiereId) return; setSaving(true);
    try {
      await enseignantsAPI.attribuerMatiere(enseignant.id, parseInt(matiereId));
      toast.success('Matière attribuée');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Attribuer une matière</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Enseignant : <strong>{enseignant.nom} {enseignant.prenom}</strong>
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Matière à attribuer</label>
              <select className="input" value={matiereId} onChange={e => setMatiereId(e.target.value)} required>
                <option value="">— Choisir une matière —</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle} ({m.ue?.code || ''})</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !matiereId}>{saving ? 'Attribution…' : 'Attribuer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EnseignantsPage() {
  const { data: enseignants, loading, error, refetch } = useApi(() => enseignantsAPI.list());
  const { data: matieres } = useApi(() => matieresAPI.list());
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [attribModal, setAttribModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const list = enseignants || [];
  const filtered = list.filter(e => `${e.nom} ${e.prenom} ${e.numero || ''}`.toLowerCase().includes(search.toLowerCase()));

  const del = async id => {
    try { 
      await enseignantsAPI.delete(id); 
      toast.success('Enseignant supprimé'); 
      refetch(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Erreur suppression'); 
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Enseignants"
        sub={`${list.length} enseignants enregistrés`}
        actions={<button className="btn btn-primary" onClick={() => setModal('add')}>+ Ajouter</button>}
      />
      <div className="page-body">
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <input className="input" style={{ maxWidth: 300 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Enseignant</th><th>N°</th><th>Email</th><th>Matières assignées</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {e.prenom?.[0]}{e.nom?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{e.nom} {e.prenom}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-muted">{e.numero || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.user?.email || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(e.matieres || []).map(m => (
                          <span key={m.id} className="badge badge-info" style={{ fontSize: 10 }}>{m.libelle}</span>
                        ))}
                        {(!e.matieres || e.matieres.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucune</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(e)} title="Modifier">✏️</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setAttribModal(e)} title="Attribuer matière">📚</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDel(e)} title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState icon="👨‍🏫" text="Aucun enseignant trouvé" />}
        </div>
      </div>

      {modal && <EnseignantModal enseignant={modal === 'add' ? null : modal} matieres={matieres || []} onClose={() => setModal(null)} onSaved={refetch} />}
      {attribModal && <AttribuerMatiereModal enseignant={attribModal} matieres={matieres || []} onClose={() => setAttribModal(null)} onSaved={refetch} />}
      {confirmDel && <ConfirmModal title="Supprimer l'enseignant" message={`Êtes-vous sûr de vouloir supprimer ${confirmDel.nom} ${confirmDel.prenom} ? Cette action est irréversible.`} onConfirm={() => { del(confirmDel.id); setConfirmDel(null); }} onClose={() => setConfirmDel(null)} danger={true}/>}
    </div>
  );
}
