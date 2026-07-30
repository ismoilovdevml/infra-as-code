# MongoDB

Installs MongoDB Community Edition from the official `repo.mongodb.org` repository.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11/12, Ubuntu 20.04/22.04/24.04 | official APT repo (`deb822_repository`) |
| RedHat | RHEL/Rocky/AlmaLinux 8/9 | official YUM repo |

RHEL 7 is not supported by the current MongoDB 8.x series (dropped after 7.x) and
fails preflight with an explicit message. No official SUSE/Community repository
was found upstream.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`, `systemd_service`)
- No external collections — this module uses `ansible.builtin` and `mongosh`
  (installed as part of the MongoDB package set) only
- `sudo` on the target

## Usage

```bash
ansible-playbook install.yml
ansible-playbook install.yml --check --diff
ansible-playbook configure_mongodb.yml -e vault_mongodb_admin_password=<vaulted>
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e mongodb_purge_data=true
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `mongodb_series` | `8.0` | Repo series directory. Minor releases (8.0/8.2/8.3) must be upgraded sequentially |
| `mongodb_bind_address` | `127.0.0.1` | Set beyond loopback only with `mongodb_admin_password` set |
| `mongodb_admin_user` | `admin` | First user, created with the `root` role |
| `mongodb_admin_password` | `""` (from `vault_mongodb_admin_password`) | Required once `mongodb_bind_address` is non-loopback |

## Verify

```bash
systemctl status mongod
mongosh --eval 'db.runCommand("ping")'
mongod --version
```

## Notes

- The GPG key is published **per major line only** (`server-8.0.asc`) — there is
  no `server-8.2.asc` / `server-8.3.asc` even when `mongodb_series` is `8.2`/`8.3`.
  This module always fetches `server-8.0.asc` regardless of `mongodb_series`.
- `mongodb-org` now depends on `mongodb-mongosh`, not the legacy `mongodb-org-shell`
  package — the `mongo` shell binary was removed from the server distribution.
  `mongosh` is installed and is what this module's tasks and verification use.
- The admin user is created through MongoDB's **localhost exception**: it allows
  one unauthenticated connection from `127.0.0.1` to create the first user, and
  closes automatically afterward. `configure_mongodb.yml` checks whether the
  configured credentials already authenticate before attempting creation, so
  re-runs are idempotent.
- Data directory differs by family: `/var/lib/mongodb` (Debian) vs `/var/lib/mongo`
  (RHEL family) — both are mapped in `vars.yml`, never hardcoded in tasks.
- Deploying a replica set or sharded cluster additionally requires keyfile
  authentication between members — out of scope for this single-node module.
