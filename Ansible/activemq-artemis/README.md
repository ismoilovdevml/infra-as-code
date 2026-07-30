# Apache ActiveMQ Artemis

Installs Artemis from the official Apache tarball, creates a broker instance with
`artemis create` (kept separate from the distribution directory, as upstream
recommends for easier upgrades), and runs it under a repository-authored systemd
unit. See `cluster/` for a multi-node shared-store HA topology.

## Supported platforms

| OS family | Requirement |
| --- | --- |
| Debian | Debian 11+, Ubuntu 22.04+ — `openjdk-17-jdk` |
| RedHat | RHEL/Rocky/Alma 8+, Fedora, Amazon Linux 2023 — `java-17-openjdk` |
| Suse | openSUSE Leap 15+, SLES 15 — `java-17-openjdk` |

Artemis is a JVM application; upstream publishes no OS matrix. **Java 17 is required**
since Artemis 2.39.0 (embedded Jetty 12). The play verifies the installed major
version and fails before touching anything else.

## Requirements

- Ansible core >= 2.15
- Collections: `community.general` (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install.yml
ansible-playbook install.yml --check --diff
ansible-playbook cleanup.yml
ansible-playbook cleanup.yml -e artemis_purge_data=true
```

Set the admin password before running:

```bash
ansible-vault edit group_vars/artemis_servers/vault.yml
# vault_artemis_admin_password: "..."
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `artemis_version` | `2.55.0` | Must be a currently mirrored release — see Notes |
| `artemis_install_dir` | `/opt/artemis` | Symlink to the versioned distribution |
| `artemis_instance_dir` | `/opt/artemis-instance` | Broker instance, kept outside `ARTEMIS_HOME` |
| `artemis_admin_user` / `artemis_admin_password` | `admin` / vault-backed, empty | Broker admin user; play asserts non-empty |
| `artemis_acceptor_port` | `61616` | Multi-protocol acceptor (CORE/AMQP/STOMP/MQTT/OPENWIRE) |
| `artemis_web_port` | `8161` | Web console / Jolokia |
| `artemis_purge_data` | `false` | `cleanup.yml`: also delete the instance directory |

## Verify

```bash
systemctl status artemis
/opt/artemis-instance/bin/artemis version
curl http://<host>:8161
```

## Notes

- The tarball is verified against the upstream `.sha512`, fetched from
  `downloads.apache.org` regardless of which mirror serves the tarball itself.
- `dlcdn.apache.org` serves **only currently supported releases**; when
  `artemis_version` ages out, point `artemis_mirror_url` at
  `https://archive.apache.org/dist/activemq/activemq-artemis`.
- `artemis create` is not idempotent; it is guarded by `creates:` against the
  instance's own startup script rather than re-run with `--force` on every play.
- No upstream systemd unit exists for Linux; the one installed here is authored by
  this repository (`Type=forking` + `PIDFile=<instance>/data/artemis.pid`).
- Jolokia is opened to any origin (`*://*`) for convenience; restrict this before
  exposing the web console beyond a trusted network.
