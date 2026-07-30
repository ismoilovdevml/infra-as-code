# Apache Kafka

Installs Kafka from the official Apache tarball in **KRaft mode**, with a
repository-authored systemd unit. ZooKeeper is not used and not supported —
it was removed in Kafka 4.0.

## Supported platforms

| OS family | Requirement |
| --- | --- |
| Debian | Debian 11+, Ubuntu 22.04+ — `openjdk-17-jre-headless` |
| RedHat | RHEL/Rocky/Alma 8+, Fedora, Amazon Linux 2023 — `java-17-openjdk-headless` |
| Suse | openSUSE Leap 15+, SLES 15 — `java-17-openjdk-headless` |

Kafka is a JVM application; upstream publishes no OS matrix. **Java 17 is the hard
minimum** for the broker — Java 8 was removed in Kafka 4.0. The play asserts the
installed major version and fails before touching anything else.

## Requirements

- Ansible core >= 2.15
- No external collections
- `sudo` on the target
- At least 3 nodes for a meaningful KRaft quorum

## Usage

```bash
ansible-playbook install.yml
ansible-playbook install.yml --check --diff
ansible-playbook install.yml -e kafka_cluster_id=<existing-id>   # adding a node
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e kafka_purge_data=true
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `kafka_version` | `4.3.1` | Must be a currently mirrored release — see Notes |
| `kafka_scala_version` | `2.13` | 4.x ships 2.13 only |
| `kafka_process_roles` | `broker,controller` | Combined mode. Split roles for large clusters |
| `kafka_cluster_id` | `""` | Empty = generate on the first node. **Required when adding a node** |
| `kafka_data_dir` | `/var/lib/kafka/data` | Overrides the `/tmp` default, which does not survive a reboot |
| `kafka_broker_port` | `9092` | PLAINTEXT listener |
| `kafka_controller_port` | `9093` | KRaft controller listener |
| `kafka_default_replication_factor` | `min(nodes, 3)` | Cannot exceed the broker count |
| `kafka_heap_opts` | `-Xmx1G -Xms1G` | Raise for real workloads |

## Verify

```bash
systemctl status kafka
/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server <host>:9092
/opt/kafka/bin/kafka-topics.sh --bootstrap-server <host>:9092 --list
```

## Notes

- **No ZooKeeper.** `zookeeper.connect`, `--zookeeper` and `controller.quorum.voters`
  are all gone. This playbook writes `controller.quorum.bootstrap.servers`.
- **No upgrade path from a ZooKeeper cluster.** A 3.x ZooKeeper-backed cluster must
  first go to 3.9 (the last bridge release) and be migrated to KRaft, then to 4.x.
  This playbook only builds new clusters.
- `dlcdn.apache.org` serves **only the three currently supported releases**. When
  `kafka_version` ages out, the download 404s — bump the version, or point
  `kafka_mirror_url` at `https://archive.apache.org/dist/kafka`.
- The tarball is verified against the upstream `.sha512`, which Apache has published
  in two different layouts over time; both are normalised before use.
- Storage is formatted once, guarded by `meta.properties`. Upstream discourages
  auto-format because it can mask a real error.
- **All nodes in a cluster must share one cluster ID.** It is generated on the first
  host of `kafka_nodes` on a fresh install; pass `kafka_cluster_id` explicitly when
  adding nodes later.
- Listeners are PLAINTEXT. Add TLS and SASL before exposing a broker beyond a trusted
  network — `kafka_listen_address` defaults to `0.0.0.0`.
