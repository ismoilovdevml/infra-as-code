# KeyDB

Installs KeyDB, a multithreaded Redis fork, either from the upstream `.deb` packages
or as a container.

## Status: unmaintained

Verified 2026-07-30 against upstream:

- Last push to `Snapchat/KeyDB`: **2024-05-29**. The repository is not archived, but
  there has been no release since **v6.3.4 (2023-10-30)**.
- Every published package and image is frozen at 6.3.4 and therefore carries
  unpatched Redis-inherited CVEs.
- Upstream has published **no formal end-of-life statement** — the above is inferred
  from release and commit activity, not announced.

`install.yml` refuses to run until `keydb_accept_unmaintained_software=true`.
For anything new use [../redis/](../redis/) or Valkey.

## Supported platforms

Upstream publishes packages only for these, on amd64 and arm64:

| OS family | Versions | Source |
| --- | --- | --- |
| Debian | 9, 10, 11, 12 | `download.keydb.dev/pkg/open_source/deb` |
| Ubuntu | 16.04, 18.04, 20.04, 22.04 | same |
| RedHat | CentOS 7, 8 only — both long EOL, **not supported by this module** | — |

Debian 13, Ubuntu 24.04+, RHEL 8+, Fedora, Amazon Linux and SUSE have no upstream
package. Those platforms must use `keydb_install_method=docker`.

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`community.docker`, docker method only)
- A vaulted `vault_keydb_admin_password` when binding beyond loopback

## Usage

```bash
ansible-playbook install.yml -e keydb_accept_unmaintained_software=true
ansible-playbook install.yml -e keydb_accept_unmaintained_software=true \
                             -e keydb_install_method=docker
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e keydb_purge_data=true
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `keydb_accept_unmaintained_software` | `false` | Must be `true` before anything runs |
| `keydb_install_method` | `package` | `package` or `docker` |
| `keydb_version` | `6.3.4` | The only release available |
| `keydb_bind_address` | `127.0.0.1` | Beyond loopback requires a password |
| `keydb_admin_password` | vault | `requirepass`, minimum 12 characters |
| `keydb_port` | `6379` | |
| `keydb_appendonly` | `true` | AOF persistence |

## Verify

```bash
systemctl status keydb-server          # package method
keydb-cli -h 127.0.0.1 -p 6379 ping    # -> PONG
keydb-cli info server | grep version
```

## Notes

- **`download.keydb.dev` is not an APT repository.** It serves loose `.deb` files under
  a plain directory listing with no `Packages` or `Release` index, so it cannot be
  added with `deb822_repository`. The packages are fetched with `get_url` and installed
  with `apt: deb=`.
- **Consequence: there is no repository signature to verify.** Upstream publishes an
  RPM GPG key but no APT keyring for this path. If that matters to you, mirror the
  packages into a repository you sign yourself, or use the container image.
- Binding beyond loopback without `requirepass` leaves an open, unauthenticated
  database. The play asserts against that combination.
- `server-threads` is KeyDB's reason to exist; it defaults to the smaller of the host
  vCPU count and 4. Do not exceed the physical core count.
