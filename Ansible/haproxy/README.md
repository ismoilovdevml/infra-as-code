# HAProxy

Installs HAProxy at a chosen `haproxy_branch` (major.minor) from the official Debian/Ubuntu
repository mechanism, or the distribution's own AppStream/zypper package on RHEL/SUSE, and
renders `haproxy.cfg` from `haproxy_frontends`/`haproxy_backends`.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+ | official `haproxy.debian.net` APT repo (Debian only) |
| Debian | Ubuntu 20.04+ | `ppa:vbernat/haproxy-<branch>` (haproxy.debian.net has no Ubuntu repo) |
| RedHat | RHEL/Rocky/AlmaLinux/CentOS Stream 8+ | AppStream `haproxy` package (no version pin) |
| Suse | openSUSE / SLES | distribution `haproxy` package (no version pin) |

RHEL/Rocky/Alma **8**'s AppStream ships haproxy 1.8.27 — years past HAProxy's own EOL. There
is no official newer repository for RHEL 8; a warning is printed unless
`haproxy_warn_on_outdated_rhel8=false`.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`, `systemd_service`)
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, `ansible.posix`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install.yml
ansible-playbook install.yml --check --diff        # dry-run
ansible-playbook install.yml --tags configure      # haproxy.cfg only
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e haproxy_purge_data=true   # also wipe /etc/haproxy
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `haproxy_branch` | `3.2` | Major.minor branch. Debian/Ubuntu only — verify availability on <https://haproxy.debian.net/> first |
| `haproxy_frontends` | one `http_front` on `*:80` | List of frontends |
| `haproxy_backends` | one `app_servers` backend | List of backends, each with a `servers` list |
| `haproxy_stats_enabled` | `true` | Stats page, bound to `haproxy_stats_bind` |
| `haproxy_stats_bind` | `127.0.0.1:8404` | Must be loopback unless `vault_haproxy_stats_password` is set |
| `haproxy_enable_nonlocal_bind` | `false` | Set `net.ipv4.ip_nonlocal_bind=1`; needed only when binding directly to a VIP (e.g. keepalived) not yet present on the interface |
| `haproxy_manage_selinux` | `true` | Apply `haproxy_selinux_booleans` (empty by default) on RHEL family |
| `haproxy_manage_firewall` | `true` | Open frontend/stats ports in firewalld or ufw |

Frontend/backend shape:

```yaml
haproxy_frontends:
  - name: http_front
    bind: "*:80"
    mode: http
    default_backend: app_servers

haproxy_backends:
  - name: app_servers
    mode: http
    balance: roundrobin
    servers:
      - name: app1
        address: "10.0.0.21:8080"
        check: true
```

## Verify

```bash
systemctl status haproxy
haproxy -v
haproxy -c -f /etc/haproxy/haproxy.cfg
```

## Notes

- **Debian and Ubuntu use different upstream mechanisms.** `haproxy.debian.net` only serves
  Debian; it never publishes an "hdn" repo for Ubuntu, only the version already in Ubuntu's
  own archive or the `ppa:vbernat/haproxy-<branch>` PPA. Adding a `ppa:` repo on a Debian host
  does not work (Launchpad PPAs are Ubuntu-only) — this module gates each mechanism strictly
  on `ansible_distribution`.
- `haproxy.cfg` is validated with `haproxy -c -f %s` **before** it is written, so a bad config
  can never be applied — this is the module's `template` `validate:`.
- `net.ipv4.ip_nonlocal_bind` is only needed when a frontend binds directly to a floating VIP
  (e.g. one managed by `../keepalived`) that may not be present on the interface when haproxy
  starts; not needed if frontends bind to `0.0.0.0`/`*`.
- HAProxy runs under its own confined `haproxy_t` SELinux domain (not `httpd_t`).
  `haproxy_connect_any` is off by default and only needed for non-standard backend ports.
- The upstream Debian-release-to-branch compatibility matrix changes over time; this module
  does not hardcode it. Check <https://haproxy.debian.net/> for your release before changing
  `haproxy_branch`. An unsupported combination fails at `apt-get update`/`install`, not silently.
