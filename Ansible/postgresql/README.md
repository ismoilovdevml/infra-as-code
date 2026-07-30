# PostgreSQL

Installs PostgreSQL from the official PGDG package repositories (apt.postgresql.org /
yum.postgresql.org / zypp.postgresql.org) and configures listen address, pg_hba.conf and
the admin user password.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11/12/13, Ubuntu 22.04/24.04/26.04 | official PGDG apt repo; Ubuntu 20.04 (focal) is no longer supported by PGDG |
| RedHat | RHEL/Rocky/Alma/Oracle 8/9/10, Fedora 40+ | official PGDG yum repo; EL8 requires disabling the built-in `postgresql` module stream; CentOS Stream and Amazon Linux 2023 have no PGDG repo and fail fast |
| Suse | SLES 15/16, openSUSE Leap 16.0 | official PGDG zypp repo; Leap 15.x/Tumbleweed unsupported by PGDG; service/initdb naming is not independently verified for SUSE (see Notes) |

## Requirements

- Ansible core >= 2.15
- Collections: `community.postgresql`, `community.general`
  (`ansible-galaxy collection install -r requirements.yml`)
- Target host `sudo`/root access

## Usage

```bash
ansible-playbook install_postgresql.yml                 # install
ansible-playbook configure_postgresql.yml                # configure users/auth
ansible-playbook uninstall_postgresql.yml                 # remove
ansible-playbook install_postgresql.yml --check --diff    # dry-run
```

Set the admin password before running `configure_postgresql.yml`:

```bash
ansible-vault encrypt_string 'S3cr3t!' --name 'vault_postgresql_admin_password' >> group_vars/all/vault.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `postgresql_version` | `17` | Major version to install |
| `postgresql_port` | `5432` | Listen port |
| `postgresql_listen_addresses` | `*` | postgresql.conf listen_addresses |
| `postgresql_hba_auth_method` | `scram-sha-256` | pg_hba.conf auth method |
| `postgresql_hba_networks` | `[10.0.0.0/8]` | Networks allowed to authenticate over TCP |
| `postgresql_admin_password` | `{{ vault_postgresql_admin_password }}` | Vault-backed; empty fails an assert |
| `postgresql_uninstall_purge_data` | `false` | Also delete the data directory on uninstall |

## Verify

```bash
systemctl status <postgresql_service_name>
psql --version
psql -h 127.0.0.1 -U postgres -c "SELECT version();"
```

## Notes

- PostgreSQL 14 reaches EOL on **2026-11-12**; do not deploy new 14 clusters, and plan
  migrations off existing ones. Default here is 17.
- PGDG will stop building new PostgreSQL majors for **EL8 after PostgreSQL 18** — plan an
  OS upgrade path for EL8 hosts before then.
- CentOS Stream and Amazon Linux 2023 have no PGDG repository at all; the playbook fails
  fast on these rather than silently falling back to distro-native packages.
- SUSE support (service unit name, initdb invocation) mirrors the RHEL/PGDG layout but was
  not independently confirmed against a primary SUSE source; validate on a test host before
  relying on it in production.
- `postgresql_hba_networks` defaults to a private RFC1918 range; narrow it to your actual
  application subnet for production.
