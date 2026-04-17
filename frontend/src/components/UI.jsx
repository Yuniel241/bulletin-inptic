// ── Spinner ─────────────────────────────────────────
export function Spinner({ size = 18 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

// ── Loading overlay ──────────────────────────────────
export function LoadingPage({ text = 'Chargement…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <Spinner size={32} />
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{text}</span>
    </div>
  );
}

// ── Error box ────────────────────────────────────────
export function ErrorBox({ message }) {
  return (
    <div className="alert alert-error" style={{ margin: '20px 28px' }}>
      ⚠️ {message}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────
export function EmptyState({ icon = '📭', text = 'Aucune donnée' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-text">{text}</div>
    </div>
  );
}

// ── Confirm modal ────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onClose, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'accent', icon }) {
  return (
    <div className={`stat-card ${color}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 22, opacity: 0.35 }}>{icon}</div>}
      </div>
    </div>
  );
}

// ── Page header ──────────────────────────────────────
export function PageHeader({ title, sub, actions }) {
  return (
    <div className="page-header">
      <div>
        <div className="page-title">{title}</div>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
