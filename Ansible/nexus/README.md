# Sonatype Nexus Repository

Deploys Sonatype Nexus Repository Community Edition as a single Docker container with
a bind-mounted data directory, and automates the Community Edition EULA acceptance.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Any with Docker Engine | see `Ansible/docker/` |
| RedHat | Any with Docker Engine | see `Ansible/docker/` |
| Suse | Any with Docker Engine | see `Ansible/docker/` |

This module does not install Docker itself; it only runs the container. Docker Engine
must already be present (preflight fails otherwise).

## Requirements

- Ansible core >= 2.15
- Collections: `community.docker` (`ansible-galaxy collection install -r requirements.yml`)
- Docker Engine on the target (`Ansible/docker/install_docker.yml`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install_nexus.yml
ansible-playbook install_nexus.yml --check --diff          # dry-run
ansible-playbook cleanup_nexus_docker.yml
ansible-playbook cleanup_nexus_docker.yml -e nexus_purge_data=true   # also wipe /mnt/nexus
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `nexus_image` | `sonatype/nexus3:latest` | Current upstream release: 3.94.1 |
| `nexus_port` | `8081` | Host port mapped to the container's 8081 |
| `nexus_data_dir` | `/mnt/nexus/nexus-data` | Bind-mounted to `/nexus-data` |
| `nexus_data_uid` | `200` | UID the image's entrypoint runs as; must own the data dir |
| `nexus_accept_eula` | `true` | Auto-accepts the Community Edition EULA via REST |
| `nexus_purge_data` | `false` | `cleanup_nexus_docker.yml` only — deletes all data |

## Verify

```bash
docker ps --filter name=nexus
curl -s http://<host>:8081/service/rest/v1/status
```

## Notes

- **Embedded H2 database.** New installs default to embedded H2, which Sonatype
  supports "up to 200,000 requests per day or 100,000 components" — fine for a single
  node. For production/HA, migrate to an external PostgreSQL database (see Sonatype's
  "Install Nexus Repository with a PostgreSQL Database" guide); this module does not
  provision one, matching its single-container scope.
- **Community Edition usage limits.** Since 3.77.0 the free edition ("Community
  Edition", not "OSS") enforces 40,000 total components or 100,000 requests/day; over
  either limit blocks adding new components until back under both.
- **Admin password is auto-generated, not a variable here.** It is written to
  `/nexus-data/admin.password` on first boot and removed once changed; this playbook
  reads and prints it once (never logged via `no_log` on the read task) so you can log
  in and change it. No admin password is ever committed to this repository.
- No verified, current REST endpoint exists for scripting the admin password change
  itself (only community reports against a long-EOL release were found) — change it
  through the UI on first login.
- The EULA-acceptance step is skipped automatically once onboarding has completed (the
  password file is gone), so re-running `install_nexus.yml` is a no-op.
