import { useAuthStore } from '../store/useStore';
import { useUIStore } from '../store/useStore';
import logo from '../assets/inptic-logo.png';
import toast from 'react-hot-toast';

const MENU = {
  admin: [
    { id: 'dashboard', label: 'Tableau de bord', icon: '⊞' },
    { id: 'etudiants', label: 'Étudiants', icon: '👥' },
    { id: 'enseignants', label: 'Enseignants', icon: '👨‍🏫' },
    { id: 'matieres', label: 'Matières | UE | Semestres', icon: '📚' },
    { id: 'notes', label: 'Saisie des notes', icon: '✏️' },
    { id: 'importNotes', label: 'Import notes (CSV)', icon: '⤓' },
    { id: 'absences', label: 'Absences', icon: '📋' },
    { id: 'resultats', label: 'Résultats & Jury', icon: '🎓' },
    { id: 'bulletins', label: 'Bulletins', icon: '📄' },
    { id: 'users', label: 'Utilisateurs', icon: '👤' },
    { id: 'parametres', label: 'Paramètres', icon: '⚙️' },
  ],
  enseignant: [
    { id: 'dashboard', label: 'Tableau de bord', icon: '⊞' },
    { id: 'notes', label: 'Mes matières & notes', icon: '✏️' },
    { id: 'importNotes', label: 'Import notes (CSV)', icon: '⤓' },
  ],
  secretariat: [
    { id: 'dashboard', label: 'Tableau de bord', icon: '⊞' },
    { id: 'notes', label: 'Saisie des notes', icon: '✏️' },
    { id: 'absences', label: 'Gestion des absences', icon: '📋' },
    { id: 'bulletins', label: 'Bulletins', icon: '📄' },
  ],
  etudiant: [
    { id: 'dashboard', label: 'Mon Tableau de bord', icon: '⊞' },
    { id: 'bulletins', label: 'Mes Bulletins', icon: '📄' },
  ],
};

const ROLE_INFO = {
  admin: { label: 'Administrateur', color: 'var(--gold)' },
  enseignant: { label: 'Enseignant', color: 'var(--accent)' },
  secretariat: { label: 'Secrétariat', color: 'var(--success)' },
  etudiant: { label: 'Étudiant', color: 'var(--text-muted)' },
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { activePage, setActivePage } = useUIStore();

  const role = user?.role?.nom?.toLowerCase() || 'etudiant';
  const items = MENU[role] || MENU.etudiant;
  const roleInfo = ROLE_INFO[role] || {};

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="sidebar">
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} alt="INPTIC" style={{ height: 34, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.2 }}>INPTIC</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>LP ASUR</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px 8px' }}>
          Navigation
        </div>
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
            style={{ width: '100%', marginBottom: 1, background: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px' }}>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
            {user?.name?.split(' ').map(w => w[0]).slice(0,2).join('')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: roleInfo.color, fontWeight: 600 }}>{roleInfo.label}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Déconnexion" style={{ flexShrink: 0, fontSize: 14 }}>⏻</button>
        </div>
      </div>
    </div>
  );
}
