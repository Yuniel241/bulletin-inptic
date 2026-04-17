import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { configAPI, semestresAPI } from '../utils/api';
import { LoadingPage, ErrorBox, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';

export default function ParametresPage() {
  const { data: config, loading, error, refetch } = useApi(() => configAPI.get());
  const { data: semestres } = useApi(() => semestresAPI.list());

  const [form, setForm] = useState({ poids_cc: '0.40', poids_examen: '0.60', penalite_absence: '0.01' });
  const [directeur, setDirecteur] = useState(() => localStorage.getItem('directeur_etudes') || 'À compléter');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        poids_cc: config.poidsCC || '0.40',
        poids_examen: config.poidsExamen || '0.60',
        penalite_absence: config.penaliteParHeure || '0.01',
      });
    }
  }, [config]);

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const saveDirecteur = (value) => {
    setDirecteur(value);
    localStorage.setItem('directeur_etudes', value);
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const cc = parseFloat(form.poids_cc);
  const ex = parseFloat(form.poids_examen);
  const sumOK = Math.abs(cc + ex - 1) < 0.001;

  const save = async (e) => {
    e.preventDefault();
    if (!sumOK) { toast.error('La somme CC + Examen doit être égale à 1'); return; }
    setSaving(true);
    try {
      await configAPI.update(form);
      toast.success('Configuration mise à jour — recalcul en cours en arrière-plan');
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Paramètres système" sub="Configuration des règles de calcul et de validation" />
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

          {/* Calcul */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Règles de calcul des moyennes
            </div>
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Pondération Contrôle Continu (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input className="input" type="number" step="0.01" min="0" max="1" value={form.poids_cc} onChange={e => s('poids_cc', e.target.value)} style={{ maxWidth: 120 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>× 100 = {(parseFloat(form.poids_cc) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pondération Examen Final (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input className="input" type="number" step="0.01" min="0" max="1" value={form.poids_examen} onChange={e => s('poids_examen', e.target.value)} style={{ maxWidth: 120 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>× 100 = {(parseFloat(form.poids_examen) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pénalité d'absence (point/heure)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input className="input" type="number" step="0.001" min="0" max="1" value={form.penalite_absence} onChange={e => s('penalite_absence', e.target.value)} style={{ maxWidth: 120 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>pt/heure</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Directeur des Études et de la Pédagogie</label>
                <input className="input" type="text" placeholder="Nom du directeur" value={directeur} onChange={e => saveDirecteur(e.target.value)} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6, display: 'block' }}>✓ Ce nom est sauvegardé automatiquement et apparaît sur les bulletins de notes</span>
              </div>

              {!sumOK && (
                <div className="alert alert-error" style={{ marginBottom: 12 }}>
                  ⚠️ CC + Examen = {(cc + ex).toFixed(2)} ≠ 1.00
                </div>
              )}
              {sumOK && (
                <div className="alert alert-success" style={{ marginBottom: 12 }}>
                  ✓ CC ({(cc * 100).toFixed(0)}%) + Examen ({(ex * 100).toFixed(0)}%) = 100%
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={saving || !sumOK}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Enregistrement…</> : '💾 Enregistrer la configuration'}
              </button>
              {saving && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--warning)' }}>
                  ⚠️ Un recalcul global de toutes les moyennes est lancé en arrière-plan.
                </div>
              )}
            </form>
          </div>

          {/* Règles de validation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>📋 Règles de validation</div>
              {[
                ['Seuil de validation UE', '≥ 10 / 20'],
                ['Compensation UE', 'Moy. semestre ≥ 10 / 20'],
                ['Crédits requis S5', '30 crédits'],
                ['Crédits requis S6', '30 crédits'],
                ['Crédits pour diplôme', '60 crédits (S5 + S6)'],
                ['Reprise soutenance', 'Tous crédits acquis sauf UE6-2'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="badge badge-info">{value}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>🏅 Mentions annuelles</div>
              {[
                ['Très Bien', 'moyenne ≥ 16', 'badge-gold'],
                ['Bien', '14 ≤ moyenne < 16', 'badge-success'],
                ['Assez Bien', '12 ≤ moyenne < 14', 'badge-info'],
                ['Passable', '10 ≤ moyenne < 12', 'badge-warning'],
              ].map(([label, range, cls]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className={`badge ${cls}`}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Semestres */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>📅 Semestres configurés</div>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Libellé</th><th>Année universitaire</th></tr></thead>
              <tbody>
                {(semestres || []).map(s => (
                  <tr key={s.id}>
                    <td><span className="badge badge-muted">#{s.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{s.libelle}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.annee_universitaire}</td>
                  </tr>
                ))}
                {(!semestres || semestres.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun semestre</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* API info */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>🔌 Connexion API</div>
            {[
              ['URL Base', 'http://127.0.0.1:8000/api'],
              ['Backend', 'Laravel 11 (PHP 8.3)'],
              ['Auth', 'Sanctum — Bearer Token'],
              ['Base de données', 'MySQL 8.0'],
              ['Frontend', 'React 19 + Vite 8'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
