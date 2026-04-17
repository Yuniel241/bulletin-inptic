import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { juryAPI, bulletinsAPI, semestresAPI } from '../utils/api';
import { LoadingPage, ErrorBox, EmptyState, PageHeader } from '../components/UI';

function gradeClass(n) {
  if (n == null) return '';
  if (n >= 14) return 'grade-excellent';
  if (n >= 12) return 'grade-good';
  if (n >= 10) return 'grade-pass';
  return 'grade-fail';
}

function DecisionBadge({ decision }) {
  if (!decision) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const cls = decision === 'Diplômé(e)' ? 'badge-success' : decision.includes('soutenance') ? 'badge-warning' : 'badge-danger';
  return <span className={`badge ${cls}`}>{decision}</span>;
}

function EtudiantRow({ row }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const { identite, semestre_A: sA, semestre_B: sB, resultat_final: rf } = row;

  const loadDetail = async () => {
    if (!expanded && !detail) {
      try {
        // We already have everything from the recap endpoint
        setDetail(row);
      } catch { }
    }
    setExpanded(e => !e);
  };

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={loadDetail}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{identite?.nom?.[0]}{identite?.prenom?.[0]}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{identite?.nom} {identite?.prenom}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{identite?.matricule}</div>
            </div>
          </div>
        </td>
        <td>
          <div style={{ textAlign: 'center' }}>
            <div className={`mono ${gradeClass(sA?.moyenne)}`} style={{ fontWeight: 700, fontSize: 14 }}>{sA?.moyenne?.toFixed(2) ?? '—'}</div>
            <div style={{ fontSize: 10, color: sA?.valide ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {sA ? (sA.valide ? `✓ ${sA.credits} cr` : `✗ ${sA.credits}/30 cr`) : '—'}
            </div>
          </div>
        </td>
        <td>
          <div style={{ textAlign: 'center' }}>
            <div className={`mono ${gradeClass(sB?.moyenne)}`} style={{ fontWeight: 700, fontSize: 14 }}>{sB?.moyenne?.toFixed(2) ?? '—'}</div>
            <div style={{ fontSize: 10, color: sB?.valide ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {sB ? (sB.valide ? `✓ ${sB.credits} cr` : `✗ ${sB.credits}/30 cr`) : '—'}
            </div>
          </div>
        </td>
        <td style={{ textAlign: 'center' }}>
          <div className={`mono ${gradeClass(rf?.moyenne_annuelle)}`} style={{ fontWeight: 800, fontSize: 16 }}>{rf?.moyenne_annuelle?.toFixed(2) ?? '—'}</div>
          {rf?.mention && <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>{rf.mention}</div>}
        </td>
        <td><DecisionBadge decision={rf?.decision} /></td>
        <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0, background: 'var(--bg-secondary)' }}>
            <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[sA, sB].map((sem, i) => sem && (
                <div key={i}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>{sem.nom}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>Moyenne : <strong className={gradeClass(sem.moyenne)}>{sem.moyenne?.toFixed(2)}</strong></span>
                    <span>Crédits : <strong>{sem.credits}/30</strong></span>
                    <span className={`badge ${sem.valide ? 'badge-success' : 'badge-danger'}`}>{sem.valide ? 'Validé' : 'Non validé'}</span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ResultatsPage() {
  const { data: recap, loading, error } = useApi(() => juryAPI.recapitulatif());
  const [search, setSearch] = useState('');
  const [filterDec, setFilterDec] = useState('all');

  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const rows = recap?.data || [];
  const diplomes = rows.filter(r => r.resultat_final?.decision === 'Diplômé(e)').length;
  const reprise = rows.filter(r => r.resultat_final?.decision?.includes('soutenance')).length;

  const filtered = rows.filter(r => {
    const nm = `${r.identite?.nom} ${r.identite?.prenom}`.toLowerCase();
    const matchS = nm.includes(search.toLowerCase());
    const dec = r.resultat_final?.decision;
    const matchD = filterDec === 'all' ||
      (filterDec === 'diplome' && dec === 'Diplômé(e)') ||
      (filterDec === 'reprise' && dec?.includes('soutenance')) ||
      (filterDec === 'redouble' && dec?.includes('Redouble'));
    return matchS && matchD;
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Résultats & Jury"
        sub={`Promotion LP ASUR — ${recap?.annee_universitaire || ''}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-success">Diplômés : {diplomes}</span>
            <span className="badge badge-warning">Reprise : {reprise}</span>
            <span className="badge badge-danger">Redouble : {rows.length - diplomes - reprise}</span>
          </div>
        }
      />
      <div className="page-body">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="input" style={{ maxWidth: 280 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" style={{ maxWidth: 220 }} value={filterDec} onChange={e => setFilterDec(e.target.value)}>
            <option value="all">Toutes les décisions</option>
            <option value="diplome">Diplômé(e)</option>
            <option value="reprise">Reprise de soutenance</option>
            <option value="redouble">Redouble</option>
          </select>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th style={{ textAlign: 'center' }}>Semestre 5</th>
                <th style={{ textAlign: 'center' }}>Semestre 6</th>
                <th style={{ textAlign: 'center' }}>Moy. Annuelle</th>
                <th>Décision</th>
                <th style={{ textAlign: 'center' }}>Détail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => <EtudiantRow key={i} row={r} />)}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon="🎓" text="Aucun résultat disponible" />}
        </div>
      </div>
    </div>
  );
}
