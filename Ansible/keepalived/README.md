# Keepalived

Installs keepalived from the distribution package (keepalived.org publishes no binary
repository of its own) and renders `keepalived.conf` for one or more VRRP instances, with
unicast peering computed from an inventory group.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | distribution `keepalived` package |
| RedHat | RHEL/Rocky/AlmaLinux/CentOS Stream 8+ | AppStream `keepalived` package |
| Suse | openSUSE / SLES | distribution `keepalived` package |

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, `ansible.posix`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install.yml           # package only
ansible-playbook configure.yml         # keepalived.conf + firewall + service
ansible-playbook configure.yml --check --diff
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e keepalived_purge_data=true   # also wipe /etc/keepalived
```

Set the vaulted password before running `configure.yml`:

```bash
ansible-vault encrypt_string 'a2b9x1q3' --name vault_keepalived_auth_pass
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `keepalived_group` | `keepalived_nodes` | Inventory group with every VRRP participant; drives `unicast_peer` |
| `keepalived_use_unicast` | `true` | Unicast adverts instead of the 224.0.0.18 multicast group |
| `keepalived_instances` | one `VI_1` instance | List of `vrrp_instance` blocks, see below |
| `keepalived_manage_firewall` | `true` | Open VRRP (protocol 112) in firewalld/ufw |

`keepalived_instances` entry (`state`/`priority` default from whether the host is in the
`keepalived_master` inventory group):

```yaml
keepalived_instances:
  - name: VI_1
    interface: eth0
    virtual_router_id: 51        # 1-255, unique per broadcast domain
    state: "{{ 'MASTER' if 'keepalived_master' in group_names else 'BACKUP' }}"
    priority: "{{ 150 if 'keepalived_master' in group_names else 100 }}"
    advert_int: 1
    auth_pass: "{{ vault_keepalived_auth_pass | default('') }}"
    virtual_ipaddresses:
      - 10.0.0.100
```

## Verify

```bash
systemctl status keepalived
keepalived -t -f /etc/keepalived/keepalived.conf
ip -o addr show                    # the VIP appears only on the current MASTER
journalctl -u keepalived -f        # watch state transitions during a failover test
```

## Notes

- **`auth_pass` is hard-limited to 8 characters** — `keepalived.conf(5)` states only the
  first 8 characters are used; anything longer is silently truncated by keepalived itself,
  not rejected. `configure.yml` asserts the vaulted password is set and `<= 8` characters
  before rendering the config, rather than shipping a secret whose tail is silently unused.
- **VRRPv2 authentication provides no real security.** It was removed from the VRRPv2
  specification by RFC 3768 in 2004; `auth_type PASS` is sent in plaintext in every advert.
  Treat it as a misconfiguration tripwire between instances sharing a link, not a security
  boundary.
- **Unicast is the default**, not multicast: most cloud VPCs (AWS/GCP/Azure/DigitalOcean)
  block the 224.0.0.18 VRRP multicast group entirely, and `keepalived.conf(5)` itself
  recommends pairing unicast with `auth_type PASS`. `unicast_peer`/`unicast_src_ip` are
  computed from every host in `keepalived_group` other than the current one.
- VRRP is IP protocol **112** (IANA/RFC 5798), not TCP or UDP, at multicast destination
  **224.0.0.18** (`ff02::12` for IPv6) — this is also the exact definition of firewalld's
  built-in `vrrp` service, used directly here. ufw has no named VRRP profile, so protocol 112
  is opened numerically.
- `net.ipv4.ip_nonlocal_bind` is **not needed by keepalived itself** — it manages the VIP via
  netlink, not `bind()`. The sysctl is only relevant to a *co-located* service (e.g.
  `../haproxy`) that binds directly to the VIP before keepalived has assigned it to the
  interface; set it in that module, not this one.
- `keepalived.conf` is written with mode `0600` because it contains the vaulted `auth_pass`
  in plaintext once rendered on the target.
