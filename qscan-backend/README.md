# QScan API

A FastAPI backend that wraps the `qscan` CLI tool to provide a REST interface for quantum-readiness assessments of TLS/cryptographic assets.

---

## Requirements

- Python 3.11+
- `qscan` CLI available on `$PATH`
- Dependencies listed in `requirements.txt`

---

## Setup

```bash
# 1. Create venv
python -m venv venv && source venv/bin/activate  # Linux/macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Verify qscan is accessible
cd .. && pip install -e . && cd qscan-backend
qscan --help

# 4. Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API docs are available at:
- Swagger UI → http://localhost:8000/docs
- ReDoc      → http://localhost:8000/redoc

---

## API Reference

All endpoints are prefixed with `/api/v1`.

---

### `POST /api/v1/scan` — Start a scan

Queues a new scan and returns immediately. The scan runs in the background.

**Request body**

| Field        | Type            | Required | Description                                        |
|--------------|-----------------|----------|----------------------------------------------------|
| `target`     | string          | ✅       | Domain to scan (e.g. `www.example.com`)            |
| `scan_types` | array of string | ❌       | `["cbom"]`, `["discover"]`, or both                |
| `discover`   | boolean         | ❌       | Shorthand to enable asset discovery (default false)|
| `ports`      | array of int    | ❌       | Reserved for future use                            |

**Response `202`**

```json
{
  "scan_id": "3f2a1b...",
  "status": "pending",
  "message": "Scan queued for target 'www.example.com'."
}
```

---

### `GET /api/v1/scan/{scanId}` — Poll scan status

**Response**

```json
{
  "scan_id": "3f2a1b...",
  "status": "running",
  "progress": 70,
  "logs": [
    "[2026-03-12T12:00:00+00:00] Running: qscan --domain www.example.com ...",
    "[2026-03-12T12:00:05+00:00] Scanning port 443 ..."
  ],
  "error": null
}
```

**Status values**

| Value       | Meaning                              |
|-------------|--------------------------------------|
| `pending`   | Queued, not yet started              |
| `running`   | `qscan` process is active            |
| `completed` | All output files parsed successfully |
| `failed`    | `qscan` returned an error or timed out |

**Progress milestones**: `0` (queued) → `10` (process started) → `70` (process exited, parsing outputs) → `100` (done)

---

### `GET /api/v1/scan/{scanId}/results` — Full scan results

Returns `409` if the scan is not yet completed.

**Response**

```json
{
  "scan_id": "3f2a1b...",
  "target": "www.example.com",
  "cbom": { ... },
  "scan_results": [ ... ],
  "assets_found": 1,
  "risk_score": 36.2
}
```

---

### `GET /api/v1/scan/{scanId}/cbom` — Cryptographic BOM

Returns the structured CBOM (Cryptographic Bill of Materials) for the scan. Returns `409` if not completed.

**Response**

```json
{
  "metadata": { "organization_domain": "...", "scan_timestamp": "...", ... },
  "summary":  { "total_assets": 1, "average_risk_score": 36.2, ... },
  "crypto_assets": [ ... ]
}
```

---

### `GET /api/v1/history` — Scan history

Returns a summary list of all scans (newest first is determined by caller; order reflects insertion).

**Response**

```json
[
  {
    "scan_id": "3f2a1b...",
    "target": "www.example.com",
    "timestamp": "2026-03-12T12:00:00+00:00",
    "assets_found": 1,
    "risk_score": 36.2,
    "status": "completed"
  }
]
```

---

### `DELETE /api/v1/scan/{scanId}` — Delete a scan

Removes the scan record and cleans up the temporary output directory on disk.

**Response**

```json
{ "message": "Scan 3f2a1b... deleted." }
```

---

### `GET /api/v1/health` — Health check

```json
{ "status": "ok" }
```

---

## How It Works

```
Client
  │
  ▼
POST /api/v1/scan
  │  Creates scan record (in-memory)
  │  Spawns background task
  │
  ▼
Background Worker
  │  Creates temp directory  (/tmp/qscan_<id>_...)
  │  Runs: qscan --domain <target> --cbom [--discover] --output <tmpdir>
  │  Parses: cbom.json, scan_results.json, discovered_assets.json
  │  Updates scan record: status, risk_score, assets_found, logs
  │
  ▼
Client polls GET /api/v1/scan/{id}   until status = "completed"
  │
  ▼
Client fetches GET /api/v1/scan/{id}/results  or  /cbom
```

`qscan` is invoked with `--cbom` by default. When `discover: true` (or `"discover"` is in `scan_types`), `--discover` is also added, which causes `qscan` to additionally emit `discovered_assets.json`.

The server enforces a **300-second timeout** on the `qscan` process. If exceeded the scan is marked `failed`.

---

## Output Files Produced by `qscan`

| File                    | Mode             | Description                          |
|-------------------------|------------------|--------------------------------------|
| `cbom.json`             | cbom + discover  | Cryptographic Bill of Materials      |
| `scan_results.json`     | cbom + discover  | Per-host TLS & cipher detail         |
| `discovered_assets.json`| discover only    | Enumerated subdomains / targets      |

All files are written to a per-scan temp directory and deleted when the scan is removed via `DELETE`.

---

## Project Structure

```
.
├── main.py           # FastAPI application (single file)
└── requirements.txt  # Python dependencies
```

---

## Configuration

The server stores all state in-memory. For production use, consider replacing the `scans` dict with a persistent store (Redis, SQLite, PostgreSQL) and running multiple workers behind a process manager like `gunicorn`:

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Note: with multiple workers each process has its own `scans` dict, so a shared store (Redis etc.) is required for multi-worker deployments.

---
