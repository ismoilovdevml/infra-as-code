# Kibana

Installs Kibana from Elastic's official package repository (APT / YUM-DNF / zypper) and
enrolls it with an Elasticsearch cluster using an enrollment token.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 12/13, Ubuntu 20.04/22.04/24.04 | official APT repo |
| RedHat | RHEL/Rocky/AlmaLinux/Oracle Linux 8/9/10, Amazon Linux 2023 | official YUM/DNF repo, `enabled=1` |
| Suse | SLES 15, openSUSE Leap 15 | official zypper repo |

Fedora and CentOS Stream are not in Elastic's support matrix for the 9.x line and are
rejected by the preflight check. Same drops as Elasticsearch 9.x: RHEL/CentOS 7,
Debian 11 and older, Ubuntu 18.04 and older, Amazon Linux 2, SLES 12.

## Requirements

- Ansible core >= 2.15
- Collection: `community.general` (`ansible-galaxy collection install -r requirements.yml`)
- `sudo`/root on the target
- A reachable, already-configured Elasticsearch node in the `[elasticsearch]` inventory
  group (see `inventory.ini`) - used only to run
  `elasticsearch-create-enrollment-token -s kibana` via `delegate_to`
- `elastic_version` here must match the Elasticsearch cluster's version

## Usage

```bash
ansible-playbook install.yml                 # install package, template base kibana.yml
ansible-playbook configure.yml               # enrollment token + kibana-setup, start service
ansible-playbook uninstall.yml               # remove package, repo, and data
ansible-playbook install.yml --check --diff  # dry-run
```

`install.yml` deliberately does not start the Kibana service. `configure.yml` must run
next: it fetches a 30-minute enrollment token from the Elasticsearch node and feeds it to
`kibana-setup` before Kibana's first start - starting Kibana unenrolled leaves it stuck
in "Kibana server is not ready yet".

## Variables

| Variable | Default | Description |
|---|---|---|
| `elastic_major_version` / `elastic_version` | `"9"` / `"9.4.4"` | Must match the Elasticsearch cluster |
| `server_host` | `127.0.0.1` | Loopback-only by default; set `0.0.0.0` for remote browser access |
| `server_port` | `5601` | |
| `server_public_base_url` | `""` | Required behind a proxy/load balancer |
| `elasticsearch_enrollment_host` | first host in `[elasticsearch]` group | Delegation target for the enrollment token |

## Verify

```bash
systemctl status kibana
curl -s http://127.0.0.1:5601/api/status | head
```

## Notes

- Kibana source (8.16+ and all of 9.x) is triple-licensed AGPLv3 / Elastic License 2.0
  (ELv2) / SSPL 1.0, same as Elasticsearch - no separate `-oss` package exists.
- Enrollment is idempotent: it is only performed when `/etc/kibana/kibana.keystore` is
  absent. The enrollment token itself is captured with `no_log: true` and never written
  to disk.
- Auto-configuration does not enable TLS on the Kibana HTTP endpoint - browser traffic is
  plain HTTP on `server_port` unless `server.ssl.*` is configured separately.
- SELinux is left untouched, matching Elastic's docs; see the Elasticsearch README for
  the rationale.
- `server_host: 0.0.0.0` only controls the listener; put a reverse proxy with TLS in
  front for anything beyond a lab environment.
