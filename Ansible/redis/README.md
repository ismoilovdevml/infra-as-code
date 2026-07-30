# Redis

Installs Redis Open Source from the official `packages.redis.io` repository.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 12/13, Ubuntu 22.04+ | official APT repo (`deb822_repository`), GPG-signed |
| RedHat | RHEL 8/9, Rocky Linux 8/9/10, AlmaLinux 8/9/10 | official YUM repo, live-verified per major version |

Anything else (RHEL 10, CentOS Stream, Fedora, Amazon Linux 2023, SUSE) fails in
preflight with an explicit message: `packages.redis.io` publishes no RPM repository
for them (confirmed by direct HTTP check against `<baseurl>/repodata/repomd.xml`,
not just the docs page), and those distributions ship **Valkey**, not Redis, in
their own repositories instead.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`, `systemd_service`)
- No external collections
- `sudo` on the target

## Usage

```bash
ansible-playbook install_redis.yml
ansible-playbook install_redis.yml --check --diff
ansible-playbook configure_redis.yml -e vault_redis_admin_password=<vaulted>
ansible-playbook uninstall_redis.yml
ansible-playbook uninstall_redis.yml -e redis_purge_data=true
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `redis_version` | `""` | Exact APT package pin, e.g. `6:8.6.1-1rl1~noble1`. RPM repo is not pinnable |
| `redis_bind_address` | `127.0.0.1` | Set to a reachable address only with a password set |
| `redis_admin_password` | `""` (from `vault_redis_admin_password`) | Required once `redis_bind_address` is non-loopback |
| `redis_maxmemory` / `redis_maxmemory_policy` | `0` / `noeviction` | Eviction policy |
| `redis_appendonly` | `true` | AOF persistence |

## Verify

```bash
systemctl status redis-server   # Debian family
systemctl status redis          # RedHat family
redis-cli -h <host> ping
```

## Notes

- **License**: since Redis 8.0 (May 2025), Redis Open Source is tri-licensed —
  AGPLv3 (OSI-approved) or source-available SSPLv1/RSALv2. The package installed
  here is genuinely open source under the AGPL option.
- **Valkey**: the Linux Foundation's BSD-3 fork (from Redis 7.2.4, backed by
  AWS/Google/Oracle) has replaced Redis as the default package in several
  distributions' own repositories — Fedora 41+, RHEL 10 AppStream, Amazon Linux
  2023, and SUSE/openSUSE all ship Valkey instead. This module intentionally
  installs Redis from the official Redis-hosted repository on the platforms
  where that repository still exists; it does not fall back to Valkey.
- On RHEL 9, the *distribution's own* AppStream `redis` module (v7) EOLs
  November 2026; this module bypasses AppStream entirely by using
  `packages.redis.io` directly, so that EOL does not apply here.
- `configure_redis.yml` refuses to run if `redis_bind_address` is set beyond
  `127.0.0.1`/`::1` and `redis_admin_password` is empty — do not bypass this by
  hardcoding a password in `vars.yml`; use a vaulted `vault_redis_admin_password`.
- Service name is `redis-server` on Debian/Ubuntu and `redis` on RHEL family —
  both are mapped in `vars.yml`, never hardcoded in tasks.
