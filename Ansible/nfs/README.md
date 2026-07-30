# NFS

Configures an NFS server with declarative exports, and mounts those exports on
clients. NFSv4-only by default.

## Supported platforms

| OS family | Server package | Service |
| --- | --- | --- |
| Debian | `nfs-kernel-server`, `nfs-common` | `nfs-kernel-server` |
| RedHat | `nfs-utils` | `nfs-server` |
| Suse | `nfs-kernel-server` | `nfs-server` |

Client side: `nfs-common` (Debian), `nfs-utils` (RedHat), `nfs-client` (SUSE).

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`ansible.posix`, `community.general`)
- `sudo` on the target

## Usage

```bash
ansible-playbook nfs_setup.yml            # server
ansible-playbook nfs_client.yml           # clients
ansible-playbook nfs_setup.yml --check --diff
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `nfs_exports` | one `/srv/nfs` export | List of exports, each with a `clients` list |
| `nfs_client_mounts` | `[]` | Mounts applied by `nfs_client.yml` |
| `nfs_v4_only` | `true` | Disable NFSv2/v3 so everything stays on 2049 |
| `nfs_manage_firewall` | `true` | Open NFS in firewalld or ufw when one is running |

Export shape:

```yaml
nfs_exports:
  - path: /srv/data
    owner: root
    group: root
    mode: '0755'
    clients:
      - host: "10.0.0.0/24"
        options: "rw,sync,root_squash,no_subtree_check"
```

## Verify

```bash
systemctl status nfs-server        # or nfs-kernel-server on Debian
exportfs -v
showmount -e <server>              # NFSv3 only; use `mount` output on v4
findmnt -t nfs4
```

## Notes

- **The previous version exported `/srv/nfs` to `*` with `no_root_squash`.** That gives
  root on the export to any host that can reach port 2049. The defaults are now a
  private CIDR with `root_squash`, and the play **refuses to run** if any export
  combines a `*` client with `no_root_squash`.
- `root_squash` maps remote root to `nobody`. Only use `no_root_squash` for a single
  named host that genuinely needs it.
- **NFS has no transport authentication by default.** Access control is by IP alone,
  which is trivially spoofable on an untrusted network. Use Kerberos (`sec=krb5p`) or
  keep NFS on a private network.
- `nfs_v4_only` keeps all traffic on 2049. Turning it off re-enables NFSv3, which
  needs `rpcbind`, `statd` and `lockd` on additional and partly dynamic ports — much
  harder to firewall.
- Exports are reloaded with `exportfs -ra`, which re-reads `/etc/exports` without
  restarting the service, so existing client mounts survive a config change.
- Client mounts default to `hard` and `_netdev`: `hard` avoids silent data loss on a
  server outage, `_netdev` stops boot hanging when the server is unreachable.
