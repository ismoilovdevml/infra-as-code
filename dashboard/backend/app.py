import asyncio
import json
import logging
import os
import time
import uuid
from collections import OrderedDict
from datetime import datetime
from typing import Any, Dict, List, Optional

import yaml
from fastapi import APIRouter, BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import config
from auth import require_token
from inventory import parse_inventory
from paths import folder_path, is_playbook, iter_module_folders

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ansible-dashboard")

app = FastAPI(title="Ansible Dashboard", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Every /api route requires a bearer token. /health deliberately does not, so
# container health checks work without embedding the token.
api = APIRouter(prefix="/api", dependencies=[Depends(require_token)])

jobs_store: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
history_store: List[Dict[str, Any]] = []


# --------------------------------------------------------------------- history
def load_history() -> None:
    global history_store
    if not config.HISTORY_FILE.exists():
        history_store = []
        return
    try:
        history_store = json.loads(config.HISTORY_FILE.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("Could not read history (%s); starting empty", exc)
        history_store = []


def save_history() -> None:
    try:
        config.DATA_DIR.mkdir(parents=True, exist_ok=True)
        config.HISTORY_FILE.write_text(json.dumps(history_store[-config.HISTORY_LIMIT:]))
        config.HISTORY_FILE.chmod(0o600)
    except OSError as exc:
        log.warning("Could not write history: %s", exc)


load_history()


@app.on_event("startup")
async def announce_token() -> None:
    log.info("Ansible base: %s", config.ANSIBLE_BASE)
    if config.TOKEN_WAS_GENERATED:
        log.warning(
            "DASHBOARD_TOKEN was not set; generated one for this process only:\n\n    %s\n\n"
            "Set DASHBOARD_TOKEN in the environment to keep it stable across restarts.",
            config.DASHBOARD_TOKEN,
        )
    if config.CHECK_MODE_ONLY:
        log.info("DASHBOARD_CHECK_MODE_ONLY is on: every run is forced to --check")


# ---------------------------------------------------------------------- models
class AnsibleFolder(BaseModel):
    name: str
    path: str
    has_inventory: bool
    has_vars: bool
    has_playbooks: bool
    playbooks: List[str]


class FileContent(BaseModel):
    raw: str


class PlaybookRequest(BaseModel):
    folder: str
    playbook: str
    inventory: str = "inventory.ini"
    check: bool = False
    diff: bool = False
    tags: Optional[str] = None
    limit: Optional[str] = None
    extra_vars: Dict[str, Any] = Field(default_factory=dict)


class JobStatus(BaseModel):
    job_id: str
    status: str
    output: str
    started_at: str
    completed_at: Optional[str] = None
    return_code: Optional[int] = None
    duration: Optional[float] = None
    folder: str
    playbook: str
    command: Optional[str] = None


# ----------------------------------------------------------------------- meta
@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "ansible_base": str(config.ANSIBLE_BASE),
        "ansible_base_exists": config.ANSIBLE_BASE.exists(),
        "check_mode_only": config.CHECK_MODE_ONLY,
        "vault_configured": bool(config.VAULT_PASSWORD_FILE),
    }


@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "Ansible Dashboard API", "version": "3.0.0"}


# -------------------------------------------------------------------- folders
@api.get("/folders", response_model=List[AnsibleFolder])
async def get_folders() -> List[AnsibleFolder]:
    folders = []
    for name, path in iter_module_folders():
        playbooks = sorted(p.name for p in path.glob("*.yml") if is_playbook(p))
        folders.append(
            AnsibleFolder(
                name=name,
                path=str(path),
                has_inventory=(path / "inventory.ini").exists() or (path / "hosts").exists(),
                has_vars=(path / "vars.yml").exists() or (path / "variables.yml").exists(),
                has_playbooks=bool(playbooks),
                playbooks=playbooks,
            )
        )
    return folders


@api.get("/folders/{folder_name:path}/inventory")
async def get_inventory(folder_name: str) -> Dict[str, Any]:
    path = folder_path(folder_name)
    inventory_file = path / "inventory.ini"
    if not inventory_file.exists():
        inventory_file = path / "hosts"
    if not inventory_file.exists():
        raise HTTPException(status_code=404, detail="Inventory file not found")

    raw = inventory_file.read_text()
    return {"content": parse_inventory(raw), "raw": raw}


