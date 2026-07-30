# Apache Cassandra

Installs Apache Cassandra from the official `debian.cassandra.apache.org` /
`redhat.cassandra.apache.org` repositories.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11/12/13, Ubuntu 20.04+ | official APT repo (`deb822_repository`) |
| RedHat | RHEL/Rocky/AlmaLinux 8/9 | official YUM repo |

No official SUSE repository was found upstream — that family fails preflight with
an explicit message.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`, `systemd_service`, `service_facts`)
- `ansible-galaxy collection install -r requirements.yml` (`ansible.posix`, for
  optional firewalld management)
- `sudo` on the target

## Usage

```bash
ansible-playbook install.yml
ansible-playbook install.yml --check --diff
ansible-playbook configure_cassandra.yml -e vault_cassandra_admin_password=<vaulted>
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e cassandra_purge_data=true
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `cassandra_series` | `50x` | Repo series. `50x` = Cassandra 5.0 (current GA), `41x` = 4.1 (previous stable, still maintained) |
| `cassandra_rpc_address` | `127.0.0.1` | Set beyond loopback only with `cassandra_admin_password` set |
| `cassandra_admin_password` | `""` (from `vault_cassandra_admin_password`) | Replaces the well-known default `cassandra` superuser password |
| `cassandra_seeds` | this node's `ansible_default_ipv4.address` | Override for multi-node clusters |

## Verify

```bash
systemctl status cassandra
nodetool status
cqlsh -e "SELECT release_version FROM system.local;"
```

## Notes

- Cassandra ships a **well-known default superuser** (`cassandra`/`cassandra`).
  `authenticator`/`authorizer` are `PasswordAuthenticator`/`CassandraAuthorizer`
  from the first `install.yml` run, but that alone does not change the default
  credentials — `configure_cassandra.yml` does, guarded by a marker file so it
  only runs once.
- **Thrift (port 9160) is fully removed since Cassandra 4.0** — there is no
  `rpc_port`/thrift configuration left in `cassandra.yaml`, and this module does
  not open or reference that port. Only `7000` (storage), `7001` (SSL storage),
  `7199` (JMX) and `9042` (native CQL transport) are real.
- Cassandra 5.0 requires **Java 11 or 17** (mixing build/run major versions is
  unsupported); `install.yml` asserts the installed JDK major version.
- `configure_cassandra.yml` only manages firewalld rules when `firewalld.service`
  is present (via `service_facts`) — it does not install or enable firewalld.
- Multi-node clusters: set `cassandra_seeds` explicitly to the same list on every
  node; `cassandra_listen_address`/`broadcast` default to the node's own
  `ansible_default_ipv4.address`.
