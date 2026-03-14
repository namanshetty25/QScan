import asyncio
import json
import os
import shutil
import subprocess
import tempfile
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

import redis
import redis.asyncio as aioredis
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings


# -----------------------------------------------------------
# Fix Windows encoding issues
# -----------------------------------------------------------
os.environ["PYTHONUTF8"] = "1"


# -----------------------------------------------------------
# Redis key helpers
# -----------------------------------------------------------

def _scan_key(scan_id: str) -> str:
    """Per-scan record key."""
    return f"scan:{scan_id}"

# Ordered list of all scan IDs — used to reconstruct history.
SCANS_INDEX_KEY = "scans:index"


# -----------------------------------------------------------
# Serialisation helpers
#
# Records are stored as JSON strings in Redis.
# ScanStatus enum values are stored as plain strings and
# rehydrated on the way out.
# -----------------------------------------------------------

def _serialize(record: dict) -> str:
    payload = {
        **record,
        "status": (
            record["status"].value
            if isinstance(record["status"], ScanStatus)
            else record["status"]
        ),
    }
    return json.dumps(payload, ensure_ascii=False)


def _deserialize(raw: str | bytes) -> dict:
    data = json.loads(raw)
    data["status"] = ScanStatus(data["status"])
    return data


# -----------------------------------------------------------
# Sync Redis client (used inside the background worker thread)
# -----------------------------------------------------------

def _sync_redis() -> redis.Redis:
    """Create a fresh sync Redis client for the worker thread."""
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
    )


def _redis_save(r: redis.Redis, record: dict) -> None:
    """Persist a record and ensure it is in the index."""
    key = _scan_key(record["scan_id"])

    pipe = r.pipeline()
    if settings.REDIS_SCAN_TTL > 0:
        pipe.setex(key, settings.REDIS_SCAN_TTL, _serialize(record))
    else:
        pipe.set(key, _serialize(record))
    pipe.execute()


# -----------------------------------------------------------
# Async Redis client (used in FastAPI route handlers)
# -----------------------------------------------------------

# Populated during the app lifespan.
_async_redis: aioredis.Redis | None = None


async def _aget_record(scan_id: str) -> dict:
    """Fetch and deserialise a scan record from Redis (async)."""
    raw = await _async_redis.get(_scan_key(scan_id))
    if raw is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scan '{scan_id}' not found.",
        )
    return _deserialize(raw)


# -----------------------------------------------------------
# App lifespan – open/close the async Redis pool
# -----------------------------------------------------------

@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _async_redis
    _async_redis = aioredis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
    )
    try:
        await _async_redis.ping()
    except Exception as exc:
        raise RuntimeError(
            f"Cannot connect to Redis at "
            f"{settings.REDIS_HOST}:{settings.REDIS_PORT} — {exc}"
        ) from exc

    yield

    await _async_redis.aclose()


# -----------------------------------------------------------
# App setup
# -----------------------------------------------------------

