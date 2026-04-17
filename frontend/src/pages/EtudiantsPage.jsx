import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { etudiantsAPI } from '../utils/api';
import { LoadingPage, ErrorBox, EmptyState, ConfirmModal, PageHeader } from '../components/UI';
import toast from 'react-hot-toast';
// Données du Gabon
const BACS = ['Bac A', 'Bac C', 'Bac D', 'Bac E', 'Bac G', 'Bac L', 'Bac S', 'Bac STT'];
const VILLES_GABON = ['Libreville', 'Port-Gentil', 'Franciville', 'Lambaréné', 'Mouila', 'Oyem', 'Bitam', 'Gamba', 'Cocobeach', 'Makokou', 'Tchibanga', 'Akébé'];
const ETABLISSEMENTS = ['Lycée Technique Léon Mba', 'Lycée Bessieux', 'Lycée Camille Saint-Saëns', 'Lycée Blaise Pascal', 'Collège Montesquieu', 'Institution Jeunesse', 'Lycée La Pérouse'];
function EtudiantModal({ etudiant, onClose, onSaved }) {
  const [form, setForm] = useState(etudiant || { nom:'',prenom:'',matricule:'',date_naissance:'',lieu_naissance:'',bac:'',provenance:'' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [customBac, setCustomBac] = useState(etudiant && !BACS.includes(etudiant.bac) ? etudiant.bac : '');
  const [customVille, setCustomVille] = useState(etudiant && !VILLES_GABON.includes(etudiant.lieu_naissance) ? etudiant.lieu_naissance : '');
  const [customProvenance, setCustomProvenance] = useState(etudiant && !ETABLISSEMENTS.includes(etudiant.provenance) ? etudiant.provenance : '');
  
  // Générer automatiquement le matricule au premier chargement
  useEffect(() => {
    if (!etudiant && !form.matricule) {
      const currentYear = new Date().getFullYear();
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setForm(f => ({ ...f, matricule: `INPTIC-${currentYear}-${randomNum}` }));
    }
  }, []);
  
  const s = (k,v) => {
    setForm(f=>({...f,[k]:v}));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };
  
  const validate = () => {
    const newErrors = {};
    if (!form.nom?.trim()) newErrors.nom = 'Nom requis';
    if (!form.prenom?.trim()) newErrors.prenom = 'Prénom requis';
    if (!form.matricule?.trim() && !etudiant) newErrors.matricule = 'Matricule requis';
    return newErrors;
  };

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      const submitForm = {
        ...form,
        bac: form.bac === 'custom' ? customBac : form.bac,
        lieu_naissance: form.lieu_naissance === 'custom' ? customVille : form.lieu_naissance,
        provenance: form.provenance === 'custom' ? customProvenance : form.provenance
      };
      if (etudiant) { 
        await etudiantsAPI.update(etudiant.id, submitForm); 
        toast.success('Étudiant mis à jour'); 
      }
      else { 
        const r = await etudiantsAPI.create(submitForm); 
        toast.success(`Créé — email: ${r.data.email_genere}`); 
      }
      onSaved(); 
      onClose();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde'); 
    }
    finally { 
      setSaving(false); 
    }
  };
  
  const generateNewMatricule = () => {
    const currentYear = new Date().getFullYear();
    const randomNum = String(Math.floor(Math.random() * 900) + 100);
    setForm(f => ({ ...f, matricule: `INPTIC-${currentYear}-${randomNum}` }));
  };
  
  const F = [
    {k:'nom',l:'Nom',p:'NOM',r:true},
    {k:'prenom',l:'Prénom',p:'Prénom',r:true},
    {k:'matricule',l:'Matricule',p:'INPTIC-2026-001',r:!etudiant},
    {k:'date_naissance',l:'Date naissance',t:'date'},
    {k:'lieu_naissance',l:'Lieu naissance',p:'Ville',hybrid:true,opts:VILLES_GABON,customState:[customVille,setCustomVille]},
    {k:'bac',l:'Bac',p:'Bac',hybrid:true,opts:BACS,customState:[customBac,setCustomBac]},
    {k:'provenance',l:'Établissement origine',p:'Lycée…',full:true,hybrid:true,opts:ETABLISSEMENTS,customState:[customProvenance,setCustomProvenance]}
  ];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{margin:0,fontSize:15,fontWeight:700}}>{etudiant?'Modifier':'Ajouter un étudiant'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {F.map(f=>(
                <div key={f.k} className="form-group" style={{gridColumn:f.full?'1/-1':'auto',marginBottom:0}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <label className="form-label" style={{margin:0}}>{f.l} {f.r && '*'}</label>
                    {f.k === 'matricule' && !etudiant && (
                      <button type="button" className="btn btn-ghost btn-icon" style={{padding:'0 4px',fontSize:11,height:'20px'}} onClick={generateNewMatricule} title="Générer un nouveau matricule">🔄</button>
                    )}
                  </div>
                  {f.hybrid ? (
                    <>
                      <select 
                        className="input" 
                        value={form[f.k]} 
                        onChange={e => s(f.k, e.target.value)}
                        style={{borderColor: errors[f.k] ? 'var(--danger)' : undefined}}
                      >
                        <option value="">— Choisir —</option>
                        {f.opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="custom">➕ Saisir une autre valeur…</option>
                      </select>
                      {form[f.k] === 'custom' && (
                        <input 
                          className="input" 
                          type="text" 
                          placeholder={f.p}
                          value={f.customState[0]}
                          onChange={e => f.customState[1](e.target.value)}
                          style={{marginTop:6,borderColor: errors[f.k] ? 'var(--danger)' : undefined}}
                        />
                      )}
                    </>
                  ) : (
                    <input 
                      className="input" 
                      type={f.t||'text'} 
                      placeholder={f.p} 
                      value={form[f.k]||''} 
                      onChange={e=>s(f.k,e.target.value)} 
                      required={f.r}
                      readOnly={f.k === 'matricule' && !etudiant}
                      style={{borderColor: errors[f.k] ? 'var(--danger)' : undefined, background: f.k === 'matricule' && !etudiant ? 'var(--bg-secondary)' : undefined, cursor: f.k === 'matricule' && !etudiant ? 'default' : 'text'}}
                    />
                  )}
                  {errors[f.k] && <div style={{fontSize:11,color:'var(--danger)',marginTop:4}}>{errors[f.k]}</div>}
                </div>
              ))}
            </div>
            {!etudiant&&<div className="alert" style={{background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.2)',color:'var(--accent)',marginTop:14,fontSize:12}}>ℹ️ Email auto-généré : prenom.nom@inptic.ga / Mot de passe : NOMPrenom</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Enregistrement…':'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EtudiantsPage() {
  const {data,loading,error,refetch} = useApi(()=>etudiantsAPI.list());
  const [search,setSearch] = useState('');
  const [modal,setModal] = useState(null);
  const [confirmDel,setConfirmDel] = useState(null);
  
  if(loading) return <LoadingPage/>;
  if(error) return <ErrorBox message={error}/>;
  
  const etudiants = data||[];
  const filtered = etudiants.filter(e=>`${e.nom} ${e.prenom} ${e.matricule||''}`.toLowerCase().includes(search.toLowerCase()));
  
  const del = async id => { 
    try { 
      await etudiantsAPI.delete(id); 
      toast.success('Étudiant supprimé'); 
      refetch(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression'); 
    }
  };
  
  return (
    <div className="fade-in">
      <PageHeader title="Étudiants" sub={`${etudiants.length} inscrits`} actions={<button className="btn btn-primary" onClick={()=>setModal('add')}>+ Ajouter</button>}/>
      <div className="page-body">
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <input className="input" style={{maxWidth:300}} placeholder="🔍 Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Étudiant</th><th>Matricule</th><th>Naissance</th><th>Bac</th><th>Provenance</th><th>Email</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((e,i)=>(
                  <tr key={e.id}>
                    <td style={{color:'var(--text-muted)',fontSize:12}}>{i+1}</td>
                    <td><div style={{display:'flex',alignItems:'center',gap:9}}><div className="avatar" style={{width:30,height:30,fontSize:11}}>{e.prenom?.[0]}{e.nom?.[0]}</div><div><div style={{fontWeight:600,fontSize:13}}>{e.nom} {e.prenom}</div></div></div></td>
                    <td><span className="badge badge-muted">{e.matricule||'—'}</span></td>
                    <td style={{fontSize:12,color:'var(--text-secondary)'}}>{e.date_naissance||'—'} · {e.lieu_naissance||'—'}</td>
                    <td><span className="badge badge-info">{e.bac||'—'}</span></td>
                    <td style={{fontSize:12,color:'var(--text-secondary)',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.provenance||'—'}</td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{e.user?.email||'—'}</td>
                    <td><div style={{display:'flex',gap:4}}><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(e)} title="Modifier">✏️</button><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setConfirmDel(e)} title="Supprimer">🗑️</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length===0&&<EmptyState icon="👥" text="Aucun étudiant trouvé"/>}
        </div>
      </div>
      {modal&&<EtudiantModal etudiant={modal==='add'?null:modal} onClose={()=>setModal(null)} onSaved={refetch}/>}
      {confirmDel&&<ConfirmModal title="Supprimer l'étudiant" message={`Êtes-vous sûr de vouloir supprimer ${confirmDel.nom} ${confirmDel.prenom} ? Cette action est irréversible.`} onConfirm={()=>{ del(confirmDel.id); setConfirmDel(null); }} onClose={()=>setConfirmDel(null)} danger={true}/>}
    </div>
  );
}
