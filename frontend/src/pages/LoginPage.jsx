import { useState } from 'react';
import { useAuthStore } from '../store/useStore';
import logo from '../assets/inptic-logo.png';

export default function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email.trim()) {
      setLocalError('Veuillez entrer votre adresse email');
      return;
    }
    
    if (!validateEmail(email)) {
      setLocalError('Format email invalide');
      return;
    }
    
    if (!password) {
      setLocalError('Veuillez entrer votre mot de passe');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Mot de passe trop court');
      return;
    }

    await login(email, password);
  };

  const DEMOS = [
    { label: 'Admin', email: 'admin@inptic.ga', password: 'Admin2026', color: 'var(--gold)' },
    { label: 'Enseignant', email: 'enseignant.nom@inptic.ga', password: 'NOMEnseignant', color: 'var(--accent)' },
    { label: 'Secrétariat', email: 'secretariat@inptic.ga', password: 'Secretariat2026', color: 'var(--success)' },
    { label: 'Étudiant', email: 'jean-pierre.obame@inptic.ga', password: 'OBAMEJean-Pierre', color: 'var(--text-muted)' },
  ];

  const displayError = localError || error;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.35s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
            <img src={logo} alt="INPTIC" style={{ height: 54, objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Institut National de la Poste, des TIC
          </div>
          <h1 style={{ marginTop: 18, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Gestion des <span style={{ color: 'var(--accent)' }}>Bulletins de Notes</span>
          </h1>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>LP ASUR — Année 2025/2026</div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input 
                className="input" 
                type="email" 
                placeholder="votre@email.ga" 
                value={email} 
                onChange={e => { setEmail(e.target.value); setLocalError(''); }} 
                required 
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}> {/* Conteneur pour positionner le bouton */}
                <input 
                  className="input" 
                  type={showPassword ? "text" : "password"} // Type dynamique
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => { setPassword(e.target.value); setLocalError(''); }} 
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>
            {displayError && (
              <div className="alert alert-error" style={{ marginBottom: 14 }}>
                ⚠️ {displayError}
              </div>
            )}
            <button 
              className="btn btn-primary" 
              type="submit" 
              style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14 }} 
              disabled={loading || !email || !password}
            >
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Connexion…</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 16, padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Comptes de démonstration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {DEMOS.map(d => (
              <button 
                key={d.email} 
                onClick={() => { setEmail(d.email); setPassword(d.password); setLocalError(''); }} 
                className="btn btn-ghost btn-sm" 
                style={{ justifyContent: 'flex-start', gap: 6 }}
                type="button"
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
