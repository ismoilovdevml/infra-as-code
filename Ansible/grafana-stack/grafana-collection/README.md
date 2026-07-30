# Grafana / Loki / Promtail

Installs Grafana and Loki via their official APT/RPM package repositories (delegated to the
`grafana.grafana` Ansible collection roles), and Promtail as a standalone binary or Docker
container fetched from GitHub releases.

## Promtail end of life

Promtail has been end of life upstream since **2026-03-02**: no security fixes, no new
releases. Loki >= 3.7.0 no longer ships promtail release assets at all, so the upstream role's
default `promtail_version: "latest"` now resolves against the Loki repo and 404s. This
collection pins `promtail_version: "3.6.11"` (the last version ever published) so
`install_promtail.yml` / `install_promtail_docker.yml` keep working, but Promtail should be
treated as a dead end. Migrate to **Grafana Alloy** (<https://grafana.com/docs/alloy/latest/>),
which has an automated config converter:

```bash
alloy convert --source-format=promtail --output=<OUTPUT_CONFIG_PATH> <INPUT_CONFIG_PATH>
```

This collection does not (yet) ship an Alloy playbook.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | Grafana: official APT repo. Loki/Promtail: standalone `.deb` from GitHub releases |
| RedHat | RHEL/Rocky/Alma 8+, CentOS Stream 9+, Fedora 40+, Amazon Linux 2023 | Grafana: official YUM repo. Loki/Promtail: standalone `.rpm` from GitHub releases |
| Suse | openSUSE Leap 15.x, SLES 15 | Grafana only. Loki/Promtail have no upstream role support on SUSE; `install_loki.yml` and `install_promtail.yml` fail fast on this OS family. The Docker-based Promtail install (`install_promtail_docker.yml`) works on SUSE. |

## Requirements

- Ansible core >= 2.15
- Collections: `ansible-galaxy collection install -r requirements.yml`
- Target has `sudo`/root access

## Usage

```bash
ansible-playbook install_grafana.yml                  # Grafana
ansible-playbook install_loki.yml                     # Loki
ansible-playbook install_promtail.yml                 # Promtail, binary (EOL, pinned 3.6.11)
ansible-playbook install_promtail_docker.yml          # Promtail, Docker (EOL, pinned 3.6.11)
ansible-playbook configure_promtail.yml               # re-render config, restart binary install
ansible-playbook configure_promtail_docker.yml        # re-render config, restart container
ansible-playbook uninstall.yml --tags grafana         # uninstall one component at a time
ansible-playbook install_grafana.yml --check --diff   # dry-run
```

Set the Grafana admin password before running `install_grafana.yml`:

```bash
ansible-vault edit group_vars/all/vault.yml
# vault_grafana_admin_password: "<strong password>"
ansible-playbook install_grafana.yml --ask-vault-pass
```

## Variables

See `vars.yml` for the full list. Key ones:

| Variable | Default | Description |
|---|---|---|
| `grafana_version` | `latest` | Grafana package version (repo-managed) |
| `vault_grafana_admin_password` | `""` | Grafana admin password; must be vault-encrypted, playbook asserts if empty |
| `loki_version` | `3.7.4` | Pin; verify against <https://github.com/grafana/loki/releases> |
| `promtail_version` | `3.6.11` | Pinned EOL version; do not set to `latest` (see above) |
| `docker_package_map` | see `vars.yml` | Docker Engine package name per `ansible_os_family` |

## Verify

```bash
systemctl status grafana-server
systemctl status loki
systemctl status promtail        # binary install only
docker ps --filter name=promtail # Docker install only
curl -s http://<host>:3000/api/health
curl -s http://<host>:3100/ready
curl -s http://<host>:9080/ready
```

## Notes

- Mounting `/var/run/docker.sock` into the Promtail Docker container (for the `flog_scrape`
  job in `templates/promtail_config.yml.j2`) grants the container root-equivalent access to the
  host. Remove that scrape job and the socket mount if you do not need container log discovery.
- Loki and Promtail binaries are downloaded directly from GitHub releases and installed without
  package-repository GPG verification (upstream role behavior, see
  `roles/loki/tasks/setup-RedHat.yml` in `grafana.grafana`); only the RPM package's own
  signature is checked (`disable_gpg_check: true` on RHEL is upstream role code, not overridden
  here).
- `docker_package_map` assumes your distro ships a `docker` package. Many RHEL derivatives do
  not (Docker CE must be installed from Docker's own repo, or use `podman-docker`); override the
  map if the default does not resolve.
