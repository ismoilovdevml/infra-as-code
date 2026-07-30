"""Path resolution that cannot escape ANSIBLE_BASE.

Every folder/file name in this API arrives from an HTTP client. Joining those
directly onto a base path lets `../..` walk anywhere the process can read, and for
the run endpoint that means executing an arbitrary file. Everything goes through
here instead.
"""
from pathlib import Path

from fastapi import HTTPException

from config import ANSIBLE_BASE

# Directories that hold nested module folders rather than playbooks of their own.
_NESTED_PARENTS = {"Kubernetes", "grafana-stack", "percona"}

# Not playbooks, even though they match *.yml.
_NON_PLAYBOOK_FILES = {"vars.yml", "variables.yml", "requirements.yml"}


def safe_join(*parts: str) -> Path:
    """Join onto ANSIBLE_BASE and refuse anything that resolves outside it."""
    for part in parts:
        if not part or part.startswith("/") or "\x00" in part:
            raise HTTPException(status_code=400, detail=f"Invalid path component: {part!r}")

    candidate = ANSIBLE_BASE.joinpath(*parts)
    try:
        resolved = candidate.resolve()
    except (OSError, RuntimeError):
        raise HTTPException(status_code=400, detail="Path could not be resolved")

    if resolved != ANSIBLE_BASE and ANSIBLE_BASE not in resolved.parents:
        raise HTTPException(status_code=403, detail="Path escapes the Ansible directory")

    return resolved


def folder_path(folder_name: str) -> Path:
    """Resolve a module folder, which may be nested (e.g. Kubernetes/helm)."""
    path = safe_join(*folder_name.split("/"))
    if not path.is_dir():
        raise HTTPException(status_code=404, detail=f"Folder not found: {folder_name}")
    return path


def is_playbook(path: Path) -> bool:
    return path.suffix == ".yml" and path.name not in _NON_PLAYBOOK_FILES


def iter_module_folders():
    """Yield every folder that contains playbooks, one nesting level deep.

    The previous version only listed ANSIBLE_BASE's immediate children, so the
    Kubernetes/*, grafana-stack/* and percona/* modules were invisible.
    """
    if not ANSIBLE_BASE.exists():
        return

    for entry in sorted(ANSIBLE_BASE.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue

        if entry.name in _NESTED_PARENTS:
            for child in sorted(entry.iterdir()):
                if child.is_dir() and not child.name.startswith("."):
                    yield f"{entry.name}/{child.name}", child
            continue

        yield entry.name, entry
