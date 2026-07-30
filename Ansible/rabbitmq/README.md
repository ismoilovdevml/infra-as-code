# RabbitMQ

Installs RabbitMQ from the official Team RabbitMQ apt/yum repositories, or (via
`docker.yml`) runs it as a container. Erlang is installed from the same paired
repository as RabbitMQ — never from the distro's own outdated Erlang packages.

## Supported platforms

| OS family | Versions | Notes |
| --- | --- | --- |
| Debian | Debian 11/12/13, Ubuntu 20.04/22.04/24.04 | official apt repo, amd64 only |
| RedHat | RHEL/Rocky/Alma 8/9, Fedora, Amazon Linux 2023 | official yum repo |
| Suse | not supported | Team RabbitMQ ships no maintained zypper repo for stable releases |

RabbitMQ 4.3.x requires **Erlang/OTP 27.x**. Installing Erlang and RabbitMQ from the
same repository generation (this playbook does) keeps the two version-matched;
mixing distro Erlang with the vendor RabbitMQ package is the most common cause of a
node that fails to start.

## Requirements

- Ansible core >= 2.15
- Collections: `community.rabbitmq`, `community.docker` (`ansible-galaxy collection
  install -r requirements.yml`)
- `sudo` on the target
- Docker path only: Docker Engine already installed on the target (see `../docker/`)

## Usage

```bash
ansible-playbook install_rabbitmq.yml       # native package install
ansible-playbook configure_rabbitmq.yml     # rabbitmq.conf, management plugin, admin user
ansible-playbook uninstall.yml              # remove packages (and data if purging)
ansible-playbook install_rabbitmq.yml --check --diff

ansible-playbook docker.yml                 # container install instead of packages
ansible-playbook cleanup_docker.yml         # remove the container/image/data
```

Set the admin password before running either path:

```bash
ansible-vault edit group_vars/rabbitmq_servers/vault.yml
# vault_rabbitmq_admin_password: "..."
# vault_rabbitmq_docker_admin_password: "..."
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `rabbitmq_series` | `4.3` | Current stable series tracked for documentation only |
| `rabbitmq_admin_user` / `rabbitmq_admin_password` | `admin` / vault-backed, empty | Management/API admin user; play asserts non-empty |
| `rabbitmq_management_plugin_enabled` | `true` | Enables `rabbitmq_management` |
| `rabbitmq_amqp_port` | `5672` | AMQP 0-9-1 / 1.0 listener |
| `rabbitmq_management_port` | `15672` | Management UI / HTTP API |
| `rabbitmq_purge_data` | `false` | `uninstall.yml`/`cleanup_docker.yml`: also delete data |
| `rabbitmq_docker_image` | `4.3-management` | Docker Hub tag used by `docker.yml` |

## Verify

```bash
systemctl status rabbitmq-server
rabbitmqctl status
curl -u <user>:<password> http://<host>:15672/api/healthchecks/node
```

## Notes

- The default `guest`/`guest` user is left in place; upstream already restricts it to
  loopback connections. Do not set `loopback_users.guest = false` in `rabbitmq.conf`
  unless its password is changed first — doing so exposes it over the network.
- Config is the current `rabbitmq.conf` sysctl-style format, not the legacy Erlang-term
  `rabbitmq.config`.
- Ports `25672` (inter-node/CLI) and `4369` (`epmd`) must stay firewalled to cluster
  peers; do not expose them publicly.
- The apt repository only publishes amd64 packages; arm64 Debian/Ubuntu is not
  supported by this playbook.
