# NGINX

Installs NGINX from the official nginx.org package repository, falling back to the
distribution's own package where nginx.org publishes none, and renders `nginx.conf` plus a
list of virtual hosts (`nginx_sites`) from templates.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 22.04+ | official `nginx.org` APT repo (deb822) |
| RedHat | RHEL/CentOS Stream/Rocky/AlmaLinux 8+, Amazon Linux 2023 | official `nginx.org` YUM repo |
| RedHat | Fedora 40+ | distribution `nginx` package (no upstream repo) |
| Suse | SLES 15+ | official `nginx.org` zypper repo |
| Suse | openSUSE Leap / Tumbleweed | distribution `nginx` package (no upstream repo) |

Anything else fails in preflight with an explicit message. Ubuntu 20.04 is dropped by
nginx.org upstream and is refused unless `nginx_strict_platform_check=false`.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`, `systemd_service`)
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, `ansible.posix`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install_nginx.yml
ansible-playbook install_nginx.yml --check --diff       # dry-run
ansible-playbook install_nginx.yml --tags configure     # nginx.conf + sites only
ansible-playbook uninstall_nginx.yml
ansible-playbook uninstall_nginx.yml -e nginx_purge_data=true   # also wipe /etc/nginx, /var/www/html
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `nginx_release` | `stable` | `stable` or `mainline` |
| `nginx_version` | `""` | Exact package pin. Empty = repo latest |
| `nginx_sites` | one `default` static site on `:80` | List of virtual hosts, see below |
| `nginx_manage_selinux` | `true` | Set `httpd_can_network_connect` on RHEL family |
| `nginx_manage_firewall` | `true` | Open `nginx_firewall_ports` in firewalld / ufw |
| `nginx_firewall_ports` | `[80, 443]` | Ports opened when the firewall is managed |
| `nginx_strict_platform_check` | `true` | Refuse releases dropped upstream |

Each `nginx_sites` entry:

```yaml
nginx_sites:
  - name: app.example.com          # -> sites-available/<name>.conf
    enabled: true                  # symlinked into sites-enabled when true
    listen: 80
    default_server: false
    server_name: "app.example.com"
    type: proxy                    # static | proxy | raw
    proxy_pass: "http://127.0.0.1:3000"   # type: proxy
    # root: /var/www/app                  # type: static
    # raw_config: |                       # type: raw, emitted verbatim in the server block
    extra_config: []                # extra lines appended inside the server block
```

## Verify

```bash
systemctl status nginx
nginx -v
nginx -t
curl -I http://<host>/
```

## Notes

- `sites-available`/`sites-enabled` is a **Debian packaging convention that the nginx.org
  package does not ship** (upstream only documents `conf.d`). This module owns `nginx.conf`
  directly and always adds `include /etc/nginx/sites-enabled/*;`, on every OS family.
- The packaged `/etc/nginx/conf.d/default.conf` is removed so it cannot collide with the
  `default_server` defined through `nginx_sites`.
- `site.conf.j2` renders a bare `server {}` block, which `nginx -t` cannot validate on its
  own. The full merged configuration is validated with `nginx -t` after every site is
  written and before nginx is reloaded, so a bad site can never be left active.
- On RHEL-family hosts nginx runs under the confined `httpd_t` SELinux domain (shared with
  Apache); `httpd_can_network_connect` is required to reverse-proxy to a remote backend.
- Repository pinning (`/etc/apt/preferences.d/99nginx`, priority 900) is upstream's own
  recommendation so `apt upgrade` cannot silently swap in the distribution's older build.
