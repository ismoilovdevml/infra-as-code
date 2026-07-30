# Harbor

Installs Harbor from the official offline (or online) installer tarball published on
`goharbor/harbor` GitHub releases, rendering `harbor.yml` from a template and running
the upstream `install.sh`.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Any with Docker Engine + Compose plugin | see `Ansible/docker/` |
| RedHat | Any with Docker Engine + Compose plugin | EPEL needed for certbot |
| Suse | Any with Docker Engine + Compose plugin | certbot best-effort only |

This module does not install Docker itself; it only deploys Harbor. Docker Engine
(> 20.10) and the `docker compose` plugin (> 2.3) must already be present — `install.sh`
itself prefers the plugin over the standalone `docker-compose` v1 binary.

## Requirements

- Ansible core >= 2.15
- Collections: `community.docker`, `community.crypto`, `community.general`
  (`ansible-galaxy collection install -r requirements.yml`)
- Docker Engine + Compose plugin on the target (`Ansible/docker/install_docker.yml`)
- `sudo` on the target
- `vault_harbor_admin_password` and `vault_harbor_db_password` set via `ansible-vault`
  — the play refuses to run while either is empty

## Usage

```bash
ansible-vault encrypt_string 'S3cr3tAdmin!' --name 'vault_harbor_admin_password' >> group_vars/vault.yml
ansible-vault encrypt_string 'S3cr3tDb!' --name 'vault_harbor_db_password' >> group_vars/vault.yml
ansible-playbook bootstrap_harbor.yml --ask-vault-pass
ansible-playbook bootstrap_harbor.yml --check --diff --ask-vault-pass   # dry-run
ansible-playbook cleanup.yml --ask-vault-pass
ansible-playbook cleanup.yml -e harbor_purge_data=true --ask-vault-pass  # also wipe /data
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `harbor_version` | `v2.15.2` | Current stable tag on `goharbor/harbor` |
| `harbor_installer_type` | `offline` | `offline` (bundled images) or `online` (pulls from Docker Hub) |
| `harbor_hostname` | `harbor.example.internal` | Must not be `127.0.0.1` or `reg.mydomain.com` |
| `harbor_ssl_option` | `self_signed` | `self_signed`, `certbot`, or `disabled` |
| `harbor_admin_password` | `""` (vault) | `vault_harbor_admin_password`; asserted non-empty |
| `harbor_db_password` | `""` (vault) | `vault_harbor_db_password`; asserted non-empty |
| `harbor_with_trivy` | `false` | Enables the Trivy vulnerability scanner |
| `harbor_purge_data` | `false` | `cleanup.yml` only — deletes `/data` and TLS material |

## Verify

```bash
docker compose -f /opt/harbor/docker-compose.yml ps
curl -sk https://<harbor_hostname>/api/v2.0/systeminfo
```

## Notes

- **TLS is not optional-by-omission.** Harbor's own `prepare` script hard-fails if the
  rendered `harbor.yml` has an `https:` block with certificate/key paths left at the
  template's placeholder values. This module either renders real paths (self-signed,
  generated with `community.crypto`, or certbot/Let's Encrypt) or omits the `https:`
  block entirely (`harbor_ssl_option: disabled`), which Harbor allows with a plaintext
  warning. Never leave `harbor_ssl_option` pointed at unset placeholder paths.
- **Verification gap:** upstream's docs still describe GPG `.asc` signature
  verification, but the actual release assets ship `.sigstore.json` bundles and a
  plain `md5sum` file instead — no `.asc` file exists to check. This module verifies
  the download against `md5sum` (integrity only, not cryptographic authenticity); there
  is no built-in Ansible sigstore/cosign verifier.
- `harbor_config_schema_version` (the `_version:` field in `harbor.yml`) is pinned to
  what `harbor_version`'s own template ships — bump both together, never independently.
- Re-running `bootstrap_harbor.yml` is a no-op when nothing changed: `install.sh` only
  runs on first install or when the rendered `harbor.yml` changes; otherwise the play
  reconciles the existing compose project in place.
- `--with-notary` and `--with-chartmuseum` are not supported by current `install.sh`
  (both features were removed upstream) and are not exposed by this module.