@api.get("/folders/{folder_name:path}/vars")
async def get_vars(folder_name: str) -> Dict[str, Any]:
    path = folder_path(folder_name)
    vars_file = path / "vars.yml"
    if not vars_file.exists():
        vars_file = path / "variables.yml"
    if not vars_file.exists():
        raise HTTPException(status_code=404, detail="Vars file not found")

    raw = vars_file.read_text()
    try:
        parsed = yaml.safe_load(raw) or {}
    except yaml.YAMLError as exc:
        parsed = {}
        log.info("vars file %s not parseable: %s", vars_file, exc)

    return {"content": parsed, "raw": raw}


# Writes are raw-text only, on purpose. Round-tripping through yaml.safe_load and
# yaml.dump silently discards every comment in the file, and these vars.yml files
# carry the reasoning behind each setting.
@api.post("/folders/{folder_name:path}/vars")
async def update_vars(folder_name: str, body: FileContent) -> Dict[str, Any]:
    path = folder_path(folder_name)
    vars_file = path / "vars.yml"
    if not vars_file.exists() and (path / "variables.yml").exists():
        vars_file = path / "variables.yml"

    try:
        yaml.safe_load(body.raw)
    except yaml.YAMLError as exc:
        raise HTTPException(status_code=400, detail=f"Not valid YAML: {exc}")

    vars_file.write_text(body.raw)
    return {"success": True, "path": str(vars_file)}


@api.post("/folders/{folder_name:path}/inventory")
async def update_inventory(folder_name: str, body: FileContent) -> Dict[str, Any]:
    path = folder_path(folder_name)
    inventory_file = path / "inventory.ini"
    if not inventory_file.exists() and (path / "hosts").exists():
        inventory_file = path / "hosts"

    inventory_file.write_text(body.raw)
    return {"success": True, "path": str(inventory_file)}


# ------------------------------------------------------------------------ run
def _build_command(req: PlaybookRequest, path, playbook, inventory) -> List[str]:
    cmd = ["ansible-playbook", "-i", str(inventory), str(playbook)]

    if req.check or config.CHECK_MODE_ONLY:
        cmd.append("--check")
    if req.diff:
        cmd.append("--diff")
    if req.tags:
        cmd += ["--tags", req.tags]
    if req.limit:
        cmd += ["--limit", req.limit]
    # Playbooks in this repository assert on vault-backed variables, so without a
    # vault password file they fail fast rather than running half-configured.
    if config.VAULT_PASSWORD_FILE:
        cmd += ["--vault-password-file", config.VAULT_PASSWORD_FILE]
    for key, value in req.extra_vars.items():
        cmd += ["--extra-vars", f"{key}={value}"]
    return cmd


async def run_playbook_job(job_id: str, req: PlaybookRequest) -> None:
    job = jobs_store[job_id]
    path = config.ANSIBLE_BASE.joinpath(*req.folder.split("/"))
    playbook = path / req.playbook
    inventory = path / req.inventory

    cmd = _build_command(req, path, playbook, inventory)
    job["command"] = " ".join(cmd)
    job["status"] = "running"
    started = time.time()

    env = os.environ.copy()
    env["ANSIBLE_FORCE_COLOR"] = "true"
    env["ANSIBLE_HOST_KEY_CHECKING"] = env.get("ANSIBLE_HOST_KEY_CHECKING", "False")

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
        )
        try:
            stdout, _ = await asyncio.wait_for(
                process.communicate(), timeout=config.RUN_TIMEOUT
            )
            output = stdout.decode(errors="replace")
            returncode = process.returncode
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            output = f"Timed out after {config.RUN_TIMEOUT}s and was killed."
            returncode = -1

        job["output"] = output
        job["return_code"] = returncode
        job["status"] = "completed" if returncode == 0 else "failed"
    except FileNotFoundError:
        job["output"] = "ansible-playbook is not installed or not on PATH."
        job["status"] = "error"
        job["return_code"] = None
    except OSError as exc:
        job["output"] = f"Could not start ansible-playbook: {exc}"
        job["status"] = "error"
        job["return_code"] = None

    job["completed_at"] = datetime.now().isoformat()
    job["duration"] = round(time.time() - started, 2)

    history_store.append(
        {
            "job_id": job_id,
            "folder": req.folder,
            "playbook": req.playbook,
            "status": job["status"],
            "started_at": job["started_at"],
            "completed_at": job["completed_at"],
            "duration": job["duration"],
            "return_code": job["return_code"],
            "command": job["command"],
            "output_preview": job["output"][:500],
        }
    )
    del history_store[:-config.HISTORY_LIMIT]
    save_history()


