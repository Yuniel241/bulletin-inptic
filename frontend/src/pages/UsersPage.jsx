import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { usersAPI } from '../utils/api';
import { LoadingPage, ErrorBox, EmptyState, ConfirmModal, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';

const ROLES = [
  { id: 1, nom: 'admin', label: 'Administrateur', color: 'var(--gold)' },
  { id: 2, nom: 'enseignant', label: 'Enseignant', color: 'var(--accent)' },
  { id: 3, nom: 'secrétariat', label: 'Secrétariat', color: 'var(--success)' },
  { id: 4, nom: 'etudiant', label: 'Étudiant', color: 'var(--text-muted)' },
];

const ROLES_CREATE = ROLES.filter(r => r.nom === 'admin' || r.nom === 'secretariat');

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(user
    ? { name: user.name, email: user.email, role_id: user.role?.id || 2 }
    : { name: '', email: '', password: '', password_confirmation: '', role_id: 3 }
  );
  const [saving, setSaving] = useState(false);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (user) { await usersAPI.update(user.id, form); toast.success('Utilisateur mis à jour'); }
      else { await usersAPI.create(form); toast.success('Utilisateur créé'); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{user ? 'Modifier l\'utilisateur' : 'Créer un compte'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nom complet</label>
              <input className="input" value={form.name} onChange={e => s('name', e.target.value)} placeholder="Prénom NOM" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Adresse email</label>
              <input className="input" type="email" value={form.email} onChange={e => s('email', e.target.value)} placeholder="nom@inptic.ga" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rôle</label>
              <select className="input" value={form.role_id} onChange={e => s('role_id', parseInt(e.target.value))}>
                {(user ? ROLES : ROLES_CREATE).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            {!user && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mot de passe</label>
                  <input className="input" type="password" value={form.password} onChange={e => s('password', e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input className="input" type="password" value={form.password_confirmation} onChange={e => s('password_confirmation', e.target.value)} placeholder="••••••••" required />
                </div>
              </>
            )}
            {!user && (
              <div className="alert" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e', fontSize: 12 }}>
                ⚠️ Les comptes <strong>Étudiant</strong> et <strong>Enseignant</strong> sont créés via les pages dédiées (Étudiants / Enseignants) conformément à l’API.
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

export default function UsersPage() {
  const { data, loading, error, refetch } = useApi(() => usersAPI.list());
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const users = data || [];
  const filtered = users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const del = async id => {
    try { 
      await usersAPI.delete(id); 
      toast.success('Utilisateur supprimé'); 
      refetch(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Erreur suppression'); 
    }
  };

  const getRoleInfo = (role) => {
    if (!role) return ROLES[3];
    if (typeof role === 'number') return ROLES.find(r => r.id === role) || ROLES[3];
    return ROLES.find(r => r.nom === role?.nom || r.id === role?.id) || ROLES[3];
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Utilisateurs"
        sub={`${users.length} comptes enregistrés`}
        actions={<button className="btn btn-primary" onClick={() => setModal('add')}>+ Créer un compte</button>}
      />
      <div className="page-body">
        <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <input className="input" style={{ maxWidth: 300 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead>
                <tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Matières</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const ri = getRoleInfo(u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                            {u.name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ri.color, background: `${ri.color}18`, padding: '3px 10px', borderRadius: 20 }}>
                          {ri.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(u.matieres || []).slice(0, 2).map(m => <span key={m.id} className="badge badge-info" style={{ fontSize: 10 }}>{m.libelle}</span>)}
                          {(u.matieres || []).length > 2 && <span className="badge badge-muted" style={{ fontSize: 10 }}>+{u.matieres.length - 2}</span>}
                          {(!u.matieres || u.matieres.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(u)} title="Modifier">✏️</button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDel(u)} title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState icon="👤" text="Aucun utilisateur trouvé" />}
        </div>

        {/* Permissions matrix */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Matrice des droits d'accès</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fonctionnalité</th>
                  <th style={{ textAlign: 'center' }}>Administrateur</th>
                  <th style={{ textAlign: 'center' }}>Enseignant</th>
                  <th style={{ textAlign: 'center' }}>Secrétariat</th>
                  <th style={{ textAlign: 'center' }}>Étudiant</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tableau de bord', true, true, true, true],
                  ['Gérer les étudiants', true, false, true, false],
                  ['Gérer les enseignants', true, false, true, false],
                  ['Matières & UE', true, false, true, false],
                  ['Saisir les notes', true, true, false, false],
                  ['Gérer les absences', true, false, true, false],
                  ['Résultats & Jury', true, false, true, false],
                  ['Générer les bulletins', true, false, false, true],
                  ['Gérer les utilisateurs', true, false, false, false],
                  ['Paramètres système', true, false, true, false],
                  ['Consulter ses notes', false, false, false, true],
                ].map(([feat, ...perms]) => (
                  <tr key={feat}>
                    <td style={{ fontSize: 13 }}>{feat}</td>
                    {perms.map((p, i) => (
                      <td key={i} style={{ textAlign: 'center' }}>
                        {p
                          ? <span style={{ color: 'var(--success)', fontSize: 16 }}>✅</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && <UserModal user={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={refetch} />}
      {confirmDel && (
        <ConfirmModal
          title="Supprimer l'utilisateur"
          message={`Êtes-vous sûr de vouloir supprimer le compte de ${confirmDel.name} (${confirmDel.email}) ? Cette action est irréversible.`}
          onConfirm={() => { del(confirmDel.id); setConfirmDel(null); }}
          onClose={() => setConfirmDel(null)}
          danger={true}
        />
      )}
    </div>
  );
}
