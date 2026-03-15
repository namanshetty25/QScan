import React from 'react';

export function RiskBadge({ score, size = 'md' }) {

  const safeScore = Number(score) || 0;

  const getRiskLevel = (score) => {

    if (score >= 90) {
      return { label: 'CRITICAL', color: 'danger', icon: '🔴' };
    }

    if (score >= 80) {
      return { label: 'VERY HIGH', color: 'danger', icon: '🟥' };
    }

    if (score >= 60) {
      return { label: 'HIGH', color: 'warning', icon: '🟠' };
    }

    if (score >= 40) {
      return { label: 'MEDIUM', color: 'warning', icon: '⚠️' };
    }

    return { label: 'SAFE', color: 'safe', icon: '✅' };
  };

  const { label, color, icon } = getRiskLevel(safeScore);

  const sizeStyles = {
    sm: { padding: '0.3rem 0.6rem', fontSize: '0.75rem' },
    md: { padding: '0.4rem 0.8rem', fontSize: '0.85rem' },
    lg: { padding: '0.6rem 1rem', fontSize: '1rem' },
  };

  return (
    <span className={`badge badge-${color}`} style={sizeStyles[size]}>
      {icon} {label} ({safeScore.toFixed(1)})
    </span>
  );
}



export function TLSVersionBadge({ version }) {

  const safeVersion = version || "UNKNOWN";

  const getVersionColor = (v) => {

    const ver = String(v).toUpperCase();

    if (ver === 'TLSV1.3') return 'safe';

    if (ver === 'TLSV1.2') return 'warning';

    if (ver === 'UNKNOWN') return 'info';

    return 'danger'; // TLS 1.1, TLS 1.0, SSL etc
  };

  const getVersionLabel = (v) => {

    if (!v) return "Unknown";

    return String(v).replace(/v/i, ' ');
  };

  return (
    <span className={`badge badge-${getVersionColor(safeVersion)}`}>
      {getVersionLabel(safeVersion)}
    </span>
  );
}



export function PQCStatusPill({ status }) {

  const safeStatus = status || "UNKNOWN";

  const statusConfig = {
    PQC_READY: { label: '✅ PQC Ready', color: 'safe' },
    HYBRID_PQC: { label: '🔄 Hybrid PQC', color: 'warning' },
    SAFE_CLASSICAL: { label: '⚠️ Classical', color: 'warning' },
    MIGRATION_NEEDED: { label: '🟠 Migration', color: 'warning' },
    CRITICAL: { label: '🔴 Critical', color: 'danger' },
    UNKNOWN: { label: '❓ Unknown', color: 'info' }
  };

  const config = statusConfig[safeStatus] || statusConfig.UNKNOWN;

  return (
    <span className={`badge badge-${config.color}`}>
      {config.label}
    </span>
  );
}



export function CopyButton({ text, label = 'Copy' }) {

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {

    if (!text) return;

    navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-sm btn-secondary"
      title={text}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}



export function ExportButton({ data, format = 'json', filename = 'export' }) {

  const handleExport = () => {

    if (!data) return;

    if (format === 'json') {

      const json = JSON.stringify(data, null, 2);

      const blob = new Blob([json], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;

      a.download = `${filename}.json`;

      a.click();

      URL.revokeObjectURL(url);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="btn btn-sm btn-primary"
    >
      ↓ Export {format.toUpperCase()}
    </button>
  );
}



export function SkeletonCard() {

  return (
    <div className="card loading" style={{ height: '200px' }}>
      <div style={{ backgroundColor: 'rgba(0,255,209,0.1)', height: '20px', borderRadius: '4px', marginBottom: '10px' }}></div>
      <div style={{ backgroundColor: 'rgba(0,255,209,0.1)', height: '20px', borderRadius: '4px', marginBottom: '10px', width: '80%' }}></div>
      <div style={{ backgroundColor: 'rgba(0,255,209,0.1)', height: '20px', borderRadius: '4px', width: '60%' }}></div>
    </div>
  );
}



export function EmptyState({ icon = '📭', title, message, action }) {

  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3>{title}</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
      {action && action}
    </div>
  );
}



export default {
  RiskBadge,
  TLSVersionBadge,
  PQCStatusPill,
  CopyButton,
  ExportButton,
  SkeletonCard,
  EmptyState,
};