# SonarQube

Deploys SonarQube Community Build and PostgreSQL as a Docker Compose stack, rendered
from the official example compose file.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Any with Docker Engine + Compose plugin | see `Ansible/docker/` |
| RedHat | Any with Docker Engine + Compose plugin | see `Ansible/docker/` |
| Suse | Any with Docker Engine + Compose plugin | see `Ansible/docker/` |

This module does not install Docker itself; it only deploys containers. Docker Engine
and the `docker compose` CLI plugin must already be present (preflight fails otherwise).

## Requirements

- Ansible core >= 2.15
- Collections: `community.docker`, `ansible.posix`
  (`ansible-galaxy collection install -r requirements.yml`)
- Docker Engine + Compose plugin on the target (`Ansible/docker/install_docker.yml`)
- `sudo` on the target
- `vault_sonarqube_db_password` set via `ansible-vault` — the play refuses to run
  while it is empty

## Usage

```bash
ansible-vault encrypt_string 'S3cr3tPass!' --name 'vault_sonarqube_db_password' >> group_vars/vault.yml
ansible-playbook install_with_docker.yml --ask-vault-pass
ansible-playbook install_with_docker.yml --check --diff --ask-vault-pass   # dry-run
ansible-playbook cleanup.yml --ask-vault-pass
ansible-playbook cleanup.yml -e sonarqube_purge_data=true --ask-vault-pass  # also wipe all data
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `sonarqube_image` | `sonarqube:community` | Community Build has no LTA — releases monthly |
| `postgresql_image` | `postgres:17` | PostgreSQL 14-18 supported upstream |
| `sonarqube_port` | `9000` | Host port mapped to the container's 9000 |
| `sonarqube_db_password` | `""` (vault) | `vault_sonarqube_db_password`; asserted non-empty |
| `sonarqube_vm_max_map_count` | `524288` | Host kernel param, embedded Elasticsearch |
| `sonarqube_fs_file_max` | `131072` | Host kernel param, embedded Elasticsearch |
| `sonarqube_purge_data` | `false` | `cleanup.yml` only — deletes the named volumes |

## Verify

```bash
docker compose -f /opt/sonarqube/docker-compose.yml ps
curl -s http://<host>:9000/api/system/status
```

## Notes

- The embedded H2 database still ships as SonarQube's own default but is documented
  upstream as unsuited for production; this module always configures external
  PostgreSQL via `SONAR_JDBC_*`.
- Data is stored in named Docker volumes (`sonarqube_data`, `sonarqube_extensions`,
  `sonarqube_logs`, `sonarqube_temp`, `postgresql`), not host bind mounts, matching the
  official `SonarSource/docker-sonarqube` example.
- First-run web UI credentials are `admin` / `admin`; SonarQube forces a password
  change on first login. This is not a variable in this repository.
- `sonarqube_purge_data=true` deletes every project, analysis and the database.
  There is no confirmation prompt — review before running against production.
