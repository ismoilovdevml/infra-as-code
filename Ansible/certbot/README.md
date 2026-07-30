# Certbot

Installs Certbot (Let's Encrypt ACME client) via the OS package manager or snap, then
obtains a certificate for a set of domains using the nginx/apache plugin or webroot.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `certbot` + plugin packages; ships a systemd renewal timer |
| RedHat | RHEL/Rocky/AlmaLinux 8+, Fedora | requires EPEL (auto-enabled, not on Fedora) |
| Suse | openSUSE Leap/SLES | `certbot` + plugin via zypper |
| Any | `certbot_install_method: snap` | EFF's own top recommendation; requires snapd already installed |

Amazon Linux has no confirmed EPEL/certbot support and fails fast on the `package`
method — use `certbot_install_method: snap` there instead.

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, for the
  `snap` install method)
- `sudo` on the target
- nginx or Apache already installed and serving the target domain(s) when using
  `certbot_challenge_method: webserver`

## Usage

```bash
ansible-playbook install.yml
ansible-playbook configure.yml \
  -e certbot_domains='["example.com","www.example.com"]' \
  -e certbot_email=ops@example.com \
  -e certbot_dry_run=true          # ALWAYS dry-run first — rate limits are strict
ansible-playbook configure.yml \
  -e certbot_domains='["example.com"]' -e certbot_email=ops@example.com   # real run
ansible-playbook uninstall.yml
ansible-playbook install.yml --check --diff
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `certbot_install_method` | `package` | `package` or `snap` (EFF's own top recommendation) |
| `certbot_webserver` | `nginx` | `nginx`, `apache`, or `none` (webroot only) |
| `certbot_challenge_method` | `webserver` | `webserver` (`--nginx`/`--apache`) or `webroot` |
| `certbot_domains` | `[]` | **Required**, no default — never hardcode a domain |
| `certbot_email` | `""` | **Required**, no default — never hardcode an email |
| `certbot_staging` | `false` | Use the Let's Encrypt staging ACME directory |
| `certbot_dry_run` | `false` | Add `--dry-run`; nothing is saved to disk |

## Verify

```bash
certbot --version
certbot certificates
systemctl list-timers | grep certbot
```

## Notes

- **Domains and email are required variables with no default.** A previous version of
  this module had a real domain and email hardcoded into a playbook; `configure.yml`
  now asserts both are set (and that the email looks like an email) before running.
- **Always test with `certbot_staging=true` and/or `certbot_dry_run=true` first.**
  Let's Encrypt's production rate limits are per-domain and easy to hit while
  iterating; the staging directory
  (`https://acme-staging-v02.api.letsencrypt.org/directory`) has much higher limits but
  issues untrusted certificates, and `--dry-run` saves nothing at all.
- EFF's own docs currently head the **snap** method "Recommended" (automatic updates,
  renewal preconfigured). This module still defaults to the native OS package for
  consistency with the rest of this repository and to avoid a hard snapd dependency;
  set `certbot_install_method: snap` to follow EFF's preference instead. `pip` in a
  virtualenv is EFF's own "best effort" tier and is not implemented here.
- Renewal runs on the **systemd timer the OS package installs** (`certbot.timer` or
  `certbot-renew.timer`, depending on distro/version) — `install.yml` enables whichever
  is present. This module does not create a competing cron job or timer. The snap
  method manages its own renewal via snapd hooks.
- `install.yml`/`configure.yml` replace this module's previous `setup.yml` and
  `obtain_ssl.yml`, which duplicated each other and depended on an unvendored Galaxy
  role (`geerlingguy.certbot`) that made `setup.yml` fail `ansible-playbook
  --syntax-check` outright. Functionality is preserved with plain FQCN tasks,
  consistent with every other module in this repo.
