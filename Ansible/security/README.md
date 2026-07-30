# Security

Host security baseline: SSH hardening (validated drop-in), fail2ban, automatic
security updates, auditd, sysctl hardening.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `unattended-upgrades` for auto updates |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, CentOS Stream 9+ | `dnf-automatic`; fail2ban needs EPEL (not Fedora/Amazon Linux) |
| Suse | openSUSE Leap 15.x, SLES 15 | self-authored `zypper-patch.timer` for auto updates |

## Requirements

- Ansible core >= 2.15
- Collections: `ansible.posix` (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on the target

## Usage

```bash
ansible-playbook main.yml                 # apply the baseline
ansible-playbook main.yml --check --diff  # dry-run
ansible-playbook main.yml --tags verify   # just show the effective sshd config
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `security_ssh_port` | `22` | sshd `Port` |
| `security_ssh_permit_root_login` | `prohibit-password` | `yes`/`no`/`prohibit-password`/`forced-commands-only` |
| `security_ssh_password_authentication` | `false` | Refused unless the connecting user already has an `authorized_keys` |
| `security_ssh_kbd_interactive_authentication` | `false` | Current directive; replaces the deprecated `ChallengeResponseAuthentication` |
| `security_ssh_allowed_users` / `_groups` | `[]` | `AllowUsers`/`AllowGroups`; must include the connecting user if set |
| `security_sudoers_nopasswd` | `[]` | Users granted passwordless sudo via `/etc/sudoers.d/90-nopasswd` |
| `security_fail2ban_enabled` | `true` | Install and enable fail2ban, jail on the SSH port |
| `security_autoupdate_enabled` | `true` | Enable the OS's automatic-update mechanism |
| `security_autoupdate_reboot` | `false` | Debian only: reboot automatically after a patch that needs it |
| `security_auditd_enabled` | `true` | Install and enable auditd |
| `security_sysctl_hardening_enabled` | `true` | Apply `security_sysctl_settings` via `/etc/sysctl.d/99-security-hardening.conf` |

## Verify

```bash
sshd -T | grep -Ei '^(port|permitrootlogin|passwordauthentication) '
systemctl status fail2ban auditd
systemctl list-timers | grep -E 'dnf-automatic|zypper-patch|apt-daily'
sysctl net.ipv4.tcp_syncookies kernel.yama.ptrace_scope
```

## Notes

- **Lockout risk.** This is the highest-risk module in the repo: it changes how
  you log in. Three preflight `assert` tasks refuse to run rather than lock out
  the current connection: (1) `security_ssh_permit_root_login: 'no'` is
  rejected while `ansible_user` is `root`; (2) a non-empty
  `security_ssh_allowed_users` must include the connecting user; (3)
  `security_ssh_password_authentication: false` is rejected unless the
  connecting user already has a non-empty `~/.ssh/authorized_keys` on the
  target. These guards cover the common mistakes, not every possible one — a
  firewall rule, a broken PAM stack, or a typo'd username in `AllowUsers` can
  still cut you off.
- **Recovery if locked out anyway.** SSH is gone, so recovery needs out-of-band
  access: cloud provider serial/web console, IPMI/iDRAC/iLO, or physical
  console. From there, either fix and re-run this playbook, or manually remove
  `/etc/ssh/sshd_config.d/10-hardening.conf` and restart `sshd`/`ssh` to fall
  back to the distro default.
- The sshd drop-in and the `Include` line in `/etc/ssh/sshd_config` are both
  written with `validate: sshd -t -f %s` — a syntactically bad config is never
  committed to disk, only rejected before the write.
- RHEL 8 does not ship `/etc/ssh/sshd_config.d/` or its `Include` line by
  default (confirmed against Red Hat's own guidance); this play creates both
  explicitly instead of assuming they exist, so the same drop-in approach works
  identically on RHEL 8 through 10 and on Debian/Ubuntu/SUSE.
- `ChallengeResponseAuthentication` is a deprecated alias for
  `KbdInteractiveAuthentication` in current OpenSSH; this module only ever
  writes the current directive.
- fail2ban on RHEL/Rocky/Alma/CentOS Stream requires EPEL, installed
  automatically here (skipped on Fedora and Amazon Linux, where it is either
  unnecessary or not applicable — install fail2ban manually there if needed).
- SUSE's automatic-update story is deliberately not YaST's Online Update
  Configuration: that mechanism's `/etc/sysconfig/automatic_online_update` is
  GUI-oriented and its exact keys could not be confirmed against a primary
  source. Instead this module ships a small, auditable
  `zypper-patch.timer`/`.service` pair that runs `zypper --non-interactive
  patch` on a schedule.
- `security_autoupdate_reboot` only affects Debian/Ubuntu's
  `unattended-upgrades`. Scheduling or performing a reboot after a `dnf` or
  `zypper` update is out of scope here — see the `update-upgrade` module.
