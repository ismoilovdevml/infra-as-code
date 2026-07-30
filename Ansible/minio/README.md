# MinIO

Installs MinIO (S3-compatible object storage) from the last release `dl.min.io` will
ever serve, as a `.deb`/`.rpm` package (Debian/RedHat) or a raw binary (SUSE/Arch), plus
the `mc` client and a repository-authored systemd unit.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `.deb` from `dl.min.io` |
| RedHat | RHEL/Rocky/Alma 8+, Fedora, Amazon Linux | `.rpm` from `dl.min.io` |
| Suse | openSUSE Leap 15+, SLES 15 | raw binary — MinIO publishes no zypper package |
| Archlinux | any | raw binary — MinIO publishes no pacman package |

## Requirements

- Ansible core >= 2.15
- No external collections
- `sudo` on the target
- A vault-encrypted var file providing `vault_minio_root_user` /
  `vault_minio_root_password` (see Notes) — the play refuses to run without them

## Usage

```bash
ansible-playbook install_minio.yml -e @vault_vars.yml --ask-vault-pass
ansible-playbook uninstall_minio.yml
ansible-playbook uninstall_minio.yml -e minio_purge_data=true   # also wipe the data dir
ansible-playbook install_minio.yml --check --diff               # dry-run
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `minio_version` | `RELEASE.2025-09-07T16-13-09Z` | Pinned — see Notes, this is frozen forever |
| `minio_directory` | `/mnt/data` | Single-node single-drive data volume |
| `minio_root_user` / `minio_root_password` | `""` (vault-backed) | Asserted non-empty and not `minioadmin` before install |
| `minio_api_port` / `minio_console_port` | `9000` / `9001` | S3 API / web console |
| `minio_install_mc` | `true` | Also install the `mc` client |

## Verify

```bash
systemctl status minio
minio --version
mc alias set local http://127.0.0.1:9000 <root_user> <root_password>
mc admin info local
```

## Notes

- **MinIO's own GitHub repositories (`minio/minio`, `minio/mc`) are archived.**
  Upstream's README states plainly: "THIS REPOSITORY IS NO LONGER MAINTAINED" and "The
  MinIO community edition is now distributed as source code only... Legacy binaries
  will not receive updates." `dl.min.io` still serves the packages this module installs,
  but they are the **final, frozen build** — there will be no further security patches
  through this channel. Upstream's suggested paths forward, not implemented here: build
  from source (`go install github.com/minio/minio@latest`) or move to MinIO Inc.'s
  **AIStor Free** (`https://min.io/download`).
- **AGPLv3** licence, unchanged since 2021, still applies to this frozen build.
- The embedded web Console (object browser) ships in this build reachable at the API
  port unless `minio_console_port` is set; upstream's current README still describes it
  as "an embedded web-based object browser built into MinIO Server". Some 2025-era
  reporting claimed console functionality was stripped from the community edition —
  this repo could not confirm that against the primary MinIO README and treats it as
  unverified rather than fact.
- **Root credentials are vault-backed and asserted.** `install_minio.yml` refuses to run
  if `minio_root_user`/`minio_root_password` are empty or equal to the well-known
  `minioadmin` default. This is a guardrail this module adds; it is stricter than what
  MinIO itself was confirmed to enforce (MinIO prints a warning on the default, not a
  confirmed hard failure).
- Credentials live only in `/etc/minio/config.env` (`0600`, `minio-user` owned), never
  in `/etc/default/minio`, following the current two-file pattern documented by
  `minio/minio-service` (not archived, still maintained) — `/etc/default/minio` holds
  only `MINIO_VOLUMES`/`MINIO_OPTS` and a pointer to `config.env`.
- rpm and deb release assets use **different architecture names**
  (`x86_64`/`aarch64` vs `amd64`/`arm64`) — kept as separate lookups in `install_minio.yml`.