@api.post("/run")
async def run_playbook(req: PlaybookRequest, background_tasks: BackgroundTasks) -> Dict[str, str]:
    path = folder_path(req.folder)

    playbook = path / req.playbook
    if "/" in req.playbook or not is_playbook(playbook) or not playbook.is_file():
        raise HTTPException(status_code=400, detail=f"Not a playbook in {req.folder}: {req.playbook}")

    inventory = path / req.inventory
    if "/" in req.inventory or not inventory.is_file():
        raise HTTPException(status_code=400, detail=f"Inventory not found: {req.inventory}")

    job_id = str(uuid.uuid4())
    jobs_store[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "output": "",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "folder": req.folder,
        "playbook": req.playbook,
        "duration": None,
        "return_code": None,
        "command": None,
    }
    while len(jobs_store) > config.JOBS_LIMIT:
        jobs_store.popitem(last=False)

    background_tasks.add_task(run_playbook_job, job_id, req)
    return {"job_id": job_id}


@api.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str) -> Dict[str, Any]:
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_store[job_id]


@api.get("/jobs")
async def get_jobs() -> List[Dict[str, Any]]:
    return list(jobs_store.values())


# -------------------------------------------------------------------- history
@api.get("/history")
async def get_history(limit: int = 50) -> List[Dict[str, Any]]:
    limit = max(1, min(limit, config.HISTORY_LIMIT))
    return history_store[-limit:][::-1]


@api.get("/history/{job_id}")
async def get_history_item(job_id: str) -> Dict[str, Any]:
    for item in history_store:
        if item["job_id"] == job_id:
            enriched = dict(item)
            if job_id in jobs_store:
                enriched["output"] = jobs_store[job_id]["output"]
            return enriched
    raise HTTPException(status_code=404, detail="History item not found")


@api.delete("/history")
async def clear_history() -> Dict[str, Any]:
    history_store.clear()
    save_history()
    return {"success": True, "message": "History cleared"}


@api.get("/statistics")
async def get_statistics() -> Dict[str, Any]:
    total = len(history_store)
    if total == 0:
        return {
            "total_executions": 0,
            "successful": 0,
            "failed": 0,
            "success_rate": 0,
            "average_duration": 0,
            "most_used_folders": [],
            "recent_activity": [],
        }

    successful = sum(1 for h in history_store if h["status"] == "completed")
    failed = sum(1 for h in history_store if h["status"] == "failed")
    durations = [h["duration"] for h in history_store if h.get("duration")]

    folder_counts: Dict[str, int] = {}
    for h in history_store:
        folder_counts[h["folder"]] = folder_counts.get(h["folder"], 0) + 1
    most_used = sorted(folder_counts.items(), key=lambda kv: kv[1], reverse=True)[:5]

    now = datetime.now()
    recent = []
    for h in history_store[-20:]:
        try:
            if (now - datetime.fromisoformat(h["started_at"])).total_seconds() <= 86400:
                recent.append(h)
        except (ValueError, KeyError):
            continue

    return {
        "total_executions": total,
        "successful": successful,
        "failed": failed,
        "success_rate": round(successful / total * 100, 1),
        "average_duration": round(sum(durations) / len(durations), 2) if durations else 0,
        "most_used_folders": [{"name": n, "count": c} for n, c in most_used],
        "recent_activity": recent[::-1],
    }


app.include_router(api)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