app = FastAPI(title="QScan API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------
# Enums & schemas
# -----------------------------------------------------------

class ScanStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"


class StartScanRequest(BaseModel):
    target: str
    scan_types: list[str] = []
    discover: bool = False
    ports: Optional[list[int]] = None


class StartScanResponse(BaseModel):
    scan_id: str
    status: ScanStatus
    message: str


class ScanStatusResponse(BaseModel):
    scan_id: str
    status: ScanStatus
    progress: int
    logs: list[str]
    error: Optional[str]


class ScanResultsResponse(BaseModel):
    scan_id: str
    target: str
    cbom: Optional[dict]
    scan_results: Optional[list]
    assets_found: int
    risk_score: Optional[float]


class CbomResponse(BaseModel):
    metadata: Optional[dict]
    summary: Optional[dict]
    crypto_assets: Optional[list]


class HistoryItem(BaseModel):
    scan_id: str
    target: str
    timestamp: str
    assets_found: int
    risk_score: Optional[float]
    status: ScanStatus


class DeleteResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str


# -----------------------------------------------------------
# Background worker
# -----------------------------------------------------------

def _append_log(record: dict, line: str) -> None:
    """Append a timestamped log line to the local in-memory record."""
    record["logs"].append(f"[{datetime.now(timezone.utc).isoformat()}] {line}")


def _run_qscan(scan_id: str, target: str, discover: bool, output_dir: str, ports: list[int] | None = None) -> None:
    """
    Blocking worker — executed via asyncio.to_thread so the event loop
    stays free.

    Strategy
    --------
    • Keep the mutable record in a local dict during the run.
    • Write to Redis at two checkpoints (start / finish) to minimise
      round trips while keeping polling clients reasonably up-to-date.
    • Delete output_dir immediately after the JSON files have been parsed
      (or if the process fails) — no temp data is left on disk after the
      worker exits.
    """
    r = _sync_redis()

    record: dict = {
        "scan_id":      scan_id,
        "target":       target,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "status":       ScanStatus.RUNNING,
        "progress":     10,
        "logs":         [],
        "error":        None,
        "cbom":         None,
        "scan_results": None,
        "assets_data":  None,
        "assets_found": 0,
        "risk_score":   None,
    }

    cmd = ["qscan", "--domain", target, "--output", output_dir, "--cbom"]
    if discover:
        cmd.append("--discover")
    if ports:
        cmd.extend(["--ports", ",".join(str(p) for p in ports)])

    _append_log(record, f"Running: {' '.join(cmd)}")
    _redis_save(r, record) # checkpoint 1 – RUNNING

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=settings.QSCAN_TIMEOUT,
        )

        if proc.stdout:
            for line in proc.stdout.splitlines():
                _append_log(record, line)
        if proc.stderr:
            for line in proc.stderr.splitlines():
                _append_log(record, f"[stderr] {line}")

        record["progress"] = 70

        if proc.returncode != 0:
            raise RuntimeError(f"qscan exited with code {proc.returncode}")

        # -------------------------------------------------------
        # Parse output files then delete the temp directory
        # -------------------------------------------------------
        cbom_path = os.path.join(output_dir, "cbom.json")
        results_path = os.path.join(output_dir, "scan_results.json")
        assets_path = os.path.join(output_dir, "discovered_assets.json")

        cbom_data = _read_json(cbom_path)
        results_data = _read_json(results_path)
        assets_data = _read_json(assets_path) if os.path.exists(assets_path) else None

        record["cbom"] = cbom_data
        record["scan_results"] = results_data if isinstance(results_data, list) else [results_data]
        record["assets_data"] = assets_data

        if isinstance(results_data, list) and results_data:
            record["risk_score"] = results_data[0].get("quantum_risk_score")
        elif cbom_data:
            record["risk_score"] = cbom_data.get("summary", {}).get("average_risk_score")

        if cbom_data:
            record["assets_found"] = cbom_data.get("metadata", {}).get("total_assets_scanned", 0)

        record["progress"] = 100
        record["status"] = ScanStatus.COMPLETED
        _append_log(record, "Scan completed successfully.")

    except subprocess.TimeoutExpired:
        record["status"] = ScanStatus.FAILED
        record["error"] = f"qscan timed out after {settings.QSCAN_TIMEOUT} seconds."
        _append_log(record, record["error"])

    except Exception as exc:
        record["status"] = ScanStatus.FAILED
        record["error"] = str(exc)
        _append_log(record, f"Error: {exc}")

    finally:
        # Delete the temp dir immediately — all data now lives in Redis.
        shutil.rmtree(output_dir, ignore_errors=True)
        _append_log(record, f"Cleaned up temp directory: {output_dir}")

        _redis_save(r, record) # checkpoint 2 – final state
        r.close()


def _read_json(path: str):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


async def _run_qscan_async(scan_id: str, target: str, discover: bool, output_dir: str, ports: list[int] | None = None) -> None:
    await asyncio.to_thread(_run_qscan, scan_id, target, discover, output_dir, ports)


# -----------------------------------------------------------
# Routes
# -----------------------------------------------------------

@app.get("/api/v1/health", response_model=HealthResponse)
async def health():
    await _async_redis.ping()
    return {"status": "ok"}


