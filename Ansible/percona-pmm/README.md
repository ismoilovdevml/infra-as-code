# Percona Monitoring and Management (PMM)

Deploys PMM Server 3.x via Docker, the PMM Client 3.x via either Docker or the
official `repo.percona.com` package, and configures PostgreSQL monitoring
(`pg_stat_monitor`) against a PMM Server. PMM 2 reached EOL on 2025-10-31; this
module targets PMM 3 only.

## Supported platforms

| OS family | Versions | Notes |
| --- | --- | --- |
| Debian | Debian 11+, Ubuntu 20.04+ | `repo.percona.com/apt` release package |
| RedHat | RHEL/Rocky/Alma/CentOS Stream 8+ | `repo.percona.com/yum` release package |
| Suse | not implemented | not documented by a primary Percona source in this pass |

Docker-based playbooks (`pmm_server.yml`, `pmm_client_with_docker.yml`) require
Docker Engine already installed on the target (see `../docker/`).

## Requirements

- Ansible core >= 2.15
- Collections: `community.docker`, `community.postgresql`
  (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on every target
- `pmm_postgresql.yml` requires PostgreSQL already installed and requires the
  PMM client already registered (run `pmm_client_with_package.yml` or
  `pmm_client_with_docker.yml` first)

## Usage

```bash
ansible-playbook pmm_server.yml                  # PMM Server, Docker
ansible-playbook pmm_client_with_package.yml     # PMM Client via repo.percona.com package
ansible-playbook pmm_client_with_docker.yml      # PMM Client, Docker
ansible-playbook pmm_postgresql.yml              # PostgreSQL monitoring setup

ansible-playbook cleanup_server.yml
ansible-playbook cleanup_package.yml
ansible-playbook cleanup_client_docker.yml
ansible-playbook pmm_server.yml --check --diff
```

Set secrets before running:

```bash
ansible-vault edit group_vars/all/vault.yml
# vault_pmm_admin_password: "..."
# vault_postgresql_admin_password: "..."
# vault_pmm_postgresql_password: "..."
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `pmm_image` | `percona/pmm-server:3` | PMM Server image |
| `pmm_server_container_port` | `8443` | 3.x listens internally on 8443, not the PMM-2-era 443 |
| `pmm_client_docker_tag` | `3` | PMM Client image tag |
| `pmm_client_package` | `pmm-client` | PMM 3 package name (was `pmm2-client` in PMM 2) |
| `percona_release_pmm_component` | `pmm3-client` | Component enabled via `percona-release enable` before installing the client |
| `admin_password` | vault-backed, empty | PMM Server admin password; every playbook that uses it asserts non-empty |
| `postgresql_version` | `17` | Selects the `percona-pg-stat-monitor<version>` package and PGDG/Percona repo component |
| `pmm_purge_data` | `false` | cleanup playbooks: also delete data directories |

## Verify

```bash
docker ps --filter name=pmm-server
curl -k https://<pmm-server>:443
pmm-admin status
```

## Notes

- **PMM 3 changes applied here:** server image bumped to `:3`, container port
  changed from `443` to `8443` (published as `443:8443`), client package
  renamed `pmm2-client` -> `pmm-client`, and `percona-release enable
  pmm3-client` is now required before installing the client package.
- PMM 3 also supports service-account API tokens
  (`PMM_AGENT_SERVER_USERNAME=service_token`, a `glsa_...` token) as a more
  modern alternative to admin username/password for client registration; this
  module keeps username/password to match the existing feature set. Consider
  tokens for production.
- `pmm_postgresql.yml` uses distinct `postgresql.conf`/`pg_hba.conf` paths for
  Debian (`/etc/postgresql/<ver>/main/`) vs RHEL (`/var/lib/pgsql/<ver>/data/`)
  — a previous version of this playbook used the Debian path on both.
- This module does not install or provision the database engine itself
  (MySQL/PostgreSQL) — only PMM's monitoring integration.
- No dedicated `templates/*.j2` files are used: PMM's server/client
  configuration here is entirely environment-variable and CLI-flag driven,
  not file-based.
