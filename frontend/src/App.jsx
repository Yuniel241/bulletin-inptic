import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useUIStore } from './store/useStore';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EtudiantsPage from './pages/EtudiantsPage';
import EnseignantsPage from './pages/EnseignantsPage';
import MatieresPage from './pages/MatieresPage';
import NotesPage from './pages/NotesPage';
import ImportNotesPage from './pages/ImportNotesPage';
import AbsencesPage from './pages/AbsencesPage';
import ResultatsPage from './pages/ResultatsPage';
import BulletinsPage from './pages/BulletinsPage';
import UsersPage from './pages/UsersPage';
import ParametresPage from './pages/ParametresPage';
import SecretariatPage from './pages/SecretariatPage';

const PAGES = {
  dashboard: Dashboard,
  etudiants: EtudiantsPage,
  enseignants: EnseignantsPage,
  matieres: MatieresPage,
  notes: NotesPage,
  importNotes: ImportNotesPage,
  absences: AbsencesPage,
  resultats: ResultatsPage,
  bulletins: BulletinsPage,
  users: UsersPage,
  parametres: ParametresPage,
  secretariat: SecretariatPage,
};

const ALLOWED_PAGES = {
  admin: Object.keys(PAGES),
  enseignant: ['dashboard', 'notes', 'importNotes'],
  secretariat: ['dashboard', 'notes', 'absences', 'bulletins'],
  etudiant: ['dashboard', 'bulletins'],
};

export default function App() {
  const { user } = useAuthStore();
  const { activePage, setActivePage } = useUIStore();

  const role = user?.role?.nom?.toLowerCase() || 'etudiant';
  const allowed = ALLOWED_PAGES[role] || ALLOWED_PAGES.etudiant;

  // Hooks MUST be called before any conditional returns
  useEffect(() => {
    // Allow deep-linking for Puppeteer/exports: ?page=bulletins
    const p = new URLSearchParams(window.location.search).get('page');
    if (user && p && allowed.includes(p) && p !== activePage) {
      setActivePage(p);
    }
    if (user && !allowed.includes(activePage)) {
      setActivePage('dashboard');
    }
  }, [activePage, allowed, setActivePage, user]);

  // Guards can only come AFTER all hooks
  if (!user) return (
    <>
      <LoginPage />
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#0f172a', border: '1px solid #d6e0f5', fontSize: 13 } }} />
    </>
  );

  const PageComponent = PAGES[activePage] || Dashboard;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#0f172a', border: '1px solid #d6e0f5', fontSize: 13 } }} />
      <Sidebar />
      <main className="main-content">
        <PageComponent />
      </main>
    </div>
  );
}