@app.post("/api/v1/scan", response_model=StartScanResponse, status_code=202)
async def start_scan(body: StartScanRequest, background_tasks: BackgroundTasks):
    scan_id    = str(uuid.uuid4())
    output_dir = tempfile.mkdtemp(prefix=f"qscan_{scan_id}_")
    discover   = body.discover or ("discover" in body.scan_types)

    # Write an initial PENDING record so polling works immediately.
    initial: dict = {
        "scan_id":      scan_id,
        "target":       body.target,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "status":       ScanStatus.PENDING,
        "progress":     0,
        "logs":         [],
        "error":        None,
        "cbom":         None,
        "scan_results": None,
        "assets_data":  None,
        "assets_found": 0,
        "risk_score":   None,
    }

    key = _scan_key(scan_id)
    pipe = _async_redis.pipeline()
    if settings.REDIS_SCAN_TTL > 0:
        pipe.setex(key, settings.REDIS_SCAN_TTL, _serialize(initial))
    else:
        pipe.set(key, _serialize(initial))
    pipe.rpush(SCANS_INDEX_KEY, scan_id)
    await pipe.execute()

    background_tasks.add_task(
        _run_qscan_async,
        scan_id,
        body.target,
        discover,
        output_dir,
        body.ports,
    )

    return {
        "scan_id": scan_id,
        "status":  ScanStatus.PENDING,
        "message": f"Scan queued for target '{body.target}'.",
    }


@app.get("/api/v1/scan/{scan_id}", response_model=ScanStatusResponse)
async def get_scan_status(scan_id: str):
    record = await _aget_record(scan_id)
    return {
        "scan_id":  scan_id,
        "status":   record["status"],
        "progress": record["progress"],
        "logs":     record["logs"],
        "error":    record["error"],
    }


@app.get("/api/v1/scan/{scan_id}/results", response_model=ScanResultsResponse)
async def get_scan_results(scan_id: str):
    record = await _aget_record(scan_id)
    _require_completed(record)
    return {
        "scan_id":      scan_id,
        "target":       record["target"],
        "cbom":         record["cbom"],
        "scan_results": record["scan_results"],
        "assets_found": record["assets_found"],
        "risk_score":   record["risk_score"],
    }


@app.get("/api/v1/scan/{scan_id}/cbom", response_model=CbomResponse)
async def get_cbom(scan_id: str):
    record = await _aget_record(scan_id)
    _require_completed(record)
    cbom = record["cbom"] or {}
    return {
        "metadata":      cbom.get("metadata"),
        "summary":       cbom.get("summary"),
        "crypto_assets": cbom.get("crypto_assets"),
    }


@app.get("/api/v1/history", response_model=list[HistoryItem])
async def get_history():
    scan_ids = await _async_redis.lrange(SCANS_INDEX_KEY, 0, -1)
    if not scan_ids:
        return []

    # Batch-fetch all records in one round trip.
    keys = [_scan_key(sid) for sid in scan_ids]
    raws = await _async_redis.mget(*keys)

    history = []
    for sid, raw in zip(scan_ids, raws):
        if raw is None:
            # Record expired or was manually deleted — prune stale index entry.
            await _async_redis.lrem(SCANS_INDEX_KEY, 0, sid)
            continue
        record = _deserialize(raw)
        history.append({
            "scan_id":      record["scan_id"],
            "target":       record["target"],
            "timestamp":    record["timestamp"],
            "assets_found": record["assets_found"],
            "risk_score":   record["risk_score"],
            "status":       record["status"],
        })

    # Most-recent first.
    history.reverse()
    return history


@app.delete("/api/v1/scan/{scan_id}", response_model=DeleteResponse)
async def delete_scan(scan_id: str):
    await _aget_record(scan_id)          # raises 404 if not found

    pipe = _async_redis.pipeline()
    pipe.delete(_scan_key(scan_id))
    pipe.lrem(SCANS_INDEX_KEY, 0, scan_id)
    await pipe.execute()

    return {"message": f"Scan {scan_id} deleted."}


# -----------------------------------------------------------
# Helpers
# -----------------------------------------------------------

def _require_completed(record: dict) -> None:
    if record["status"] != ScanStatus.COMPLETED:
        raise HTTPException(
            status_code=409,
            detail=f"Scan is not completed yet (status: {record['status']}).",
        )


# -----------------------------------------------------------
# Entry point
# -----------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
    )
