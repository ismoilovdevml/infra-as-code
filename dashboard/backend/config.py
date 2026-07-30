"""Runtime configuration, read once at import."""
import os
import secrets
from pathlib import Path


def _resolve_ansible_base() -> Path:
    override = os.environ.get("ANSIBLE_BASE")
    if override:
        return Path(override).resolve()
    container_path = Path("/app/Ansible")
    if container_path.exists():
        return container_path.resolve()
    return (Path(__file__).parent.parent.parent / "Ansible").resolve()


ANSIBLE_BASE = _resolve_ansible_base()

# Where job history is persisted. /tmp is cleared on reboot and is world-readable,
# so it is only the fallback.
DATA_DIR = Path(os.environ.get("DASHBOARD_DATA_DIR", Path(__file__).parent / "data")).resolve()
HISTORY_FILE = DATA_DIR / "history.json"

# Bearer token required on every /api route. Generated if unset so the service is
# never unauthenticated, but a generated token changes on restart — set it
# explicitly in anything but a throwaway dev run.
DASHBOARD_TOKEN = os.environ.get("DASHBOARD_TOKEN", "").strip()
TOKEN_WAS_GENERATED = False
if not DASHBOARD_TOKEN:
    DASHBOARD_TOKEN = secrets.token_urlsafe(32)
    TOKEN_WAS_GENERATED = True

# "*" with allow_credentials is rejected by browsers, so origins are explicit.
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "DASHBOARD_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]

# Passed to ansible-playbook as --vault-password-file when set.
VAULT_PASSWORD_FILE = os.environ.get("ANSIBLE_VAULT_PASSWORD_FILE", "").strip()

# Hard ceiling on a single playbook run, in seconds.
RUN_TIMEOUT = int(os.environ.get("DASHBOARD_RUN_TIMEOUT", "3600"))

# Refuse to start a run unless it is a --check run. Useful for shared instances.
CHECK_MODE_ONLY = os.environ.get("DASHBOARD_CHECK_MODE_ONLY", "false").lower() == "true"

HISTORY_LIMIT = 200
JOBS_LIMIT = 100
