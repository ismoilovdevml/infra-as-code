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

app = FastAPI(title="Ansible Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store for running jobs
jobs_store: Dict[str, Dict[str, Any]] = {}

# Base paths
# Check if running in Docker (Ansible folder is mounted at /app/Ansible)
if Path("/app/Ansible").exists():
    ANSIBLE_BASE = Path("/app/Ansible")
else:
    ANSIBLE_BASE = Path(__file__).parent.parent.parent / "Ansible"

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

@app.get("/")
async def root():
    return {"message": "Ansible Dashboard API"}

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
            # Parse inventory line
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
        # Save raw content
        inventory_file.write_text(content["raw"])
    else:
        # Generate from structured data
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
    """Run ansible playbook in background"""
    folder_path = ANSIBLE_BASE / folder
    playbook_path = folder_path / playbook
    inventory_path = folder_path / inventory

    jobs_store[job_id]["status"] = "running"

    try:
        # Change to the folder directory to respect ansible.cfg
        process = await asyncio.create_subprocess_exec(
            "ansible-playbook",
            "-i", str(inventory_path),
            str(playbook_path),
            cwd=str(folder_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )

        output, _ = await process.communicate()

        jobs_store[job_id]["output"] = output.decode()
        jobs_store[job_id]["status"] = "completed" if process.returncode == 0 else "failed"
        jobs_store[job_id]["completed_at"] = datetime.now().isoformat()
        jobs_store[job_id]["return_code"] = process.returncode

    except Exception as e:
        jobs_store[job_id]["status"] = "error"
        jobs_store[job_id]["output"] = str(e)
        jobs_store[job_id]["completed_at"] = datetime.now().isoformat()

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
        "playbook": request.playbook
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
    """Get all jobs"""
    return list(jobs_store.values())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)