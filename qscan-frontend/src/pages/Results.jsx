import React from 'react';
import { useParams } from 'react-router-dom';
import { useScanResults } from '../hooks/useScan';
import { motion } from 'framer-motion';
import { SkeletonCard, EmptyState } from '../components/common/badges';
import './pages.css';

function Results() {
  const { scanId } = useParams();
  const { cbom, loading, error } = useScanResults(scanId);

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <h2>Loading Results...</h2>
        <div className="grid grid-3">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !cbom) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <EmptyState
          icon="❌"
          title="Failed to Load Results"
          message={error || 'Results not found'}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container" style={{ padding: '3rem 0' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dashboard-header">
            <div className="dashboard-title">
              <h2>{cbom.metadata?.organization_domain || 'Scan Results'}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Scan ID: {scanId}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-value">{cbom.stats?.totalAssets || 0}</div>
              <div className="metric-label">Total Assets</div>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
              <div className="metric-value" style={{ color: 'var(--accent-danger)' }}>
                {cbom.stats?.criticalCount || 0}
              </div>
              <div className="metric-label">Critical Vulnerabilities</div>
            </div>
            <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-safe)' }}>
              <div className="metric-value" style={{ color: 'var(--accent-safe)' }}>
                {cbom.stats?.pqcReadyCount || 0}
              </div>
              <div className="metric-label">PQC Ready</div>
            </div>
          </div>

          {/* CBOM Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Asset/Endpoint</th>
                  <th>TLS Version</th>
                  <th>Cipher Suite</th>
                  <th>PQC Status</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {cbom.crypto_assets?.map((asset, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <td><code>{asset.host}:{asset.port}</code></td>
                    <td>{asset.tls_version || 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem' }}><code>{asset.cipher_suite?.slice(0, 30)}...</code></td>
                    <td>{asset.pqcClassification?.label || 'N/A'}</td>
                    <td>{asset.pqc_status || 'N/A'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw Data for inspection */}
          <details style={{ marginTop: '2rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
              Raw CBOM Data (JSON)
            </summary>
            <pre style={{ 
              backgroundColor: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: '8px',
              overflowX: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(cbom, null, 2)}
            </pre>
          </details>
        </motion.div>
      </div>
    </div>
  );
}

export default Results;
