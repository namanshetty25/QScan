// PQC Classifier utility


export function classifyPQCStatus(asset) {
  const pqc =
    asset?.quantum_assessment?.pqc_status ||
    asset?.pqc_status ||
    "UNKNOWN";

  const map = {
    PQC_READY: {
      label: "🟢 PQC Ready",
      color: "safe",
      description: "Quantum safe algorithms detected",
    },

    HYBRID_PQC: {
      label: "🔄 Hybrid PQC",
      color: "warning",
      description: "Hybrid PQC deployment detected",
    },

    MIGRATION_NEEDED: {
      label: "🟠 Migration Needed",
      color: "warning",
      description: "Post-quantum migration required",
    },

    CRITICAL: {
      label: "🔴 Critical",
      color: "danger",
      description: "Critical cryptographic vulnerability",
    },

    UNKNOWN: {
      label: "❓ Unknown",
      color: "info",
      description: "Status could not be determined",
    },
  };

  return {
    status: pqc,
    ...(map[pqc] || map.UNKNOWN),
  };
}



export function calculateRiskScore(asset) {
  return (
    asset?.quantum_assessment?.risk_score ??
    asset?.quantum_risk_score ??
    0
  );
}



export function getRiskLevel(asset) {
  const level =
    asset?.quantum_assessment?.risk_level ||
    asset?.quantum_risk_level ||
    "UNKNOWN";

  const map = {
    SAFE: { color: "safe", icon: "✅" },
    LOW: { color: "info", icon: "🟢" },
    MEDIUM: { color: "warning", icon: "⚠️" },
    HIGH: { color: "warning", icon: "🟠" },
    CRITICAL: { color: "danger", icon: "🔴" },
  };

  return {
    level,
    ...(map[level] || { color: "info", icon: "❓" }),
  };
}



export function formatCertificate(cert) {
  if (!cert) return null;

  return {
    subject: cert?.subject?.commonName || "Unknown",
    issuer: cert?.issuer?.organizationName || "Unknown",
    validFrom: cert?.validity?.not_before,
    validUntil: cert?.validity?.not_after,
    daysUntilExpiry: cert?.validity?.days_until_expiry,
    isExpired: cert?.validity?.is_expired,
    sans: cert?.san || [],
    sha256: cert?.fingerprint_sha256,
  };
}



/* ---------------------------------------------------
   Weak crypto indicators for banking security
--------------------------------------------------- */

const WEAK_TLS = ["SSLV3", "TLSV1.0", "TLSV1.1"];

const WEAK_CIPHERS = [
  "RC4",
  "DES",
  "3DES",
  "MD5",
  "NULL",
  "EXPORT",
  "RC2"
];


function normalize(str) {
  return String(str || "").toUpperCase().replace(/\s/g, "");
}


function isWeakTLS(version) {
  if (!version) return false;

  const v = normalize(version);

  return WEAK_TLS.some(t => v.includes(t));
}


function isWeakCipher(cipher) {
  if (!cipher) return false;

  const c = cipher.toUpperCase();

  return WEAK_CIPHERS.some(w => c.includes(w));
}



/* ---------------------------------------------------
   Format CBOM for frontend
--------------------------------------------------- */

export function formatCBOMData(cbom) {
  if (!cbom) return null;

  const assets = cbom.crypto_assets || [];

  const formattedAssets = assets.map(asset => {

    const tls = asset?.tls_configuration?.protocol_version || null;
    const cipher = asset?.tls_configuration?.negotiated_cipher || null;

    const riskScore = calculateRiskScore(asset);
    const pqc = classifyPQCStatus(asset);
    const riskLevel = getRiskLevel(asset);

    const cert = formatCertificate(asset.certificate_info);

    return {
      ...asset,

      tls_version: tls,

      cipher_suite: cipher,

      pqcClassification: pqc,

      riskScore: riskScore,

      riskLevel: riskLevel,

      formattedCert: cert,

      threatTimeline:
        asset?.quantum_assessment?.threat_assessment
          ?.estimated_quantum_threat,

      migrationDeadline:
        asset?.quantum_assessment?.threat_assessment
          ?.migration_deadline,

      urgency:
        asset?.quantum_assessment?.threat_assessment
          ?.urgency,
    };
  });



  /* ---------------------------------------------------
     Stats Calculation
  --------------------------------------------------- */

  const criticalCount = formattedAssets.filter(asset => {

    const riskScore = asset.riskScore;
    const pqcStatus = asset.pqcClassification?.status;
    const tls = asset.tls_version;
    const cipher = asset.cipher_suite;
    const expired = asset.formattedCert?.isExpired;

    return (
      riskScore >= 90 ||           // extreme quantum risk
      pqcStatus === "CRITICAL" ||  // PQC failure
      isWeakTLS(tls) ||            // deprecated TLS
      isWeakCipher(cipher) ||      // weak cipher
      expired                      // expired certificate
    );

  }).length;



  const pqcReadyCount = formattedAssets.filter(
    a => a.pqcClassification?.status === "PQC_READY"
  ).length;



  const migrationNeeded = formattedAssets.filter(
    a => a.pqcClassification?.status === "MIGRATION_NEEDED"
  ).length;



  return {

    metadata: cbom.metadata,

    summary: cbom.summary,

    crypto_assets: formattedAssets,

    risk_matrix: cbom.risk_matrix || [],

    pqc_migration_plan: cbom.pqc_migration_plan || {},


    stats: {

      totalAssets:
        cbom.metadata?.total_assets_scanned ||
        formattedAssets.length,

      criticalCount: criticalCount,

      pqcReadyCount: pqcReadyCount,

      mitigationNeeded: migrationNeeded,

    },
  };
}



/* ---------------------------------------------------
   Quantum Readiness Score
--------------------------------------------------- */

export function calculateQuantumReadinessScore(cbom) {
  if (!cbom?.crypto_assets) return 0;

  const total = cbom.crypto_assets.length;

  if (total === 0) return 0;

  const ready = cbom.crypto_assets.filter(
    a => a.pqcClassification?.status === "PQC_READY"
  ).length;

  return Math.round((ready / total) * 100);
}



export default {
  classifyPQCStatus,
  calculateRiskScore,
  getRiskLevel,
  formatCertificate,
  formatCBOMData,
  calculateQuantumReadinessScore,
};