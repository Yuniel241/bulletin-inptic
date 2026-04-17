import { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { enseignantsAPI, matieresAPI, uesAPI, semestresAPI } from '../utils/api';
import { LoadingPage, ErrorBox, PageHeader } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function ImportNotesPage() {
  const { user } = useAuthStore();
  const role = user?.role?.nom?.toLowerCase();
  const canAccess = role === 'admin' || role === 'enseignant';

  const { data, loading, error, refetch } = useApi(() => {
    if (role === 'enseignant') return enseignantsAPI.mesMatieres();
    return matieresAPI.list();
  }, [role]);

  const { data: uesData } = useApi(() => uesAPI.list(), []);
  const { data: semestresData } = useApi(() => semestresAPI.list(), []);

  const matieres = useMemo(() => {
    if (role === 'enseignant') return data?.data || [];
    return data || [];
  }, [data, role]);

  const ues = useMemo(() => {
    return Array.isArray(uesData) ? uesData : (uesData?.data || []);
  }, [uesData]);

  const semestres = useMemo(() => {
    return Array.isArray(semestresData) ? semestresData : (semestresData?.data || []);
  }, [semestresData]);

  // Mappings pour la cascade
  const semestreMap = new Map();
  const uesBySemestre = new Map();
  semestres.forEach(sem => semestreMap.set(sem.id, sem));
  ues.forEach(ue => {
    if (!uesBySemestre.has(ue.semestre_id)) {
      uesBySemestre.set(ue.semestre_id, []);
    }
    uesBySemestre.get(ue.semestre_id).push(ue);
  });

  const [semestresId, setSemestresId] = useState('');
  const [ueId, setUeId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Filtrer les UEs selon le semestre sélectionné
  const uesFiltrees = useMemo(() => {
    if (!semestresId) return ues;
    return uesBySemestre.get(parseInt(semestresId)) || [];
  }, [ues, semestresId, uesBySemestre]);

  // Filtrer les matières selon l'UE sélectionnée
  const matieresFiltrees = useMemo(() => {
    if (!ueId) return matieres;
    return matieres.filter(m => m.ue_id === parseInt(ueId));
  }, [matieres, ueId]);

  const selectedMatiere = matieresFiltrees.find(m => m.id === parseInt(matiereId));
  const fileSize = file ? (file.size / 1024).toFixed(2) : 0;

  if (!canAccess) return <ErrorBox message="Accès non autorisé selon le rôle connecté." />;
  if (loading) return <LoadingPage />;
  if (error) return <ErrorBox message={error} />;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (['.csv', '.xlsx', '.xls'].some(ext => dropped.name.toLowerCase().endsWith(ext))) {
        setFile(dropped);
      } else {
        toast.error('Format de fichier non supporté (CSV ou Excel uniquement)');
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!semestresId || !ueId || !matiereId || !file) {
      toast.error('Sélectionnez un semestre, une UE, une matière et un fichier');
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      
      console.log('Envoi du fichier:', { fileName: file.name, fileSize: file.size, matiereId });

      const res = await matieresAPI.import(parseInt(matiereId), form);
      setResult(res.data);
      toast.success(res.data?.message || 'Import terminé avec succès');
      setFile(null);
      refetch();
    } catch (err) {
      console.error('Erreur import:', err.response?.data);
      toast.error(err.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Importation des notes"
        sub="Importer CC/Examen en une seule fois par matière (CSV ou Excel)"
      />
      <div className="page-body">
        {/* Format guide */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📋 Format attendu</div>
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            Votre fichier doit contenir 3 colonnes : <strong>nom_prenom</strong>, <strong>note_cc</strong>, <strong>note_examen</strong>
          </div>
          <pre style={{ margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto' }}>
{`nom_prenom,note_cc,note_examen
OBAME Jean-Pierre,14.50,7.50
DUPONT Marie,16.00,18.50
MARTIN Michel,13.25,12.75`}
          </pre>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            ✓ Valeurs entre 0 et 20 · ✓ Séparateur : virgule · ✓ Décimal : point
          </div>
        </div>

        {/* Upload form */}
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
            {/* Semestre selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Semestre</label>
              <select 
                className="input" 
                value={semestresId} 
                onChange={(e) => {
                  setSemestresId(e.target.value);
                  setUeId(''); // Réinitialiser l'UE
                  setMatiereId(''); // Réinitialiser la matière
                }} 
                disabled={uploading}
                style={{ fontSize: 13 }}
              >
                <option value="">— Sélectionnez un semestre —</option>
                {semestres.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.libelle}
                  </option>
                ))}
              </select>
            </div>

            {/* UE selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unité d'Enseignement (UE)</label>
              <select 
                className="input" 
                value={ueId} 
                onChange={(e) => {
                  setUeId(e.target.value);
                  setMatiereId(''); // Réinitialiser la matière sélectionnée
                }} 
                disabled={uploading || !semestresId}
                style={{ fontSize: 13 }}
              >
                <option value="">— {semestresId ? 'Sélectionnez une UE' : 'Sélectionnez un semestre d\'abord'} —</option>
                {uesFiltrees.map((ue) => (
                  <option key={ue.id} value={ue.id}>
                    {ue.code} — {ue.libelle}
                  </option>
                ))}
              </select>
            </div>

            {/* Matière selector (filtrée par UE) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Matière à importer</label>
              <select 
                className="input" 
                value={matiereId} 
                onChange={(e) => setMatiereId(e.target.value)} 
                disabled={uploading || !ueId}
                required
                style={{ fontSize: 13 }}
              >
                <option value="">— {ueId ? 'Sélectionnez une matière' : 'Sélectionnez une UE d\'abord'} —</option>
                {matieresFiltrees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.libelle}
                  </option>
                ))}
              </select>
              {selectedMatiere && (
                <div style={{ marginTop: 8, padding: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, fontSize: 12 }}>
                  ✓ {selectedMatiere.libelle} (Coeff. {selectedMatiere.coefficient})
                </div>
              )}
            </div>

            {/* File upload with drag-drop */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fichier (CSV ou Excel)</label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 10,
                  padding: 24,
                  textAlign: 'center',
                  background: dragActive ? 'rgba(59,130,246,0.05)' : 'var(--bg-secondary)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  {file ? (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{fileSize} KB</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Glissez votre fichier ici</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ou cliquez pour parcourir</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={uploading || !semestresId || !ueId || !matiereId || !file}
                style={{ minWidth: 160 }}
              >
                {uploading ? (
                  <><div className="spinner" style={{ width: 14, height: 14 }} /> Traitement…</>
                ) : (
                  '🚀 Importer'
                )}
              </button>
              <button 
                className="btn btn-secondary" 
                type="button" 
                onClick={() => { setFile(null); setResult(null); setSemestresId(''); setUeId(''); setMatiereId(''); }}
                disabled={uploading}
              >
                Réinitialiser
              </button>
            </div>
          </form>

          {/* Results */}
          {result && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div className="alert" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#065f46', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ {result.message || 'Import terminé'}</div>
                {result.importes && (
                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    {result.importes} étudiant(s) importé(s) avec succès
                  </div>
                )}
              </div>
              
              {Array.isArray(result.erreurs) && result.erreurs.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>⚠️ {result.erreurs.length} ligne(s) avec erreur</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {result.erreurs.map((e, i) => (
                      <li key={i} style={{ marginBottom: 4, color: '#991b1b' }}>
                        {String(e)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

