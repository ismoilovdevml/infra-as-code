# PHP

Installs PHP-FPM and a common extension set from each platform's own repository:
deb.sury.org on Debian/Ubuntu, Remi on Enterprise Linux (RHEL/Rocky/Alma/CentOS
Stream/Oracle), the distribution's own channel on Fedora/Amazon Linux and openSUSE/SLES.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `packages.sury.org` APT repo, versioned packages (`php8.4-*`) |
| RedHat (EL) | RHEL/Rocky/Alma/CentOS Stream/Oracle 8-9 | Remi + EPEL + CRB/PowerTools, DNF module stream `php:remi-<version>` |
| RedHat (EL10) | RHEL/Rocky/Alma/CentOS Stream/Oracle 10 | Remi, versioned side-by-side packages (`php84-*`) — RHEL 10 dropped DNF modularity |
| RedHat (native) | Fedora 40+, Amazon Linux 2023 | distro's own `php-*` packages, no version pinning |
| Suse | openSUSE Leap 15.x, SLES 15 | distro's own `php8`/`php8-*` packages, no version pinning |

Anything else fails in preflight with an explicit message.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, for
  `dnf_config_manager` and `zypper`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install_php.yml
ansible-playbook install_php.yml -e php_version=8.5
ansible-playbook install_php.yml --check --diff
ansible-playbook uninstall_php.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `php_version` | `"8.4"` | Full `major.minor` — used verbatim in Debian/Sury and EL module-stream package names |
| `php_extensions_debian` | see `vars.yml` | Suffixes installed as `php<version>-<ext>` |
| `php_extensions_redhat` | see `vars.yml` | Suffixes installed as `php-<ext>` (EL module stream / Fedora / Amazon) or `php<compact>-<ext>` (EL10) |
| `php_fpm_state` | `started` | Passed to the `php-fpm` service |

## Verify

```bash
php -v
systemctl status php8.4-fpm       # Debian/Sury
systemctl status php-fpm          # RHEL module-stream / Fedora / Amazon / SUSE
systemctl status php84-php-fpm    # RHEL 10 (no DNF modules)
```

## Notes

- `php_version` must match exactly what the target repository publishes: `8.4` on
  Debian/Sury and EL module streams. On Fedora, Amazon Linux and SUSE there is no version
  control at all — whatever the distro ships is installed, and `php_version` is not used
  in the package name on those paths.
- **RHEL 10 dropped DNF modularity.** `dnf module enable php:remi-X.Y` no longer applies;
  this playbook detects the major version and switches to Remi's versioned side-by-side
  packages (`php84-cli`, `php84-fpm`, ...) automatically. Re-running with a different
  `php_version` on EL8/EL9 resets the module stream first so the switch is clean.
- Sury's Ubuntu PPA (`ppa:ondrej/php`) is mid-migration to `packages.sury.org` as of 2026;
  this playbook always uses `packages.sury.org` directly, never the PPA.
- openSUSE/SLES have no official vendor PHP repository equivalent to Sury/Remi; the OBS
  community project `devel:languages:php:phpNN` is the only way to pin an exact version
  there, and this playbook does not add it automatically.
