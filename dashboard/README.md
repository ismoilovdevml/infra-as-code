# Ansible Dashboard

Web UI for browsing, editing and running the playbooks in [../Ansible/](../Ansible/).
FastAPI backend, React frontend.

## What it does

- Lists every module folder, including the nested ones (`Kubernetes/*`,
  `grafana-stack/*`, `percona/*`)
- Edits `inventory.ini` and `vars.yml` — comments and formatting are preserved
- Runs a playbook, optionally as a `--check --diff` dry run, and streams the output
- Keeps execution history and basic statistics

## Security

This service executes `ansible-playbook` against real infrastructure and writes to
files in the repository. Treat it as privileged.

- **A bearer token is required on every `/api` route.** Set `DASHBOARD_TOKEN`. If it
  is unset the backend generates one and logs it at startup, so the API is never
  unauthenticated — but it changes on every restart.
- **Bind it to localhost.** The compose file publishes the UI on `127.0.0.1:3000`
  only. Put it behind an authenticating reverse proxy before exposing it further.
- Folder and file names from the client are resolved against the Ansible directory
  and rejected if they escape it.
- `DASHBOARD_CHECK_MODE_ONLY=true` forces every run to `--check` — worth using on any
  shared instance.

## Quick start

```bash
cp .env.example .env
echo "DASHBOARD_TOKEN=$(openssl rand -base64 32)" >> .env
docker compose up -d --build
```

Open `http://localhost:3000` and paste the token when prompted.

### Local development

```bash
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
DASHBOARD_TOKEN=dev .venv/bin/python -m uvicorn app:app --port 8000 --reload

# frontend, in another shell
cd frontend
npm install
VITE_API_TARGET=http://127.0.0.1:8000 npm run dev
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `DASHBOARD_TOKEN` | generated | Bearer token for the API |
| `ANSIBLE_BASE` | `../Ansible` | Playbook directory |
| `DASHBOARD_DATA_DIR` | `backend/data` | Where history is persisted |
| `ANSIBLE_VAULT_PASSWORD_FILE` | unset | Passed as `--vault-password-file` |
| `DASHBOARD_CHECK_MODE_ONLY` | `false` | Force `--check` on every run |
| `DASHBOARD_RUN_TIMEOUT` | `3600` | Seconds before a run is killed |
| `DASHBOARD_CORS_ORIGINS` | `http://localhost:3000` | Allowed browser origins |

## Vault

Playbooks in this repository keep secrets in Ansible Vault and `assert` on them
before doing anything. Without `ANSIBLE_VAULT_PASSWORD_FILE` those playbooks stop at
the assert with a clear message — that is correct behaviour, not a dashboard fault.
Mount a password file and point the variable at it.

## Editing variables

`vars.yml` files in this repository carry comments explaining each setting. The API
therefore accepts **raw text only**: round-tripping through a YAML parser and dumper
deletes every comment.

The Form view stays usable — edited scalars are patched back into the original text
line by line. Lists and maps are shown read-only and must be edited in YAML mode.

## Notes

- The frontend image builds a static bundle and serves it with nginx, which also
  proxies `/api` to the backend. The previous image ran the Vite dev server.
- The backend container runs as a non-root user and does not publish a host port;
  reach it through the frontend proxy.
- `molecule/` holds a container-based test setup for the dashboard itself and is not
  wired into compose.
