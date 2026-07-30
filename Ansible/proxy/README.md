# System proxy

Applies a system-wide HTTP proxy to the shell environment, the package manager,
the Docker daemon and the common CLI tools — and can take all of it back out again.

## Supported platforms

| OS family | Package manager target |
| --- | --- |
| Debian | `/etc/apt/apt.conf.d/99proxy` |
| RedHat | `/etc/dnf/dnf.conf` |
| Suse | `/etc/sysconfig/proxy` |

Everything else (environment, docker, git, wget, pip, npm) is family-independent.

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`community.general`)
- `sudo` on the target

## Usage

```bash
ansible-playbook proxy.yml
ansible-playbook proxy.yml --tags packages,docker    # only those consumers
ansible-playbook proxy.yml --check --diff
ansible-playbook proxy_remove.yml                    # revert everything
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `system_proxy_http` | `http://proxy.example.com:3128` | Proxy URL |
| `system_proxy_https` | same | Proxy for HTTPS traffic — still an `http://` URL |
| `system_proxy_no` | localhost, link-local, `.corp` | Bypass list |
| `system_proxy_user` | `""` | Optional proxy username |
| `system_proxy_password` | vault | Optional proxy password |
| `system_proxy_targets` | all `true` | Per-consumer toggles |

## Verify

```bash
grep -A6 'ANSIBLE MANAGED BLOCK proxy' /etc/environment
apt-config dump | grep -i proxy          # Debian
grep proxy /etc/dnf/dnf.conf             # RedHat
systemctl show docker --property=Environment
git config --system --get http.proxy
```

## Notes

- **The variables are prefixed `system_proxy_*` deliberately.** Naming a play variable
  `http_proxy` shadows the environment name Ansible itself uses for module
  connections, which produces confusing failures unrelated to the target host.
- `https_proxy` should be an **`http://`** URL. Proxies are reached over plain HTTP
  even for HTTPS traffic (CONNECT tunnelling); an `https://` scheme here is almost
  always a mistake.
- Every managed section is written with a `blockinfile` marker, so `proxy_remove.yml`
  can remove exactly what was added. The previous version used `lineinfile` on
  `/etc/environment`, which appended duplicates on every run and could not be undone.
- **Credentials in the URL end up in world-readable config files** (`/etc/environment`,
  `/etc/wgetrc`). Prefer an IP-allowlisted proxy over `system_proxy_user`. When a
  username is set, the tasks run with `no_log: true`.
- The Docker daemon does **not** read `/etc/environment` — it needs the systemd
  drop-in this playbook writes, followed by a daemon restart.
- curl has no documented system-wide rc file; it picks the proxy up from the
  environment variables instead, so there is no separate curl target.
- `/etc/environment` is read by PAM at login. Already-running shells and services keep
  the old value until they are restarted.
