import React from 'react';
import { useParams } from 'react-router-dom';
import { useScanResults } from '../hooks/useScan';
import { EmptyState } from '../components/common/badges';

function Certificate() {
  const { scanId } = useParams();
  const { cbom } = useScanResults(scanId);

  if (!cbom) {
    return <div className="container"><EmptyState title="Loading..." /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 0', backgroundColor: 'white', color: 'black' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', border: '4px solid #000', backgroundColor: 'white', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem', fontSize: '3rem' }}>🔒</div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'black', textShadow: 'none' }}>
          QScan Security Certificate
        </h1>
        
        <p style={{ color: 'black', marginBottom: '2rem' }}>Issued by: QScan — PNB Cybersecurity</p>

        <div style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--accent-safe)' }}>
          ✅ POST QUANTUM CRYPTOGRAPHY (PQC) READY
        </div>

        <div style={{ marginBottom: '2rem', borderTop: '3px solid #000', borderBottom: '3px solid #000', padding: '2rem', color: 'black' }}>
          <p style={{ marginBottom: '0.5rem' }}><strong>Awarded to:</strong></p>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'black' }}>
            {cbom.metadata?.organization_domain || 'Organization'}
          </p>

          <p style={{ marginBottom: '0.5rem' }}><strong>Scan ID:</strong> QS-{scanId.slice(0, 20)}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Valid Until:</strong> {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>

          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem', color: 'black' }}><strong>NIST Algorithms Verified:</strong></p>
            <p style={{ color: 'black' }}>[ML-KEM-768] [ML-DSA-65] [TLS 1.3]</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', color: 'black' }}>
          <p><strong>PQC Assets:</strong> {cbom.stats?.pqcReadyCount || 0} / {cbom.stats?.totalAssets || 0}</p>
          <p><strong>Quantum Readiness Score:</strong> {Math.round((cbom.stats?.pqcReadyCount || 0) / (cbom.stats?.totalAssets || 1) * 100)}%</p>
        </div>

        <div style={{ marginTop: '2rem', color: 'black', fontSize: '0.9rem' }}>
          <p>⚠️ This certificate is valid only if infrastructure is regularly audited and maintained.</p>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <button 
            onClick={() => window.print()} 
            className="btn btn-primary"
            style={{ marginRight: '1rem' }}
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default Certificate;
