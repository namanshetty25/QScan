// PQC Classifier utility
export const PQC_ALGORITHMS = {
  KEM: ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024', 'KYBER-512', 'KYBER-768', 'KYBER-1024'],
  SIGNATURE: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'DILITHIUM', 'SLH-DSA', 'SPHINCS'],
  HASH: ['SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256'],
};

export const VULNERABLE_ALGORITHMS = {
  KEM: ['RSA', 'ECDH', 'ECDHE', 'DH', 'DHE', 'PSK'],
  SIGNATURE: ['RSA-PKCS1', 'ECDSA', 'DSA'],
  CIPHER: ['RC4', 'DES', '3DES', 'RC2', 'DES-CBC'],
  HASH: ['MD5', 'SHA-1', 'MD4'],
  TLS_VERSION: ['SSLv2', 'SSLv3', 'TLS 1.0', 'TLS 1.1'],
};

export function classifyPQCStatus(asset) {
  const {
    tls_version,
    cipher_analysis,
    certificate,
    quantum_risk_level,
    pqc_status,
  } = asset;

  // Extract key exchange and signature algorithms
  const keyExchange = cipher_analysis?.key_exchange?.algorithm || '';
  const authentication = cipher_analysis?.authentication?.algorithm || '';
  const cipherSuite = asset.cipher_suite || '';

  // Check for critical vulnerabilities
  if (VULNERABLE_ALGORITHMS.TLS_VERSION.some(v => tls_version?.includes(v))) {
    return {
      status: 'CRITICAL',
      label: '🔴 CRITICAL',
      color: 'danger',
      description: `${tls_version} is end-of-life and should be disabled immediately`,
    };
  }

  // Check for dangerous ciphers
  if (VULNERABLE_ALGORITHMS.CIPHER.some(c => cipherSuite?.includes(c))) {
    return {
      status: 'CRITICAL',
      label: '🔴 CRITICAL',
      color: 'danger',
      description: 'Deprecated cipher suite detected',
    };
  }

  // Check for PQC algorithms (future-proof)
  const hasPQCKEM = PQC_ALGORITHMS.KEM.some(alg =>
    cipherSuite?.includes(alg) || keyExchange?.includes(alg)
  );
  const hasPQCSig = PQC_ALGORITHMS.SIGNATURE.some(alg =>
    certificate?.sig_algo?.includes(alg) || authentication?.includes(alg)
  );

  if (hasPQCKEM && hasPQCSig && tls_version === 'TLSv1.3') {
    return {
      status: 'PQC_READY',
      label: '✅ PQC Ready',
      color: 'safe',
      description: 'Quantum-safe algorithms detected',
    };
  }

  // Check for hybrid mode
  if ((hasPQCKEM || hasPQCSig) && tls_version === 'TLSv1.3') {
    return {
      status: 'HYBRID_PQC',
      label: '🔄 Hybrid PQC',
      color: 'warning',
      description: 'Partially quantum-safe (hybrid mode)',
    };
  }

  // Modern but not yet PQC
  if (tls_version === 'TLSv1.3' && !VULNERABLE_ALGORITHMS.KEM.includes(keyExchange)) {
    return {
      status: 'SAFE_CLASSICAL',
      label: '⚠️ Classical Only',
      color: 'warning',
      description: 'Secure but not quantum-safe. PQC migration needed by 2027.',
    };
  }

  // TLS 1.2 or older with classical algorithms
  if (tls_version === 'TLSv1.2' || tls_version === 'TLSv1.1') {
    return {
      status: 'MIGRATION_NEEDED',
      label: '🟠 Migration Needed',
      color: 'warning',
      description: 'Upgrade to TLS 1.3 with post-quantum algorithms required',
    };
  }

  return {
    status: 'UNKNOWN',
    label: '❓ Unknown',
    color: 'info',
    description: 'Status could not be determined',
  };
}

// Risk Scoring utility
const RISK_WEIGHTS = {
  keyExchange: 0.35,
  authentication: 0.20,
  tlsVersion: 0.15,
  encryption: 0.15,
  certificate: 0.10,
  forwardSecrecy: 0.05,
};

