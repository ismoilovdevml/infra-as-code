# ActiveMQ Artemis — shared-store HA cluster

Builds a shared-store primary/backup Artemis cluster: one `master` broker and one
or more `nodes` (backups), all sharing message data over NFS, with a keepalived
virtual IP giving clients one address that follows the active broker.

## Supported platforms

| OS family | Versions | Notes |
| --- | --- | --- |
| Debian | Debian 11+, Ubuntu 22.04+ | `openjdk-17-jdk`, `nfs-kernel-server`/`nfs-common`, `keepalived` |
| RedHat | RHEL/Rocky/Alma 8+ | `java-17-openjdk`, `nfs-utils`, `keepalived` |

## Requirements

- Ansible core >= 2.15
- Collections: `community.general`, `ansible.posix`
  (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on every target
- The `master` and `nodes` inventory group hostnames must match the keys used in
  `vars.yml`'s `connectors`/`nfs_mount_paths` maps

## Usage

```bash
ansible-playbook main.yml                 # bootstrap -> NFS -> install -> HA -> VIP
ansible-playbook main.yml --check --diff

# or run each phase independently:
ansible-playbook bootstrap_server.yml
ansible-playbook setup_nfs.yml
ansible-playbook install_artemis.yml
ansible-playbook cluster_bootstrap.yml
ansible-playbook vip_ip.yml

ansible-playbook cleanup.yml
ansible-playbook cleanup.yml -e artemis_purge_data=true
```

Set the admin password before running:

```bash
ansible-vault edit group_vars/all/vault.yml
# vault_artemis_admin_password: "..."
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `nfs_server_ip` | `10.0.0.20` | Placeholder — set to the real NFS server address |
| `nfs_mount_paths` | per-host paths | Must have one entry per `master`/`nodes` hostname |
| `artemis_vip_address` | `10.0.0.30` | Floating IP clients connect to |
| `artemis_vip_interface` | `eth0` | NIC keepalived binds the VIP to |
| `artemis_purge_data` | `false` | `cleanup.yml`: also delete NFS-hosted broker data and the export |

## Verify

```bash
systemctl status artemis nfs-kernel-server keepalived   # per host, as applicable
ip addr show dev eth0                                    # VIP appears on the active broker
/opt/artemis-instance/bin/artemis version
```

## Notes

- HA policy uses the current `primary`/`backup` shared-store terminology
  (`<ha-policy><shared-store><primary>`/`<backup>`); the legacy `master`/`slave`
  tags are deprecated upstream.
- The NFS server is a single point of failure for this topology; making NFS
  itself highly available is out of scope here.
- keepalived/VRRP is a generic HA technique, not an Artemis-specific upstream
  recommendation. It uses unicast peers (not multicast), since most cloud
  networks block multicast VRRP.
- `nfs_server_ip`, `artemis_vip_address` and all inventory hosts are RFC1918
  placeholders — replace with real addresses per environment.
