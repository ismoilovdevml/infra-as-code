# Docker

Installs Docker Engine (`docker-ce`) with the buildx and compose plugins from the
official Docker repository, falling back to the distribution's own package where
Docker Inc. publishes none.

## Supported platforms

| OS family | Versions | Source |
|---|---|---|
| Debian | Debian 11+, Ubuntu 22.04+, Raspbian | `download.docker.com` APT repo (deb822) |
| RedHat | RHEL 8+, CentOS Stream 9+, Rocky 8+, AlmaLinux 8+, Oracle 8+, Fedora 43+ | `download.docker.com` YUM repo |
| RedHat | Amazon Linux 2023 | distribution `docker` package (no upstream repo) |
| Suse | SLES 15 | `download.docker.com/linux/sles/15` |
| Suse | openSUSE Leap / Tumbleweed | distribution `docker` package (no upstream repo) |

Anything else fails in preflight with an explicit message. Releases upstream has
dropped (Ubuntu 20.04, Debian 10, CentOS 7/8, Fedora <= 42) are refused unless
`docker_strict_platform_check=false`.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`, `systemd_service`)
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, SUSE only)
- `sudo` on the target

## Usage

```bash
ansible-playbook install_docker.yml
ansible-playbook install_docker.yml --check --diff                # dry-run
ansible-playbook install_docker.yml --tags configure              # daemon.json + group only
ansible-playbook uninstall_docker.yml
ansible-playbook uninstall_docker.yml -e docker_purge_data=true   # also wipe /var/lib/docker
```

`install_docker-compose.yml` installs the **legacy** standalone `docker-compose`
binary. You do not need it — `install_docker.yml` already provides `docker compose`.

## Variables

| Variable | Default | Description |
|---|---|---|
| `docker_version` | `""` | Exact `docker-ce` pin, e.g. `5:29.6.1-1~ubuntu.24.04~noble`. Empty = repo latest |
| `docker_users` | connection user | Users added to the `docker` group |
| `docker_daemon_options` | `{}` | Rendered to `/etc/docker/daemon.json`; triggers a restart |
| `docker_service_state` | `started` | `started` / `stopped` |
| `docker_strict_platform_check` | `true` | Refuse releases dropped upstream |
| `docker_compose_standalone_version` | `v5.3.1` | Legacy playbook only |

## Verify

```bash
systemctl status docker containerd
docker --version && docker compose version
docker run --rm hello-world
```

## Notes

- Membership of the `docker` group is **root-equivalent**. Keep `docker_users` short;
  a re-login or `newgrp docker` is required before it takes effect. The socket stays
  at its packaged `0660 root:docker` — do not widen it.
- Docker writes its own iptables rules and **bypasses ufw and firewalld**. Put custom
  rules in the `DOCKER-USER` chain. Only `iptables-nft` and `iptables-legacy` are
  supported; rules created directly with `nft` are not.
- On RHEL-family hosts `containerd.io` pulls in `container-selinux`. Bind mounts into
  containers need `:z` / `:Z` labels.
- Ubuntu derivatives (Mint, Pop!_OS) are mapped to the Ubuntu repo via
  `UBUNTU_CODENAME` from `/etc/os-release`, but are not officially supported by Docker.
