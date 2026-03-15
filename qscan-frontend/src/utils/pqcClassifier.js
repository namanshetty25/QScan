
// PQC Classifier utility



/* ---------------------------------------------------
   PQC STATUS CLASSIFICATION
--------------------------------------------------- */

export function classifyPQCStatus(asset) {

  const pqc =
    asset?.quantum_assessment?.pqc_status ||
    asset?.pqc_status ||
    asset?.pqcClassification?.status ||
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



/* ---------------------------------------------------
   BASIC RISK SCORE
--------------------------------------------------- */

export function calculateRiskScore(asset) {

  return (
    asset?.quantum_assessment?.risk_score ??
    asset?.quantum_risk_score ??
    asset?.riskScore ??
    0
  );

}



/* ---------------------------------------------------
   RISK LEVEL
--------------------------------------------------- */

export function getRiskLevel(asset) {

  const level =
    asset?.quantum_assessment?.risk_level ||
    asset?.quantum_risk_level ||
    asset?.riskLevel?.level ||
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



/* ---------------------------------------------------
   CERTIFICATE FORMATTER
--------------------------------------------------- */

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
   Weak crypto indicators
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
     Stats
  --------------------------------------------------- */

  const criticalCount = formattedAssets.filter(asset => {

    const riskScore = asset.riskScore;

    const pqcStatus = asset.pqcClassification?.status;

    const tls = asset.tls_version;

    const cipher = asset.cipher_suite;

    const expired = asset.formattedCert?.isExpired;



    return (

      riskScore >= 90 ||

      pqcStatus === "CRITICAL" ||

      isWeakTLS(tls) ||

      isWeakCipher(cipher) ||

      expired

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
   Adaptive Quantum Readiness Score
--------------------------------------------------- */

export function calculateQuantumReadinessScore(cbom) {

  if (!cbom?.crypto_assets) return 0;

  const assets = cbom.crypto_assets;

  if (assets.length === 0) return 0;



  let totalScore = 0;



  for (const asset of assets) {

    let score = 0;



    const tls =
      asset?.tls_configuration?.protocol_version ||
      asset?.tls_version;



    const cipher =
      asset?.tls_configuration?.negotiated_cipher ||
      asset?.cipher_suite;



    const pqc =
      asset?.pqcClassification?.status ||
      asset?.quantum_assessment?.pqc_status;



    const fs =
      asset?.cipher_analysis?.forward_secrecy;



    /* PQC algorithms (60%) */

    if (pqc === "PQC_READY") score += 60;

    if (pqc === "HYBRID_PQC") score += 45;



    /* TLS protocol (15%) */

    if (tls === "TLSv1.3") score += 15;

    else if (tls === "TLSv1.2") score += 8;



    /* Symmetric crypto (10%) */

    if (cipher && cipher.includes("AES256")) score += 10;

    else if (cipher && cipher.includes("CHACHA20")) score += 10;

    else if (cipher && cipher.includes("AES128")) score += 5;



    /* Forward secrecy (10%) */

    if (fs) score += 10;



    /* Certificate strength (5%) */

    const bits =
      asset?.certificate_info?.chain_details?.[0]?.key_bits;

    if (bits >= 3072) score += 5;

    else if (bits >= 2048) score += 3;



    totalScore += score;

  }



  return Math.round(totalScore / assets.length);

}



export default {

  classifyPQCStatus,

  calculateRiskScore,

  getRiskLevel,

  formatCertificate,

  formatCBOMData,

  calculateQuantumReadinessScore,

};
