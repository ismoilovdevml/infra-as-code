from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import yaml
import configparser
import subprocess
import asyncio
from pathlib import Path
import uuid
from datetime import datetime
import json
import time

app = FastAPI(title="Ansible Dashboard v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store for running jobs
jobs_store: Dict[str, Dict[str, Any]] = {}

# History store (persistent)
HISTORY_FILE = Path("/tmp/ansible_dashboard_history.json")
history_store: List[Dict[str, Any]] = []

# Base paths
if Path("/app/Ansible").exists():
    ANSIBLE_BASE = Path("/app/Ansible")
else:
    ANSIBLE_BASE = Path(__file__).parent.parent.parent / "Ansible"

# Load history on startup
def load_history():
    global history_store
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r') as f:
                history_store = json.load(f)
        except:
            history_store = []
    else:
        history_store = []

def save_history():
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history_store[-100:], f)  # Keep last 100 executions
    except:
        pass

load_history()

class InventoryEntry(BaseModel):
    name: str
    host: str
    user: str
    group: str

class AnsibleFolder(BaseModel):
    name: str
    path: str
    has_inventory: bool
    has_vars: bool
    has_playbooks: bool
    playbooks: List[str]

class PlaybookRequest(BaseModel):
    folder: str
    playbook: str
    inventory: str
    vars: Dict[str, Any]

class JobStatus(BaseModel):
    job_id: str
    status: str
    output: str
    started_at: str
    completed_at: Optional[str]
    return_code: Optional[int] = None
    duration: Optional[float] = None
    folder: str
    playbook: str

@app.get("/")
async def root():
    return {"message": "Ansible Dashboard API v2", "version": "2.0.0"}

@app.get("/api/folders", response_model=List[AnsibleFolder])
async def get_ansible_folders():
    """Get all Ansible folders with their details"""
    folders = []

    if not ANSIBLE_BASE.exists():
        return folders

    for folder in ANSIBLE_BASE.iterdir():
        if folder.is_dir() and not folder.name.startswith('.'):
            playbooks = []
            has_inventory = False
            has_vars = False

            # Check for inventory files
            if (folder / "inventory.ini").exists() or (folder / "hosts").exists():
                has_inventory = True

            # Check for vars files
            if (folder / "vars.yml").exists() or (folder / "variables.yml").exists():
                has_vars = True

            # Find playbook files
            for file in folder.glob("*.yml"):
                if file.name not in ["vars.yml", "variables.yml"]:
                    playbooks.append(file.name)

            folders.append(AnsibleFolder(
                name=folder.name,
                path=str(folder),
                has_inventory=has_inventory,
                has_vars=has_vars,
                has_playbooks=len(playbooks) > 0,
                playbooks=playbooks
            ))

    return sorted(folders, key=lambda x: x.name)

@app.get("/api/folders/{folder_name}/inventory")
async def get_inventory(folder_name: str):
    """Parse and return inventory file content"""
    folder_path = ANSIBLE_BASE / folder_name

    inventory_file = folder_path / "inventory.ini"
    if not inventory_file.exists():
        inventory_file = folder_path / "hosts"

    if not inventory_file.exists():
        raise HTTPException(status_code=404, detail="Inventory file not found")

    config = configparser.ConfigParser(allow_no_value=True)
    config.read(inventory_file)

    inventory_data = {}
    for section in config.sections():
        hosts = []
        for key in config[section]:
            parts = key.split()
            host_info = {"name": parts[0] if parts else key}

            for part in parts[1:]:
                if "=" in part:
                    k, v = part.split("=", 1)
                    host_info[k] = v

            hosts.append(host_info)
        inventory_data[section] = hosts

    return {
        "content": inventory_data,
        "raw": inventory_file.read_text()
    }

@app.get("/api/folders/{folder_name}/vars")
async def get_vars(folder_name: str):
    """Parse and return vars file content"""
    folder_path = ANSIBLE_BASE / folder_name

    vars_file = folder_path / "vars.yml"
    if not vars_file.exists():
        vars_file = folder_path / "variables.yml"

    if not vars_file.exists():
        raise HTTPException(status_code=404, detail="Vars file not found")

    with open(vars_file, 'r') as f:
        vars_data = yaml.safe_load(f) or {}

    return {
        "content": vars_data,
        "raw": vars_file.read_text()
    }

@app.post("/api/folders/{folder_name}/inventory")
async def update_inventory(folder_name: str, content: Dict[str, Any]):
    """Update inventory file"""
    folder_path = ANSIBLE_BASE / folder_name
    inventory_file = folder_path / "inventory.ini"

    if "raw" in content:
        inventory_file.write_text(content["raw"])
    else:
        lines = []
        for group, hosts in content.items():
            lines.append(f"[{group}]")
            for host in hosts:
                host_line = host.get("name", "")
                for key, value in host.items():
                    if key != "name":
                        host_line += f" {key}={value}"
                lines.append(host_line)
            lines.append("")

        inventory_file.write_text("\n".join(lines))

    return {"success": True}

