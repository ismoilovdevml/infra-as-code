# MySQL

Installs MySQL Community Server from Oracle's official repositories (apt/yum/zypper) and
configures network binding and root access.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 12 (bookworm)+, Ubuntu 22.04 (jammy)+ | official Oracle apt repo via `mysql-apt-config`; exact codenames Oracle's current config package supports beyond bookworm/jammy are unverified - check `https://dev.mysql.com/downloads/repo/apt/` |
| RedHat | RHEL/Rocky/Alma/Oracle 8/9/10, Fedora 43/44 | official Oracle yum repo; EL8 requires disabling the `mysql`/`mariadb` module streams |
| Suse | SLES 15 | official Oracle zypper repo; openSUSE is not offered by Oracle |

Amazon Linux, CentOS Stream and openSUSE have no Oracle MySQL repository and fail fast
rather than silently falling back to distro packages (which on RHEL-family hosts are
MariaDB, not MySQL). This module installs Oracle MySQL Community Server only.

## Requirements

- Ansible core >= 2.15
- Collections: `ansible.mysql` (replaces the deprecated `community.mysql`, removed from
  Ansible 17), `community.general`
  (`ansible-galaxy collection install -r requirements.yml`)
- Target host `sudo`/root access

## Usage

```bash
ansible-playbook install_mysql.yml                 # install
ansible-playbook configure_mysql.yml                # configure networking and root access
ansible-playbook uninstall_mysql.yml                 # remove
ansible-playbook install_mysql.yml --check --diff    # dry-run
```

Set the root password before running either playbook:

```bash
ansible-vault encrypt_string 'S3cr3t!' --name 'vault_mysql_root_password' >> group_vars/all/vault.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `mysql_series` | `9.7` | Oracle calendar-versioned release series (LTS) |
| `mysql_bind_address` | `0.0.0.0` | mysqld bind-address |
| `mysql_port` | `3306` | mysqld port |
| `mysql_admin_remote_host` | `%` | Host pattern granted remote root access; narrow for prod |
| `mysql_root_password` | `{{ vault_mysql_root_password }}` | Vault-backed; empty fails an assert |
| `mysql_uninstall_purge_data` | `false` | Also delete `/var/lib/mysql` on uninstall |

## Verify

```bash
systemctl status <mysql_service_name>
mysqld --version
mysql -h 127.0.0.1 -u root -p -e "SELECT VERSION();"
```

## Notes

- MySQL 8.0 reached EOL in **2026-04**; the current LTS is **9.7** (premier support to
  2034-04). Do not pin `mysql_series` to 8.0 for new deployments.
- `community.mysql` is deprecated and will be removed from Ansible 17; this module uses
  the `ansible.mysql` FQCNs it was replaced by.
- `mysql_native_password` is removed in MySQL 9.7.0+; passwords are set via `IDENTIFIED BY`
  (`caching_sha2_password`) - do not set `plugin: mysql_native_password`.
- On RHEL/SUSE, Oracle's installer generates a random temporary root password on first
  start (logged to `mysql_error_log`) that must be changed before any other query runs;
  `configure_mysql.yml` handles this automatically and leaves a marker file
  (`/etc/mysql_root_configured`) so the bootstrap only runs once.
- `mysql_admin_remote_host: '%'` combined with `mysql_bind_address: 0.0.0.0` exposes MySQL
  to any network that can reach the port; restrict both for production.
