import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { etudiantsAPI, bulletinsAPI, semestresAPI, etudiantsAPI as etuAPI, configAPI, statsAPI } from '../utils/api';
import { LoadingPage, ErrorBox, EmptyState, PageHeader } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import logo from '../assets/inptic-logo.png';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';

function fmt(n) { return n != null ? Number(n).toFixed(2) : '—'; }

function mentionFromMoyenne(m) {
  const v = Number(m);
  if (Number.isNaN(v)) return '—';
  if (v >= 16) return 'Très Bien';
  if (v >= 14) return 'Bien';
  if (v >= 12) return 'Assez Bien';
  if (v >= 10) return 'Passable';
  return 'Néant';
}

function BulletinSheet({ identite, resultats_detailles, bilan, semLabel, notes, absences, config, rootId, directeur = 'À compléter', matiereStats = {}, ueeStats = {} }) {
  const penalite = Number(config?.penaliteParHeure ?? 0.01);
  
  // Utiliser la moyenne du bilan (venant du backend) ou calculer depuis les UE
  const moyenneSemestre = bilan?.moyenne || (resultats_detailles?.length > 0 
    ? resultats_detailles.reduce((sum, ue) => sum + (ue.moyenne || 0), 0) / resultats_detailles.length
    : null);

  const notesByCode = new Map(
    (notes?.details_par_matiere || [])
      .filter(Boolean)
      .map((d) => [d.code, d])
  );

  const absByMatiereId = new Map(
    (absences || [])
      .filter(Boolean)
      .map((a) => [a.matiere_id, a])
  );

  const totalAbsH = (resultats_detailles || []).reduce((sum, ueRes) => {
    const mats = ueRes.ue?.matieres || [];
    return sum + mats.reduce((s2, m) => s2 + (Number(absByMatiereId.get(m.id)?.heures) || 0), 0);
  }, 0);

  // Date du jour pour la signature
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id={rootId} className="bulletin-sheet" style={{ background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', padding: '10px', maxWidth: '800px', margin: '0 auto' }}>
      {/* EN-TÊTE AVEC LOGO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
        <div style={{ fontSize: '9pt', lineHeight: 1.2, flex: 1 }}>
          <strong>INSTITUT NATIONAL DE LA POSTE,</strong><br />
          <strong>DES TECHNOLOGIES DE L'INFORMATION</strong><br />
          <strong>ET DE LA COMMUNICATION</strong><br />
          <span style={{ fontSize: '8pt' }}>DIRECTION DES ETUDES ET DE LA PÉDAGOGIE</span>
        </div>
        <img src={logo} alt="INPTIC" style={{ height: '35px', width: 'auto' }} />
        <div style={{ fontSize: '9pt', textAlign: 'right', lineHeight: 1.2, flex: 1 }}>
          <strong>RÉPUBLIQUE GABONAISE</strong><br />
          — — — — — — — — — —<br />
          Union - Travail - Justice<br />
          — — — — — — — — — —
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1.5px solid #333', margin: '4px 0' }} />

      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '4px 0 2px' }}>
        Bulletin de notes du {semLabel}
      </h2>
      <p style={{ textAlign: 'center', fontSize: '9.5pt', margin: '0 0 8px' }}>
        Année universitaire : 2025/2026
      </p>

      {/* IDENTIFICATION */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9.5pt', border: '2px solid #333' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', width: '30%', fontWeight: 'bold', background: '#f2f2f2' }}>Nom(s) et Prénom(s)</td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold' }}>
              {identite?.nom} {identite?.prenom}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2' }}>Date et lieu de naissance</td>
            <td style={{ border: '1px solid #333', padding: '3px 6px' }}>
              {identite?.date_naissance && identite?.lieu_naissance
                ? `Né(e) le ${new Date(identite.date_naissance).toLocaleDateString('fr-FR')} à ${identite.lieu_naissance}`
                : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* TABLEAU DES UE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <thead>
          <tr style={{ background: '#e0e7ff' }}>
            <th style={{ border: '1px solid #333', padding: '3px 4px', textAlign: 'left' }}></th>
            <th style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center' }}>Crédits</th>
            <th style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center' }}>Coeff</th>
            <th style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center' }}>Note étud.</th>
            <th style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center' }}>Moy. classe</th>
          </tr>
        </thead>
        <tbody>
          {resultats_detailles?.length > 0 ? [...resultats_detailles].sort((a, b) => {
            const aUe = a.ue;
            const bUe = b.ue;
            // Trier d'abord par semestre_id, puis par id de l'UE
            if (aUe?.semestre_id !== bUe?.semestre_id) {
              return (aUe?.semestre_id || 0) - (bUe?.semestre_id || 0);
            }
            return (aUe?.id || 0) - (bUe?.id || 0);
          }).map(ueRes => {
            const ue = ueRes.ue;
            const moyUE = ueRes.moyenne;
            const totalCred = (ue?.matieres || []).reduce((s, m) => s + (Number(m.credits) || 0), 0);
            const totalCoeff = (ue?.matieres || []).reduce((s, m) => s + (Number(m.coefficient) || 0), 0);
            return [
              <tr key={ue?.id + '-head'} style={{ background: '#dce8fd' }}>
                <td colSpan={5} style={{ border: '1px solid #333', padding: '2px 4px', fontWeight: 'bold', fontSize: '8.5pt' }}>
                  {ue?.code} : {ue?.libelle?.toUpperCase()}
                </td>
              </tr>,
              ...[...(ue?.matieres || [])].sort((a, b) => (a.id || 0) - (b.id || 0)).map(mat => (
                <tr key={mat.id}>
                  <td style={{ border: '1px solid #333', padding: '2px 6px', fontSize: '8.5pt' }}>{mat.libelle}</td>
                  <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontSize: '8.5pt' }}>{mat.credits}</td>
                  <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontSize: '8.5pt' }}>{Number(mat.coefficient).toFixed(2)}</td>
                  <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5pt' }}>
                    {(() => {
                      const d = notesByCode.get(mat.code);
                      return d?.moyenne_finale != null ? Number(d.moyenne_finale).toFixed(2) : '—';
                    })()}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', color: '#555', fontSize: '8.5pt' }}>
                    {matiereStats?.[String(mat.id)]?.avg != null
                      ? Number(matiereStats[String(mat.id)].avg).toFixed(2)
                      : '—'}
                  </td>
                </tr>
              )),
              <tr key={ue?.id + '-moy'} style={{ background: '#f8f8f8', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #333', padding: '2px 4px', textAlign: 'right', fontSize: '8.5pt' }}>Moy {ue?.code}</td>
                <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontSize: '8.5pt' }}>{totalCred}</td>
                <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontSize: '8.5pt' }}>{totalCoeff.toFixed(2)}</td>
                <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontSize: '10pt', color: moyUE >= 10 ? '#1a7a4a' : '#c0392b' }}>
                  {fmt(moyUE)}
                </td>
                <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', color: '#555', fontSize: '8.5pt' }}>
                  {ueeStats?.[String(ue?.id)]?.avg != null
                    ? Number(ueeStats[String(ue?.id)].avg).toFixed(2)
                    : '—'}
                </td>
              </tr>
            ];
          }) : (
            <tr><td colSpan={5} style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', fontSize: '9pt' }}>Aucune donnée disponible</td></tr>
          )}
        </tbody>
      </table>

      {/* PÉNALITÉS D'ABSENCES */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', background: '#fff3cd', fontWeight: 'bold', color: '#856404', fontSize: '9pt' }}>
              Pénalités d'absences — {penalite.toFixed(2).replace('.', ',')} pt/h
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', color: '#856404', fontSize: '9pt' }}>
              {totalAbsH} heure{totalAbsH !== 1 ? 's' : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* MOYENNE DU SEMESTRE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2', width: '50%', fontSize: '9pt' }}>
              Moyenne {semLabel}
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', color: (moyenneSemestre ?? bilan?.moyenne ?? 0) >= 10 ? '#1a7a4a' : '#c0392b' }}>
              {fmt(moyenneSemestre ?? bilan?.moyenne)}
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', color: '#555' }}>
              {fmt(bilan?.moyenne_classe)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* RANG ET MENTION */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2', width: '50%', fontSize: '9pt' }}>
              Rang au {semLabel}
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'center', fontSize: '9pt' }}>
              {bilan?.rang || bilan?.rank || 'Non classé'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2', fontSize: '9pt' }}>
              Mention
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'center', fontSize: '9pt' }}>
              {bilan?.mention || mentionFromMoyenne(bilan?.moyenne ?? moyenneSemestre)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ÉTAT DE VALIDATION DES CRÉDITS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <thead>
          <tr style={{ background: '#e0e7ff' }}>
            <th colSpan={3} style={{ border: '1px solid #333', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5pt' }}>
              État Validation Crédits {semLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ textAlign: 'center', background: '#f9f9f9' }}>
            <td style={{ border: '1px solid #333', padding: '3px 4px', fontWeight: 'bold', fontSize: '8.5pt' }}>
              {resultats_detailles?.filter(ue => ue.moyenne >= 10).length || 0} UE validée{resultats_detailles?.filter(ue => ue.moyenne >= 10).length !== 1 ? 's' : ''}
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 4px', fontWeight: 'bold', fontSize: '8.5pt', lineHeight: 1.2 }}>
              Crédits acquis<br />
              {bilan?.credits_acquis || 0}/{bilan?.credits_total || 30}
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 4px', fontWeight: 'bold', fontSize: '8.5pt' }}>
              {bilan?.acquis_par_compensation ? 'Semestre Acquis par Compensation' : 'Semestre Acquis'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* DÉCISION DU JURY */}
      <div style={{ borderTop: '1.5px solid #333', paddingTop: '6px', marginTop: '2px' }}>
        <p style={{ margin: '2px 0', fontSize: '10pt' }}>
          <strong>Décision du Jury : </strong>
          <span style={{ fontWeight: 'bold', color: bilan?.valide ? '#1a7a4a' : '#c0392b' }}>
            {bilan?.valide ? `${semLabel} validé` : `${semLabel} non validé`}
          </span>
        </p>
        <p style={{ marginTop: '8px', textAlign: 'right', fontStyle: 'italic', fontSize: '9pt', margin: '4px 0' }}>
          Fait à Libreville, le {dateStr}
        </p>
        <p style={{ textAlign: 'right', marginTop: '2px', fontSize: '9pt' }}>
          <strong>Le Directeur des Études et de la Pédagogie</strong><br />
          <span style={{ borderBottom: '1px solid #333', paddingBottom: '1px', display: 'inline-block', minWidth: '100px', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{directeur}</span>
        </p>
      </div>
    </div>
  );
}

function BulletinView({ etudiant, semestreId, semestres }) {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState(null);
  const [absences, setAbsences] = useState(null);
  const [config, setConfig] = useState(null);
  const [semStats, setSemStats] = useState(null);
  const [matiereStats, setMatiereStats] = useState({});
  const [ueeStats, setUeeStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null); setData(null); setNotes(null); setAbsences(null); setConfig(null); setSemStats(null); setMatiereStats({}); setUeeStats({});
    if (!etudiant?.id || !semestreId) { setLoading(false); return; }
    Promise.all([
      bulletinsAPI.semestre(etudiant.id, semestreId),
      etuAPI.notes(etudiant.id),
      etuAPI.absences(etudiant.id),
      configAPI.get().catch(() => ({ data: null })),
      statsAPI.semestre(semestreId).catch(() => ({ data: null })),
    ])
      .then(async ([bRes, nRes, aRes, cRes, sRes]) => {
        setData(bRes.data.data);
        setNotes(nRes.data);
        setAbsences(aRes.data);
        setConfig(cRes?.data || null);
        setSemStats(sRes?.data || null);
        
        // Stats globales du semestre (matières et UEs avg/min/max)
        setMatiereStats(sRes?.data?.stats?.matieres || {});
        setUeeStats(sRes?.data?.stats?.ues || {});
        setLoading(false);
      })
      .catch(e => { setError(e.response?.data?.message || 'Erreur chargement bulletin'); setLoading(false); });
  }, [etudiant?.id, semestreId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement du bulletin…</div>;
  if (error) return <div style={{ padding: 20, color: 'var(--danger)', fontSize: 13 }}>⚠️ {error}</div>;
  if (!data) return null;

  const { identite, resultats_detailles, bilan, semestre } = data;
  const semLabel = semestre?.libelle || semestres?.find(s => s.id === semestreId)?.libelle || `Semestre ${semestreId}`;

  // Règle métier: si une UE n'est pas acquise (moyenne < 10), le semestre n'est pas acquis.
  const allUEAcquises = (resultats_detailles || []).every(ue => Number(ue.moyenne) >= 10);

  // Restructuration du bilan pour correspondre au front
  const bilanStructured = {
    moyenne: bilan?.moyenne,
    rang: bilan?.rang,
    mention: bilan?.mention,
    valide: Boolean(bilan?.valide) && allUEAcquises,
    credits_acquis: bilan?.credits_obtenus,
    credits_total: 30,
    moyenne_classe: semStats?.stats?.general?.avg ?? bilan?.moyenne_classe,
    acquis_par_compensation: false, // À calculer si nécessaire
  };

  return (
    <BulletinSheet
      identite={identite}
      resultats_detailles={resultats_detailles}
      bilan={bilanStructured}
      semLabel={semLabel}
      notes={notes}
      absences={absences}
      config={config}
      rootId={`bulletin-${semestreId}`}
      directeur={localStorage.getItem('directeur_etudes') || 'À compléter'}
      matiereStats={matiereStats}
      ueeStats={ueeStats}
    />
  );
}

function BulletinAnnuelView({ etudiant }) {
  const [annuelData, setAnnuelData] = useState(null);
  const [notes, setNotes] = useState(null);
  const [semestres, setSemestres] = useState([]);
  const [bulletinsBySem, setBulletinsBySem] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null); setAnnuelData(null); setNotes(null); setSemestres([]); setBulletinsBySem({});
    if (!etudiant?.id) { setLoading(false); return; }
    
    Promise.all([
      bulletinsAPI.annuel(etudiant.id),
      etuAPI.notes(etudiant.id),
      semestresAPI.list().catch(() => ({ data: [] })),
    ])
      .then(async ([bRes, nRes, semRes]) => { 
        setAnnuelData(bRes.data);
        setNotes(nRes.data);
        const semList = Array.isArray(semRes.data) ? semRes.data : (semRes.data?.data || []);
        setSemestres(semList);
        
        // Charger les bulletins pour chaque semestre
        const bulletins = {};
        for (const sem of semList) {
          try {
            const bulletinRes = await bulletinsAPI.semestre(etudiant.id, sem.id);
            bulletins[sem.id] = bulletinRes.data.data;
          } catch (err) {
            bulletins[sem.id] = null;
          }
        }
        setBulletinsBySem(bulletins);
        setLoading(false); 
      })
      .catch(e => { setError(e.response?.data?.message || 'Erreur'); setLoading(false); });
  }, [etudiant?.id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</div>;
  if (error) return <div style={{ padding: 20, color: 'var(--danger)', fontSize: 13 }}>⚠️ {error}</div>;
  if (!annuelData) return null;

  const df = annuelData.decision_finale;
  const notesByCode = new Map(
    (notes?.details_par_matiere || [])
      .filter(Boolean)
      .map((d) => [d.code, d])
  );

  return (
    <div id="bulletin-annuel" style={{ background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', padding: '10px', maxWidth: '800px', margin: '0 auto' }}>
      {/* EN-TÊTE AVEC LOGO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
        <div style={{ fontSize: '9pt', lineHeight: 1.2, flex: 1 }}>
          <strong>INSTITUT NATIONAL DE LA POSTE,</strong><br />
          <strong>DES TECHNOLOGIES DE L'INFORMATION</strong><br />
          <strong>ET DE LA COMMUNICATION</strong><br />
          <span style={{ fontSize: '8pt' }}>DIRECTION DES ETUDES ET DE LA PÉDAGOGIE</span>
        </div>
        <img src={logo} alt="INPTIC" style={{ height: '35px', width: 'auto' }} />
        <div style={{ fontSize: '9pt', textAlign: 'right', lineHeight: 1.2, flex: 1 }}>
          <strong>RÉPUBLIQUE GABONAISE</strong><br />
          — — — — — — — — — —<br />
          Union - Travail - Justice<br />
          — — — — — — — — — —
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1.5px solid #333', margin: '4px 0' }} />

      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '4px 0 2px' }}>
        Bulletin de Notes Annuel
      </h2>
      <p style={{ textAlign: 'center', fontSize: '9.5pt', margin: '0 0 8px' }}>
        Année universitaire : 2025/2026
      </p>

      {/* IDENTIFICATION */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9.5pt', border: '2px solid #333' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', width: '30%', fontWeight: 'bold', background: '#f2f2f2' }}>Nom(s) et Prénom(s)</td>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold' }}>
              {bulletinsBySem && Object.values(bulletinsBySem)[0]?.identite?.nom} {bulletinsBySem && Object.values(bulletinsBySem)[0]?.identite?.prenom}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2' }}>Date et lieu de naissance</td>
            <td style={{ border: '1px solid #333', padding: '3px 6px' }}>
              {(() => {
                const id = Object.values(bulletinsBySem)[0]?.identite;
                return id?.date_naissance && id?.lieu_naissance
                  ? `Né(e) le ${new Date(id.date_naissance).toLocaleDateString('fr-FR')} à ${id.lieu_naissance}`
                  : '—';
              })()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* TABLEAU DES RÉSULTATS PAR SEMESTRE AVEC UES */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <thead>
          <tr style={{ background: '#e0e7ff' }}>
            <th style={{ border: '1px solid #333', padding: '3px 4px', textAlign: 'left' }}></th>
            <th style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center' }}>Note étud.</th>
          </tr>
        </thead>
        <tbody>
          {semestres.map((sem) => {
            const bulletinData = bulletinsBySem[sem.id];
            if (!bulletinData) return null;
            
            const { resultats_detailles, bilan } = bulletinData;
            const moyenneSemestre = bilan?.moyenne;
            const rang = bilan?.rang || bilan?.rank || '—';
            
            return [
              <tr key={`${sem.id}-header`} style={{ background: '#f0f0f0' }}>
                <td colSpan={2} style={{ border: '1px solid #333', padding: '4px 6px', fontWeight: 'bold', fontSize: '10pt' }}>
                  {sem.libelle}
                </td>
              </tr>,
              ...((resultats_detailles || []).sort((a, b) => (a.ue?.id || 0) - (b.ue?.id || 0)).map(ueRes => {
                const ue = ueRes.ue;
                const moyUE = ueRes.moyenne;
                return (
                  <tr key={ue?.id}>
                    <td style={{ border: '1px solid #333', padding: '3px 6px', fontSize: '8.5pt' }}>
                      <span style={{ fontWeight: '600' }}>{ue?.code}</span> — {ue?.libelle}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center', fontWeight: 'bold', fontSize: '9.5pt', color: moyUE >= 10 ? '#1a7a4a' : '#c0392b' }}>
                      {fmt(moyUE)}
                    </td>
                  </tr>
                );
              })),
              <tr key={`${sem.id}-moy`} style={{ background: '#f8f8f8', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'right', fontSize: '9.5pt' }}>Moyenne {sem.libelle}</td>
                <td style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center', fontSize: '10.5pt', color: moyenneSemestre >= 10 ? '#1a7a4a' : '#c0392b' }}>
                  {fmt(moyenneSemestre)}
                </td>
              </tr>,
              <tr key={`${sem.id}-stats`} style={{ fontSize: '8.5pt', background: '#fafafa' }}>
                <td style={{ border: '1px solid #333', padding: '2px 6px', fontWeight: 'bold' }}>Rang au {sem.libelle}</td>
                <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontWeight: 'bold' }}>
                  {rang}
                </td>
              </tr>,
              <tr key={`${sem.id}-validation`} style={{ fontSize: '8.5pt', background: '#fafafa', borderBottom: '2px solid #333' }}>
                <td style={{ border: '1px solid #333', padding: '2px 6px', fontWeight: 'bold' }}>Validation</td>
                <td style={{ border: '1px solid #333', padding: '2px 2px', textAlign: 'center', fontWeight: 'bold', color: bilan?.valide ? '#1a7a4a' : '#c0392b' }}>
                  {bilan?.valide ? '✓ Acquis' : '✗ Non'}
                </td>
              </tr>
            ];
          })}
        </tbody>
      </table>

      {/* RÉSUMÉ ANNUEL */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px', border: '1px solid #333' }}>
        <tbody>
          <tr style={{ background: '#f8f8f8', fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #333', padding: '4px 6px', width: '60%', fontSize: '9.5pt' }}>
              Moyenne Annuelle
            </td>
            <td style={{ border: '1px solid #333', padding: '4px 2px', textAlign: 'center', fontSize: '11pt', color: df?.moyenne_generale >= 10 ? '#1a7a4a' : '#c0392b' }}>
              {fmt(df?.moyenne_generale)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2', fontSize: '9pt' }}>
              Mention
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: '#b8860b' }}>
              {df?.mention || '—'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #333', padding: '3px 6px', fontWeight: 'bold', background: '#f2f2f2', fontSize: '9pt' }}>
              Décision du Conseil d'Établissement
            </td>
            <td style={{ border: '1px solid #333', padding: '3px 2px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: df?.decision === 'Diplômé(e)' ? '#1a7a4a' : '#c0392b' }}>
              {df?.decision || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SIGNATURE */}
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '9.5pt', paddingTop: '8px' }}>
        <p style={{ margin: '4px 0', fontSize: '9pt' }}>Fait à Libreville, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style={{ margin: '12px 0 4px', fontWeight: 'bold', fontSize: '9pt' }}>Le Directeur des Études et de la Pédagogie</p>
        <p style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #333', fontSize: '10.5pt', fontWeight: 'bold', height: '24px' }}>
          {localStorage.getItem('directeur_etudes') || ''}
        </p>
      </div>
    </div>
  );
}

export default function BulletinsPage() {
  const { user } = useAuthStore();
  const role = user?.role?.nom?.toLowerCase();
  const isAdmin = role === 'admin';
  const isEtudiant = role === 'etudiant';
  const isSecretariat = role === 'secretariat';
  const canAccess = isAdmin || isEtudiant || isSecretariat;

  const { data: etudiants, loading } = useApi(() => {
    if (isAdmin || isSecretariat) return etudiantsAPI.list();
    // Pour étudiant: utiliser current() pour obtenir le bon ID de la table etudiants
    if (isEtudiant) return etudiantsAPI.current().then(res => ({
      data: [res.data]
    }));
    return Promise.resolve({ data: [] });
  }, [isAdmin, isEtudiant, isSecretariat]);
  const { data: semestres } = useApi(() => semestresAPI.list());
  const [selectedEtu, setSelectedEtu] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedMany, setSelectedMany] = useState(() => new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (etudiants?.length && !selectedEtu) setSelectedEtu(etudiants[0].id);
    if (semestres?.length && !selectedType) setSelectedType(semestres[0]?.id);
  }, [etudiants, semestres]);

  // Puppeteer/deep-link support: ?etu=ID&sem=ID&clean=1
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const etu = sp.get('etu');
    const sem = sp.get('sem');
    if (etu && etudiants?.length) {
      const etuId = Number(etu);
      if (!Number.isNaN(etuId)) setSelectedEtu(etuId);
    }
    if (sem && semestres?.length) {
      const semId = Number(sem);
      if (!Number.isNaN(semId)) setSelectedType(semId);
    }
  }, [etudiants, semestres]);

  if (!canAccess) return <ErrorBox message="Accès non autorisé selon le rôle connecté." />;
  if (loading) return <LoadingPage />;

  const list = etudiants || [];
  const semList = semestres || [];
  const filtered = list.filter(e => `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()));
  const etudiant = list.find(e => e.id === selectedEtu);

  const downloadPdfFromElement = async (element, filename) => {
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false 
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      
      // Handle multiple pages if content is tall
      let currentY = 0;
      let remainingHeight = imgH;
      
      while (remainingHeight > 0) {
        const heightToPrint = Math.min(remainingHeight, pageH);
        const canvasHeightToPrint = (heightToPrint * canvas.width) / pageW;
        
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = canvasHeightToPrint;
        const ctx = croppedCanvas.getContext('2d');
        const sourceY = (currentY * canvas.width) / pageW;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, canvasHeightToPrint, 0, 0, canvas.width, canvasHeightToPrint);
        
        const croppedImgData = croppedCanvas.toDataURL('image/png');
        pdf.addImage(croppedImgData, 'PNG', 0, 0, imgW, heightToPrint);
        
        remainingHeight -= heightToPrint;
        if (remainingHeight > 0) {
          pdf.addPage();
        }
        currentY += heightToPrint;
      }
      
      pdf.save(filename);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const downloadCurrentPdf = async () => {
    if (!etudiant || !selectedType) return;
    const el = document.getElementById(`bulletin-${selectedType}`);
    if (!el) return;
    const filename = `bulletin_${etudiant.matricule || etudiant.id}_${selectedType === 'annuel' ? 'annuel' : selectedType}.pdf`;
    await downloadPdfFromElement(el, filename);
  };

  const exportZip = async () => {
    if (role !== 'admin') return;
    if (!selectedType || selectedType === 'annuel') return;
    const ids = Array.from(selectedMany);
    if (ids.length === 0) return;

    setExporting(true);
    try {
      const zip = new JSZip();
      const semId = selectedType;
      const semLabel = semList.find(s => s.id === semId)?.libelle || `Semestre ${semId}`;
      const conf = (await configAPI.get().catch(() => ({ data: null })))?.data || null;
      const semStatsRes = await statsAPI.semestre(semId).catch(() => ({ data: null }));
      const semStatsData = semStatsRes?.data || null;
      const statsMap = semStatsData?.stats?.matieres || {};
      const semAvgClasse = semStatsData?.stats?.general?.avg ?? null;

      const host = document.createElement('div');
      host.style.position = 'fixed';
      host.style.left = '-10000px';
      host.style.top = '0';
      host.style.width = '900px';
      host.style.background = '#fff';
      document.body.appendChild(host);

      for (const id of ids) {
        const etu = list.find(e => e.id === id);
        if (!etu) continue;

        const [bRes, nRes, aRes] = await Promise.all([
          bulletinsAPI.semestre(id, semId),
          etuAPI.notes(id),
          etuAPI.absences(id),
        ]);

        const b = bRes.data.data;
        const allUEAcquises = (b.resultats_detailles || []).every(ue => Number(ue.moyenne) >= 10);
        const bilanStructured = {
          moyenne: b.bilan?.moyenne,
          rang: b.bilan?.rang,
          mention: b.bilan?.mention,
          valide: Boolean(b.bilan?.valide) && allUEAcquises,
          credits_acquis: b.bilan?.credits_obtenus,
          credits_total: 30,
          moyenne_classe: semAvgClasse,
          acquis_par_compensation: false,
        };

        const container = document.createElement('div');
        host.innerHTML = '';
        host.appendChild(container);
        const root = createRoot(container);
        root.render(
          <BulletinSheet
            identite={b.identite}
            resultats_detailles={b.resultats_detailles}
            bilan={bilanStructured}
            semLabel={b.semestre?.nom || semLabel}
            notes={nRes.data}
            absences={aRes.data}
            config={conf}
            rootId={`export-${id}-${semId}`}
            directeur={localStorage.getItem('directeur_etudes') || 'À compléter'}
            matiereStats={statsMap}
          />
        );

        await new Promise(r => setTimeout(r, 150));
        const element = container.firstElementChild;
        if (!element) { root.unmount(); continue; }

        // Générer le PDF avec html2canvas + jsPDF.addImage - approche simple et stable
        try {
          const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
          });
          
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const imgW = pageW;
          const imgH = (canvas.height * imgW) / canvas.width;
          
          // Handle multiple pages if content is tall
          let currentY = 0;
          let remainingHeight = imgH;
          
          while (remainingHeight > 0) {
            const heightToPrint = Math.min(remainingHeight, pageH);
            const canvasHeightToPrint = (heightToPrint * canvas.width) / pageW;
            
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = canvas.width;
            croppedCanvas.height = canvasHeightToPrint;
            const ctx = croppedCanvas.getContext('2d');
            const sourceY = (currentY * canvas.width) / pageW;
            ctx.drawImage(canvas, 0, sourceY, canvas.width, canvasHeightToPrint, 0, 0, canvas.width, canvasHeightToPrint);
            
            const croppedImgData = croppedCanvas.toDataURL('image/png');
            pdf.addImage(croppedImgData, 'PNG', 0, 0, imgW, heightToPrint);
            
            remainingHeight -= heightToPrint;
            if (remainingHeight > 0) {
              pdf.addPage();
            }
            currentY += heightToPrint;
          }
          
          zip.file(`bulletin_${etu.matricule || etu.id}_${semId}.pdf`, pdf.output('blob'));
        } catch (error) {
          console.error(`Erreur PDF pour étudiant ${etu.id}:`, error);
        }
        
        root.unmount();
      }

      document.body.removeChild(host);
      saveAs(await zip.generateAsync({ type: 'blob' }), `bulletins_semestre_${selectedType}.zip`);
    } finally {
      setExporting(false);
    }
  };

  const clean = new URLSearchParams(window.location.search).get('clean') === '1';

  return (
    <div className="fade-in">
      <PageHeader
        title="Bulletins de Notes"
        sub="Génération des bulletins individuels"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {(isAdmin || isSecretariat) && (
              <>
                <button className="btn btn-secondary" onClick={downloadCurrentPdf} disabled={!etudiant || !selectedType}>
                  Télécharger PDF
                </button>
                <button className="btn btn-primary" onClick={exportZip} disabled={exporting || selectedMany.size === 0 || !selectedType || selectedType === 'annuel'}>
                  {exporting ? 'Export…' : `Télécharger sélection (${selectedMany.size})`}
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimer</button>
              </>
            )}
          </div>
        }
      />
      <div className="page-body">
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Student selector */}
          {(isAdmin || isSecretariat) && (
          <div className={clean ? 'no-print' : ''} style={{ width: 210, flexShrink: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <input className="input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
              </div>
              <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                {filtered.map(e => (
                  <button key={e.id} onClick={() => setSelectedEtu(e.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
                    background: selectedEtu === e.id ? 'rgba(59,130,246,0.07)' : 'transparent',
                    border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
                    borderLeft: selectedEtu === e.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedMany.has(e.id)}
                      onChange={(ev) => {
                        ev.stopPropagation();
                        setSelectedMany((prev) => {
                          const next = new Set(prev);
                          if (next.has(e.id)) next.delete(e.id);
                          else next.add(e.id);
                          return next;
                        });
                      }}
                      onClick={(ev) => ev.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{e.prenom?.[0]}{e.nom?.[0]}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: selectedEtu === e.id ? 700 : 500, color: selectedEtu === e.id ? 'var(--accent)' : 'var(--text-primary)' }}>{e.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.prenom}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Bulletin */}
          <div style={{ flex: 1 }}>
            {etudiant && (
              <>
                <div className={clean ? 'no-print' : ''} style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {semList.map(s => (
                    <button key={s.id} className={`btn ${selectedType === s.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedType(s.id)}>
                      Bulletin {s.libelle}
                    </button>
                  ))}
                  <button className={`btn ${selectedType === 'annuel' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedType('annuel')}>
                    Bulletin Annuel
                  </button>
                </div>

                <div className="fade-in">
                  {selectedType && selectedType !== 'annuel'
                    ? <BulletinView etudiant={etudiant} semestreId={selectedType} semestres={semList} />
                    : selectedType === 'annuel'
                    ? <BulletinAnnuelView etudiant={etudiant} />
                    : null
                  }
                </div>
              </>
            )}
            {!etudiant && <EmptyState icon="📄" text="Sélectionnez un étudiant pour afficher son bulletin" />}
          </div>
        </div>
      </div>
    </div>
  );
}



