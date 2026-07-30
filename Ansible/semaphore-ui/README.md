# Semaphore UI

Installs Semaphore UI (formerly Ansible Semaphore) from the upstream release
package, the release tarball, or as a container.

## Supported platforms

| OS family | Method | Notes |
| --- | --- | --- |
| Debian | `.deb` from GitHub releases | Debian 11+, Ubuntu 22.04+ |
| RedHat | `.rpm` from GitHub releases | RHEL/Rocky/Alma 8+, Fedora, Amazon Linux 2023 |
| Any | `binary` (tarball) or `docker` | Where no package applies |

Architectures: amd64, arm64, arm, 386, ppc64le.

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`community.docker`, docker method only)
- Vault variables: `vault_semaphore_admin_password`, `vault_semaphore_access_key_encryption`,
  and `vault_semaphore_db_password` when not using bolt

## Usage

```bash
ansible-playbook install.yml --ask-vault-pass
ansible-playbook install.yml --ask-vault-pass -e semaphore_install_method=docker
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e semaphore_purge_data=true
```

Generate the encryption key once, before the first run:

```bash
head -c32 /dev/urandom | base64
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `semaphore_version` | `2.18.29` | Upstream release |
| `semaphore_install_method` | `package` | `package`, `binary` or `docker` |
| `semaphore_db_dialect` | `bolt` | `bolt` (single node), `mysql` or `postgres` |
| `semaphore_port` | `3000` | |
| `semaphore_bind_address` | `0.0.0.0` | Set to `127.0.0.1` behind a reverse proxy |
| `semaphore_admin_password` | vault | Minimum 12 characters |
| `semaphore_access_key_encryption` | vault | See Notes — this one matters |

## Verify

```bash
systemctl status semaphore
curl -sI http://<host>:3000
semaphore user list --config /etc/semaphore/config.json
```

## Notes

- **`semaphore_access_key_encryption` encrypts every SSH key, password and
  credential Semaphore stores.** The previous version of this module committed a
  real key in plaintext, which means anyone with the repository and a database dump
  could decrypt all stored credentials. Generate your own, keep it in Vault, and
  **never change it** on a live installation — rotating it makes everything already
  encrypted undecryptable. The play refuses to run without it rather than generating
  one on the fly, which would be silently regenerated on the next run.
- The previous version also committed a plaintext admin password and used
  `semaphore`/`semaphore` for the database credentials. All are now vault-backed.
- `bolt` is an embedded database and is **single node only**. Use postgres or mysql
  for anything with more than one Semaphore instance.
- Semaphore executes Ansible playbooks with the credentials it stores, so the host
  is effectively a privileged control node. Keep `semaphore_bind_address` on
  loopback behind an authenticating reverse proxy unless it is on a trusted network.
- `installation_with_package.yml`, `installation_with_binary.yml` and
  `installation_with_docker.yml` were folded into `install.yml`; pick the path with
  `semaphore_install_method`.
