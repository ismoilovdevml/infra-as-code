# Apache ZooKeeper

Installs ZooKeeper from the official Apache tarball with a repository-authored
systemd unit. Builds a standalone node or a replicated quorum, depending on how
many hosts are in the `zookeeper_nodes` group.

## Supported platforms

| OS family | Requirement |
| --- | --- |
| Debian | Debian 11+, Ubuntu 22.04+ — `openjdk-11-jre-headless` |
| RedHat | RHEL/Rocky/Alma 8+, Fedora, Amazon Linux 2023 — `java-11-openjdk-headless` |
| Suse | openSUSE Leap 15+, SLES 15 — `java-11-openjdk-headless` |

ZooKeeper is a JVM application; upstream publishes no OS matrix. Upstream states
JDK 8 and 11 are supported. Newer LTS releases are widely used in practice but are
not blessed in the docs, so 11 is the default.

## Requirements

- Ansible core >= 2.15
- No external collections
- `sudo` on the target
- An odd number of nodes (3 or 5) for a real quorum

## Usage

```bash
ansible-playbook install.yml
ansible-playbook install.yml --check --diff
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e zookeeper_purge_data=true
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `zookeeper_version` | `3.9.5` | Must be a currently mirrored release — see Notes |
| `zookeeper_id` | group index | `myid`. Set per host in the inventory |
| `zookeeper_client_port` | `2181` | Client connections |
| `zookeeper_peer_port` | `2888` | Follower to leader |
| `zookeeper_election_port` | `3888` | Leader election |
| `zookeeper_data_dir` | `/var/lib/zookeeper` | Snapshot store, holds `myid` |
| `zookeeper_4lw_whitelist` | `srvr,ruok,stat` | Four-letter-word commands allowed |
| `zookeeper_heap_opts` | `-Xmx1G -Xms1G` | Raise for real workloads |

## Verify

```bash
systemctl status zookeeper
echo ruok | nc <host> 2181     # -> imok
echo srvr | nc <host> 2181     # Mode: leader | follower | standalone
```

## Notes

- **`myid` must be stable.** It is written from `zookeeper_id` and must match the
  host's `server.<N>` line in `zoo.cfg`. Renumbering a live cluster corrupts it.
- With one host in the group the config is written in **standalone** mode (no quorum
  block). With more than one, the full `server.N=host:2888:3888` set is rendered.
- `dlcdn.apache.org` serves **only currently supported releases** — 3.9.2, which this
  playbook previously pinned, has already aged out and 404s. Bump `zookeeper_version`
  or point `zookeeper_mirror_url` at `https://archive.apache.org/dist/zookeeper`.
- Note the upstream path asymmetry: the directory is `zookeeper-<VER>` but the tarball
  is `apache-zookeeper-<VER>-bin.tar.gz`.
- The unit runs `zkServer.sh start-foreground` with `Type=simple`; plain
  `zkServer.sh start` daemonises itself and systemd cannot track it.
- Four-letter-word commands are **denied by default** upstream. Only the health-check
  subset is enabled here — do not widen `zookeeper_4lw_whitelist` on an exposed port.
- The client port binds `0.0.0.0` and has no authentication. Restrict it at the
  firewall or configure SASL before exposing it.
- Java installation was folded in from the old `java_8_11.yml`, which has been removed.
  See [../java/](../java/) for standalone JDK management.
- ZooKeeper is **not** required by Kafka 4.x — see [../kafka/](../kafka/), which runs
  in KRaft mode.
