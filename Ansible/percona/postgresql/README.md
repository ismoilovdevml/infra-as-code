# Percona Distribution for PostgreSQL

Installs Percona Distribution for PostgreSQL via `percona-release` and the official
Percona apt/yum repositories, then configures listen address, pg_hba.conf and the admin
user password.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11/12/13, Ubuntu 22.04/24.04/26.04 (20.04 only on ppg-17, not ppg-18) | official Percona apt repo |
| RedHat | RHEL/Rocky/Alma/Oracle 8/9/10 | official Percona yum repo; EL8 requires disabling the built-in `postgresql` module stream |

SUSE/openSUSE is not published by Percona for this product. Amazon Linux 2023 is listed on
Percona's platform lifecycle page but its `ppg-<version>` repository ships no server
packages - this playbook fails fast on it rather than silently installing nothing useful.

## Requirements

- Ansible core >= 2.15
- Collections: `community.postgresql` (`ansible-galaxy collection install -r requirements.yml`)
- Target host `sudo`/root access

## Usage

```bash
ansible-playbook install.yml                 # install
ansible-playbook configure.yml               # configure auth/admin password
ansible-playbook uninstall.yml               # remove
ansible-playbook install.yml --check --diff  # dry-run
```

Set the admin password before running `configure.yml`:

```bash
ansible-vault encrypt_string 'S3cr3t!' --name 'vault_percona_pg_admin_password' >> group_vars/all/vault.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `percona_pg_version` | `17` | Percona Distribution for PostgreSQL major version |
| `percona_pg_port` | `5432` | Listen port |
| `percona_pg_hba_auth_method` | `scram-sha-256` | pg_hba.conf auth method |
| `percona_pg_hba_networks` | `[10.0.0.0/8]` | Networks allowed to authenticate over TCP |
| `percona_pg_admin_password` | `{{ vault_percona_pg_admin_password }}` | Vault-backed; empty fails an assert |
| `percona_pg_uninstall_purge_data` | `false` | Also delete the data directory on uninstall |

## Verify

```bash
systemctl status <percona_pg_service_name>
psql --version
```

## Notes

- PostgreSQL 14 (the oldest major Percona still ships) reaches EOL on **2026-11-12**;
  do not deploy new 14 clusters.
- Package naming differs by family: apt uses `percona-ppg-server-<major>` /
  `percona-postgresql-<major>`; yum uses `percona-ppg-server<major>` /
  `percona-postgresql<major>-server` (no hyphen before the version). This playbook uses
  the metapackage form for each family.
- Starting with PostgreSQL 18, `pg_tde` is no longer bundled in the server package and
  must be installed separately if needed.
- CRB/PowerTools/llvm-toolset repositories are only needed for optional extension
  packages (devel headers, PostGIS, pgpool2) and are not enabled by this playbook.
- `percona_pg_hba_networks` defaults to a private RFC1918 range; narrow it to your actual
  application subnet for production.