export function calculateRiskScore(asset) {
  let score = 100; // Start at lowest risk
  const {
    tls_version,
    cipher_analysis,
    certificate,
    quantum_risk_score,
  } = asset;

  // TLS Version score
  if (VULNERABLE_ALGORITHMS.TLS_VERSION.some(v => tls_version?.includes(v))) {
    score -= 50 * RISK_WEIGHTS.tlsVersion;
  } else if (tls_version === 'TLSv1.3') {
    score -= 5 * RISK_WEIGHTS.tlsVersion;
  } else if (tls_version === 'TLSv1.2') {
    score -= 15 * RISK_WEIGHTS.tlsVersion;
  }

  // Key Exchange score
  const keyExchange = cipher_analysis?.key_exchange?.algorithm || '';
  if (PQC_ALGORITHMS.KEM.some(alg => keyExchange?.includes(alg))) {
    score -= 0;
  } else if (keyExchange.includes('DHE') || keyExchange.includes('ECDHE')) {
    score -= 25 * RISK_WEIGHTS.keyExchange;
  } else if (keyExchange === 'RSA') {
    score -= 40 * RISK_WEIGHTS.keyExchange;
  }

  // Forward Secrecy
  if (!cipher_analysis?.forward_secrecy) {
    score -= 20 * RISK_WEIGHTS.forwardSecrecy;
  }

  // Certificate validity
  if (certificate && certificate.days_until_expiry < 30) {
    score -= 15;
  }
  if (certificate && certificate.is_expired) {
    score -= 50;
  }

  return Math.max(0, Math.min(100, score));
}

export function getRiskLevel(score) {
  if (score >= 80) return { level: 'SAFE', color: 'safe', icon: '✅' };
  if (score >= 60) return { level: 'MEDIUM', color: 'warning', icon: '⚠️' };
  if (score >= 40) return { level: 'HIGH', color: 'warning', icon: '🟠' };
  return { level: 'CRITICAL', color: 'danger', icon: '🔴' };
}

export function formatRiskBadge(score) {
  const { level, color, icon } = getRiskLevel(score);
  return {
    label: `${icon} ${level}`,
    color,
    score: Math.round(score),
  };
}

// Format certificate data for display
export function formatCertificate(cert) {
  if (!cert) return null;

  return {
    subject: cert.subject?.commonName || 'Unknown',
    issuer: cert.issuer?.organizationName || 'Unknown',
    validFrom: cert.validity?.not_before || 'N/A',
    validUntil: cert.validity?.not_after || 'N/A',
    daysUntilExpiry: cert.validity?.days_until_expiry || -1,
    isExpired: cert.validity?.is_expired || false,
    serialNumber: cert.serial_number || 'N/A',
    sha256: cert.fingerprints?.sha256 || 'N/A',
    signatureAlgorithm: cert.signature_algorithm || 'N/A',
    publicKeySize: cert.public_key?.bits || 'Unknown',
    publicKeyAlgorithm: cert.public_key?.algorithm || 'Unknown',
    sans: cert.san || [],
    deprecated: cert.validity?.is_expired || false,
  };
}

// CBOM Data formatter
export function formatCBOMData(cbom) {
  if (!cbom) return null;

  const {
    metadata,
    summary,
    crypto_assets = [],
  } = cbom;

  const totalAssets = crypto_assets.length;
  const criticalCount = crypto_assets.filter(a => {
    const pqc = classifyPQCStatus(a);
    return pqc.status === 'CRITICAL';
  }).length;

  const pqcReadyCount = crypto_assets.filter(a => {
    const pqc = classifyPQCStatus(a);
    return pqc.status === 'PQC_READY';
  }).length;

  return {
    metadata,
    summary,
    crypto_assets: crypto_assets.map(asset => ({
      ...asset,
      pqcClassification: classifyPQCStatus(asset),
      riskScore: calculateRiskScore(asset),
      formattedCert: formatCertificate(asset.certificate),
    })),
    stats: {
      totalAssets,
      criticalCount,
      pqcReadyCount,
      mitigationNeeded: totalAssets - pqcReadyCount,
    },
  };
}

export function calculateQuantumReadinessScore(cbom) {
  if (!cbom || !cbom.crypto_assets) return 0;

  const assets = cbom.crypto_assets;
  if (assets.length === 0) return 0;

  const pqcReady = assets.filter(a => {
    const pqc = classifyPQCStatus(a);
    return pqc.status === 'PQC_READY';
  }).length;

  return Math.round((pqcReady / assets.length) * 100);
}

export default {
  classifyPQCStatus,
  calculateRiskScore,
  getRiskLevel,
  formatRiskBadge,
  formatCertificate,
  formatCBOMData,
  calculateQuantumReadinessScore,
  PQC_ALGORITHMS,
  VULNERABLE_ALGORITHMS,
};
