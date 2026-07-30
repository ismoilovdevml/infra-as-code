# Update/Upgrade

Safe, unattended package upgrade per OS family: refresh cache, full upgrade,
autoremove/clean, then detect (and optionally act on) whether a reboot is
required.

## Supported platforms

| OS family | Versions | Tool |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `apt-get dist-upgrade` via `ansible.builtin.apt` |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, CentOS Stream 9+, Amazon Linux 2023 | `dnf upgrade` via `ansible.builtin.dnf` |
| Suse | openSUSE Leap 15.x, SLES 15 | `zypper dist-upgrade` via `community.general.zypper` |

## Requirements

- Ansible core >= 2.15
- Collections: `community.general` (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on the target

## Usage

```bash
ansible-playbook update_upgrade.yml                 # upgrade + detect reboot need
ansible-playbook update_upgrade.yml --check --diff   # dry-run
ansible-playbook update_upgrade.yml --tags verify    # only report reboot status
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `update_upgrade_cache_valid_time` | `3600` | apt cache freshness window (seconds) |
| `update_upgrade_autoremove` | `true` | Remove unused dependencies after upgrading |
| `update_upgrade_clean_cache` | `true` | Clean the local package cache after upgrading |
| `update_upgrade_reboot_if_required` | `false` | Actually reboot when a reboot is detected as required |
| `update_upgrade_reboot_timeout` | `600` | Seconds to wait for the host to come back |
| `update_upgrade_reboot_pre_delay` / `_post_delay` | `5` / `30` | Seconds before/after issuing the reboot |

## Verify

```bash
cat /var/run/reboot-required 2>/dev/null       # Debian/Ubuntu
dnf needs-restarting -r; echo $?               # RHEL family (1 = reboot needed)
zypper ps -s                                   # SUSE
```

## Notes

- Reboot detection always runs; actually rebooting does not, unless
  `update_upgrade_reboot_if_required: true` **and** a reboot was detected as
  required for that host's family. Off by default so this playbook is safe to
  run against a live fleet without an unplanned outage.
- SUSE's reboot signal is a heuristic: `zypper ps -s` lists systemd services
  still holding deleted files after an update (a process/service-restart
  indicator), not a single dedicated "reboot required" boolean the way
  `dnf needs-restarting -r` or Debian's `/var/run/reboot-required` are. Any
  non-empty output is treated as "restart recommended".
- `dnf clean all` / `zypper clean --all` have no idempotent module state in
  `ansible.builtin.dnf` / `community.general.zypper`, so they run via
  `ansible.builtin.command` with `changed_when: false` — cache cleanup is
  maintenance, not a tracked state change.
- EPEL setup is intentionally **not** part of this module — it is handled by
  the `security` module (`epel-release`, for fail2ban). A plain `dnf upgrade`
  does not require EPEL unless EPEL packages are already installed on the
  host.
- The previous version of this module also installed a fixed CLI toolset
  (git, curl, wget, vim, htop, nano, net-tools, traceroute). That is out of
  scope for "update/upgrade" and has been removed rather than carried along
  silently; provision a toolset with a dedicated playbook if you need one.
- `community.general.zypper` is the correct FQCN for zypper — there is no
  `ansible.builtin.zypper` module (the previous version of this file used that
  invalid name; it happened to still work because Ansible's plugin loader
  fell back to a short-name match, not because the FQCN was valid).