@app.post("/api/folders/{folder_name}/vars")
async def update_vars(folder_name: str, content: Dict[str, Any]):
    """Update vars file"""
    folder_path = ANSIBLE_BASE / folder_name
    vars_file = folder_path / "vars.yml"

    if "raw" in content:
        vars_file.write_text(content["raw"])
    else:
        with open(vars_file, 'w') as f:
            yaml.dump(content, f, default_flow_style=False)

    return {"success": True}

async def run_ansible_playbook(job_id: str, folder: str, playbook: str, inventory: str):
    """Run ansible playbook in background with detailed output"""
    folder_path = ANSIBLE_BASE / folder
    playbook_path = folder_path / playbook
    inventory_path = folder_path / inventory

    jobs_store[job_id]["status"] = "running"
    start_time = time.time()

    try:
        # Run with ANSI colors enabled
        env = os.environ.copy()
        env['ANSIBLE_FORCE_COLOR'] = 'true'

        process = await asyncio.create_subprocess_exec(
            "ansible-playbook",
            "-i", str(inventory_path),
            str(playbook_path),
            cwd=str(folder_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )

        output, _ = await process.communicate()
        duration = time.time() - start_time

        jobs_store[job_id]["output"] = output.decode()
        jobs_store[job_id]["status"] = "completed" if process.returncode == 0 else "failed"
        jobs_store[job_id]["completed_at"] = datetime.now().isoformat()
        jobs_store[job_id]["return_code"] = process.returncode
        jobs_store[job_id]["duration"] = round(duration, 2)

        # Save to history
        history_entry = {
            "job_id": job_id,
            "folder": folder,
            "playbook": playbook,
            "status": jobs_store[job_id]["status"],
            "started_at": jobs_store[job_id]["started_at"],
            "completed_at": jobs_store[job_id]["completed_at"],
            "duration": jobs_store[job_id]["duration"],
            "return_code": process.returncode,
            "output_preview": output.decode()[:500]  # Store first 500 chars
        }
        history_store.append(history_entry)
        save_history()

    except Exception as e:
        duration = time.time() - start_time
        jobs_store[job_id]["status"] = "error"
        jobs_store[job_id]["output"] = str(e)
        jobs_store[job_id]["completed_at"] = datetime.now().isoformat()
        jobs_store[job_id]["duration"] = round(duration, 2)

@app.post("/api/run")
async def run_playbook(request: PlaybookRequest, background_tasks: BackgroundTasks):
    """Run ansible playbook"""
    job_id = str(uuid.uuid4())

    jobs_store[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "output": "",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "folder": request.folder,
        "playbook": request.playbook,
        "duration": None,
        "return_code": None
    }

    # Update vars if provided
    if request.vars:
        folder_path = ANSIBLE_BASE / request.folder
        vars_file = folder_path / "vars.yml"
        with open(vars_file, 'w') as f:
            yaml.dump(request.vars, f, default_flow_style=False)

    background_tasks.add_task(
        run_ansible_playbook,
        job_id,
        request.folder,
        request.playbook,
        request.inventory
    )

    return {"job_id": job_id}

@app.get("/api/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get job status"""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")

    return jobs_store[job_id]

@app.get("/api/jobs")
async def get_all_jobs():
    """Get all active jobs"""
    return list(jobs_store.values())

@app.get("/api/history")
async def get_history(limit: int = 50):
    """Get execution history"""
    return history_store[-limit:][::-1]  # Return last N, newest first

@app.get("/api/history/{job_id}")
async def get_history_item(job_id: str):
    """Get specific history item"""
    for item in history_store:
        if item["job_id"] == job_id:
            # Try to get full output from jobs_store if still available
            if job_id in jobs_store:
                item["output"] = jobs_store[job_id]["output"]
            return item
    raise HTTPException(status_code=404, detail="History item not found")

@app.get("/api/statistics")
async def get_statistics():
    """Get execution statistics"""
    total = len(history_store)
    if total == 0:
        return {
            "total_executions": 0,
            "successful": 0,
            "failed": 0,
            "success_rate": 0,
            "average_duration": 0,
            "most_used_folders": [],
            "recent_activity": []
        }

    successful = sum(1 for h in history_store if h["status"] == "completed")
    failed = sum(1 for h in history_store if h["status"] == "failed")

    durations = [h.get("duration", 0) for h in history_store if h.get("duration")]
    avg_duration = sum(durations) / len(durations) if durations else 0

    # Most used folders
    folder_counts = {}
    for h in history_store:
        folder = h["folder"]
        folder_counts[folder] = folder_counts.get(folder, 0) + 1

    most_used = sorted(folder_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Recent activity (last 24 hours)
    now = datetime.now()
    recent = []
    for h in history_store[-20:]:
        try:
            started = datetime.fromisoformat(h["started_at"])
            hours_ago = (now - started).total_seconds() / 3600
            if hours_ago <= 24:
                recent.append(h)
        except:
            pass

    return {
        "total_executions": total,
        "successful": successful,
        "failed": failed,
        "success_rate": round((successful / total * 100) if total > 0 else 0, 1),
        "average_duration": round(avg_duration, 2),
        "most_used_folders": [{"name": name, "count": count} for name, count in most_used],
        "recent_activity": recent[::-1]
    }

@app.delete("/api/history")
async def clear_history():
    """Clear execution history"""
    global history_store
    history_store = []
    save_history()
    return {"success": True, "message": "History cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)