# Firewall

Configures a host firewall from one portable rule list: `community.general.ufw`
on Debian/Ubuntu, `ansible.posix.firewalld` on RHEL/SUSE. `configure.yml` is the
single entry point and dispatches per host by `ansible_os_family`.

## Supported platforms

| OS family | Versions | Tool |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `ufw` (`community.general.ufw`) |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, CentOS Stream 9+ | `firewalld` (`ansible.posix.firewalld`) |
| Suse | openSUSE Leap 15.x, SLES 15 | `firewalld` (`ansible.posix.firewalld`) |

Both `firewalld` (RHEL 9/10) and `ufw`'s underlying `iptables-nft` shim (Ubuntu
20.10+) run on the kernel `nftables` backend; this module only ever talks to
`ufw`/`firewalld`, never to `nft` directly, so that detail is transparent here.

## Requirements

- Ansible core >= 2.15
- Collections: `community.general`, `ansible.posix`
  (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on the target

## Usage

```bash
ansible-playbook configure.yml                 # dispatch by OS family (entry point)
ansible-playbook ufw.yml                       # ufw only (Debian/Ubuntu inventory)
ansible-playbook firewalld.yml                 # firewalld only (RHEL/SUSE inventory)
ansible-playbook configure.yml --check --diff  # dry-run
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `firewall_ssh_port` | `'22'` | Port the preflight assert requires an allow rule for |
| `firewall_rules` | ssh/http/https allow | Portable rule list: `name`, `rule` (`allow`/`deny`), `proto`, `port`, `src` |
| `firewall_deny_rules` | `[]` | Explicit deny/close entries, same shape as `firewall_rules` |
| `firewall_default_incoming` | `deny` | ufw default incoming policy (applied last) |
| `firewall_default_outgoing` | `allow` | ufw default outgoing policy |
| `firewall_install` | `true` | Install the `ufw`/`firewalld` package if missing |
| `firewall_enable` | `true` | Actually enable/start the firewall (set `false` to only stage rules) |
| `ufw_logging` | `low` | ufw log level |
| `firewalld_default_zone` | `public` | firewalld zone all rules are applied to |

## Verify

```bash
ufw status verbose                                  # Debian/Ubuntu
firewall-cmd --zone=public --list-all                # RHEL/SUSE
```

## Notes

- **Lockout risk.** Both `ufw` and `firewalld` default-deny inbound traffic once
  enforced. This play always applies every allow rule in `firewall_rules` —
  including the SSH one — before it sets ufw's default-incoming policy or
  enables either firewall, and a preflight `assert` refuses to run at all if
  `firewall_rules` has no allow rule for `firewall_ssh_port`. That protects
  against the common mistake, it does **not** make lockout impossible: a `src`
  restricted to a CIDR that excludes the host you actually connect from will
  still cut you off.
- **Recovery if locked out.** SSH is gone, so recovery needs out-of-band access:
  cloud provider serial/web console, IPMI/iDRAC/iLO, or physical console. From
  there run `ufw disable` or `systemctl stop firewalld` (or fix and re-apply the
  rule set), then re-run this playbook with a corrected `firewall_rules`.
- `firewall_deny_rules` is rarely needed: both backends already deny anything
  not explicitly allowed. Use it only to close a port opened by something
  outside this play (e.g. a previous manual `firewall-cmd`/`ufw` command).
- firewalld rules are applied with `permanent: true` and `immediate: true`
  together, so they persist across reboots and take effect immediately in the
  same task — no separate reload step is required.
- Set `firewall_enable: false` to stage and review rules (`--check --diff`)
  without flipping the firewall into enforcement.
