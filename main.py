"""
QScan — Quantum Readiness Assessment Platform
Main CLI Entry Point
"""

import argparse
import sys
import json
import os
from datetime import datetime

from ai_ml.risk_scoring_model import RiskScoringModel
from ai_ml.anomaly_detection import CryptoAnomalyDetector

from config.settings import Settings
from scanner.asset_discovery import AssetDiscovery
from scanner.tls_scanner import TLSScanner
from scanner.port_scanner import PortScanner

from crypto.cipher_parser import CipherParser
from crypto.pqc_classifier import PQCClassifier

from cbom.cbom_generator import CBOMGenerator

from utils.logger import setup_logger, get_logger

logger = get_logger(__name__)


# ─────────────────────────────────────────────
# CLI ARGUMENTS
# ─────────────────────────────────────────────

def parse_arguments():
    parser = argparse.ArgumentParser(
        prog="qscan",
        description="QScan — Quantum Readiness Assessment Platform",
    )

    parser.add_argument("--domain", required=True)

    parser.add_argument("--discover", action="store_true")

    parser.add_argument("--cbom", action="store_true")

    parser.add_argument("--output", default=None)

    parser.add_argument(
        "--ports",
        default="443,8443,8080,993,995,465,587"
    )

    parser.add_argument("--timeout", type=int, default=10)

    parser.add_argument("--threads", type=int, default=10)

    parser.add_argument("--verbose", action="store_true")

    return parser.parse_args()


# ─────────────────────────────────────────────
# BANNER
# ─────────────────────────────────────────────

def banner():
    print(
r"""
╔══════════════════════════════════════════════╗
║                                              ║
║   ██████  ███████  ██████  █████  ███    ██  ║
║  ██    ██ ██      ██      ██   ██ ████   ██  ║
║  ██    ██ ███████ ██      ███████ ██ ██  ██  ║
║  ██ ▄▄ ██      ██ ██      ██   ██ ██  ██ ██  ║
║   ██████  ███████  ██████ ██   ██ ██   ████  ║
║      ▀▀                                      ║
║  Quantum Readiness Assessment Platform       ║
║                                              ║
╚══════════════════════════════════════════════╝
"""
)


# ─────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────

def run_pipeline(args):

    settings = Settings(
        timeout=args.timeout,
        max_threads=args.threads,
        target_ports=[int(p.strip()) for p in args.ports.split(",")],
    )

    domain = args.domain
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    output_dir = args.output or os.path.join(
        "results", f"{domain}_{timestamp}"
    )

    os.makedirs(output_dir, exist_ok=True)

    all_scan_results = []

    # ─── Phase 1: Asset Discovery ─────────────────────

    targets = [domain]

    if args.discover:

        logger.info(f"[Phase 1] Asset discovery: {domain}")

        discovery = AssetDiscovery(settings)

        discovered = discovery.discover(domain)

        targets.extend(discovered)

        targets = list(set(targets))

        logger.info(f"✓ Found {len(targets)} targets")

    else:

        logger.info("[Phase 1] Skipping discovery")


    # ─── Phase 2: Port Scan ───────────────────────────

    logger.info("[Phase 2] Port scanning")

    port_scanner = PortScanner(settings)

    port_results = {}

    for target in targets:

        open_ports = port_scanner.scan(target)

        if open_ports:

            port_results[target] = open_ports

            logger.info(f"{target}: {open_ports}")


    # ─── Phase 3: TLS Scan ────────────────────────────

    logger.info("[Phase 3] TLS scanning")

    tls_scanner = TLSScanner(settings)

    for target, ports in port_results.items():

        for port in ports:

            logger.info(f"Scanning {target}:{port}")

            result = tls_scanner.scan(target, port)

            if result:

                all_scan_results.append(result)


    if not all_scan_results:

        logger.info("Fallback HTTPS scan")

        result = tls_scanner.scan(domain, 443)

        if result:

            all_scan_results.append(result)


    # ─── LOAD AI MODELS ───────────────────────────────

    logger.info("[AI] Loading models")

    risk_model = RiskScoringModel()
    risk_model.load_model("ai_ml/models/risk_model.joblib")

    anomaly_detector = CryptoAnomalyDetector()
    anomaly_detector.load_model("ai_ml/models/anomaly_model.joblib")


    # ─── Phase 4: Crypto Parsing ──────────────────────

    logger.info("[Phase 4] Cryptographic analysis")

    cipher_parser = CipherParser()
    pqc_classifier = PQCClassifier()

    parsed_results = []

    for result in all_scan_results:

        parsed = cipher_parser.parse(result)

        classified = pqc_classifier.classify(parsed)


        # ML Risk Prediction
        ml_score = risk_model.predict(classified)

        classified["ml_risk_score"] = ml_score


        # Anomaly Detection
        anomaly = anomaly_detector.detect(classified)

        classified["anomaly_detection"] = anomaly


        parsed_results.append(classified)


        status = classified.get("pqc_status", "UNKNOWN")
        rule_risk = classified.get("quantum_risk_level", "UNKNOWN")

        anomaly_flag = anomaly.get("is_anomaly", False)

        logger.info(
            f"{classified['host']}:{classified['port']} "
            f"| PQC:{status} "
            f"| RuleRisk:{rule_risk} "
            f"| MLRisk:{ml_score:.1f} "
            f"| Anomaly:{anomaly_flag}"
        )


    # ─── Phase 5: CBOM ────────────────────────────────

    logger.info("[Phase 5] Generating CBOM")

    cbom_generator = CBOMGenerator()

    cbom = cbom_generator.generate(
        domain=domain,
        scan_results=parsed_results,
        timestamp=timestamp,
    )

    cbom_path = os.path.join(output_dir, "cbom.json")

    with open(cbom_path, "w") as f:

        json.dump(cbom, f, indent=2)

    logger.info(f"CBOM saved: {cbom_path}")


    # ─── Save Results ─────────────────────────────────

    result_path = os.path.join(output_dir, "scan_results.json")

    with open(result_path, "w") as f:

        json.dump(parsed_results, f, indent=2, default=str)

    logger.info(f"Results saved: {result_path}")


    # ─── Summary ──────────────────────────────────────

    print("\n==============================")

    print("SCAN SUMMARY")

    print("==============================")

    print(f"Domain: {domain}")

    print(f"Targets: {len(targets)}")

    print(f"Assets: {len(parsed_results)}")

    print(f"Output: {output_dir}")

    pqc_ready = sum(
        1 for r in parsed_results
        if r.get("pqc_status") == "PQC_READY"
    )

    print(f"PQC Ready: {pqc_ready}/{len(parsed_results)}")

    print("==============================\n")


# ─────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────

def main():

    if sys.stdout.isatty():

        banner()

    args = parse_arguments()

    level = "DEBUG" if args.verbose else "INFO"

    setup_logger(level=level)

    try:

        run_pipeline(args)

    except KeyboardInterrupt:

        logger.warning("Scan interrupted")

        sys.exit(1)

    except Exception as e:

        logger.error(f"Scan failed: {e}")

        if args.verbose:

            import traceback
            traceback.print_exc()

        sys.exit(1)


if __name__ == "__main__":

    main()