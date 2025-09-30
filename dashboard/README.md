# Ansible Dashboard

Modern web dashboard for managing and running Ansible playbooks.

## Features

- 📁 Browse all Ansible folders
- 📝 Edit inventory.ini and vars.yml files
- ▶️ Run playbooks with one click
- 📊 Real-time execution output
- 🔄 Auto-refresh job status
- 🎨 Modern, responsive UI

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (for containerized deployment)
- Ansible installed (for local development)

## Quick Start

### Using Docker Compose (Recommended)

```bash
cd dashboard
docker-compose up -d
```

Access the dashboard at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Local Development

#### Backend

```bash
cd dashboard/backend
pip install -r requirements.txt
python app.py
```

Backend will run on http://localhost:8000

#### Frontend

```bash
cd dashboard/frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

## Tested Features ✅

The dashboard has been fully tested and verified working:

- ✅ Docker Compose build and deployment
- ✅ Backend API serving on port 8000
- ✅ Frontend serving on port 3000 (Modern Dark/Green Theme)
- ✅ Container networking (backend ↔ frontend proxy)
- ✅ Ansible folder scanning (43 folders detected)
- ✅ Inventory.ini parsing and editing
- ✅ Vars.yml parsing and editing (Form + YAML mode)
- ✅ Playbook listing and selection
- ✅ Real-time job execution and output

### UI Features

- 🎨 Modern dark theme with green accents
- 🔍 Folder search functionality
- 📝 Dual-mode variable editor (Form & YAML)
- 💾 Save inventory and variables
- ▶️ One-click playbook execution
- 📊 Real-time execution output with status
- 📱 Responsive design

### Test Results

```bash
# Backend API Test
curl http://localhost:8000/api/folders | jq 'length'
# Returns: 43

# Keepalived Vars Test
curl http://localhost:8000/api/folders/keepalived/vars | jq '.content | keys'
# Returns: ["advert_int", "auth_pass", "interface", "master_priority",
#           "slave_priority", "virtual_ipaddress", "virtual_router_id"]

# Keepalived Inventory Test
curl http://localhost:8000/api/folders/keepalived/inventory
# Returns: master and slave groups with hosts
```

### Screenshots

Frontend displays:
- Left sidebar: 43 Ansible folders with search
- Main panel: Playbook execution, variables editor, inventory editor
- Terminal output: Real-time Ansible execution logs
- Theme: Dark gray background with green highlights

## Testing with Molecule (Optional)

```bash
cd dashboard
pip install molecule molecule-docker ansible-core
molecule test
```

## Usage

1. **Select Folder**: Choose an Ansible folder from the left sidebar
2. **Edit Variables**: Modify vars.yml using form or YAML editor
3. **Edit Inventory**: Update inventory.ini file if needed
4. **Select Playbook**: Choose which playbook to run
5. **Run**: Click the Run button and watch real-time output

## API Endpoints

- `GET /api/folders` - List all Ansible folders
- `GET /api/folders/{name}/inventory` - Get inventory content
- `GET /api/folders/{name}/vars` - Get variables content
- `POST /api/folders/{name}/inventory` - Update inventory
- `POST /api/folders/{name}/vars` - Update variables
- `POST /api/run` - Execute playbook
- `GET /api/jobs/{id}` - Get job status
- `GET /api/jobs` - List all jobs

## Architecture

```
dashboard/
├── backend/           # FastAPI backend
│   ├── app.py        # Main API application
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx  # Main component
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── molecule/         # Molecule tests
│   └── default/
│       ├── molecule.yml
│       ├── converge.yml
│       └── verify.yml
└── docker-compose.yml
```

## Security Notes

- This dashboard is intended for internal use only
- Ensure proper network security and access controls
- SSH keys should be properly managed
- Inventory files may contain sensitive information

## License

MIT