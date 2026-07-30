# Elasticsearch

Installs Elasticsearch from Elastic's official package repository (APT / YUM-DNF /
zypper) and configures a single-node (or first-node) cluster with security enabled.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 12/13, Ubuntu 20.04/22.04/24.04 | official APT repo |
| RedHat | RHEL/Rocky/AlmaLinux/Oracle Linux 8/9/10, Amazon Linux 2023 | official YUM/DNF repo, `enabled=0` + `enablerepo` |
| Suse | SLES 15, openSUSE Leap 15 | official zypper repo |

Fedora and CentOS Stream are not in Elastic's support matrix for the 9.x line and are
rejected by the preflight check. RHEL/CentOS 7, Debian 11 and older, Ubuntu 18.04 and
older, Amazon Linux 2, and SLES 12 were dropped in the 9.x line and are also rejected.

## Requirements

- Ansible core >= 2.15
- Collections: `ansible.posix`, `community.general`
  (`ansible-galaxy collection install -r requirements.yml`)
- `sudo`/root on the target
- `vm.max_map_count = 1048576` is set by this playbook itself; no manual step required

## Usage

```bash
ansible-playbook install.yml                 # install package, set kernel tunables, start service
ansible-playbook configure.yml               # (re)template elasticsearch.yml, restart
ansible-playbook uninstall.yml               # remove package, repo, and data
ansible-playbook install.yml --check --diff  # dry-run
```

Run `install.yml` first so Elasticsearch's own first-start security auto-configuration
generates the TLS certs and keystore under `/etc/elasticsearch/certs/`. Only run
`configure.yml` afterwards - it re-templates `elasticsearch.yml` using the same
certificate paths auto-config created, and restarts the service.

## Variables

| Variable | Default | Description |
|---|---|---|
| `elastic_major_version` | `"9"` | Repo line (`packages/<major>.x/...`); Elastic ships `8` and `9` |
| `elastic_version` | `"9.4.4"` | Exact version pin on Debian/Ubuntu; RHEL/SUSE always install latest in the major repo |
| `network_host` | `127.0.0.1` | Non-loopback switches the node into production mode + bootstrap checks |
| `vm_max_map_count` | `1048576` | Required once `network_host` leaves loopback |
| `cluster_bootstrap` | `true` | Set `false` after the cluster has formed once |
| `cluster_name` / `node_name` | `my-application` / `{{ inventory_hostname }}` | |

## Verify

```bash
systemctl status elasticsearch
curl -k -u elastic:$(cat /root/.elastic_password) https://localhost:9200
```

## Notes

- Elasticsearch and Kibana source (8.16+ and all of 9.x) is triple-licensed
  AGPLv3 / Elastic License 2.0 (ELv2) / SSPL 1.0 - no separate `-oss` package exists.
- The `elastic` superuser password is reset once via `elasticsearch-reset-password -b`
  (gated on `/etc/elasticsearch/.ansible_elastic_password_set` for idempotency) and
  written only to `/root/.elastic_password` (mode `0600`). It is never logged
  (`no_log: true`) and never written to a world-readable file.
- SELinux is left untouched. Elastic's docs do not require disabling it; if a real AVC
  denial occurs, fix the file context (`restorecon`) or add a policy module instead of
  disabling enforcement.
- `cluster_bootstrap: true` / `cluster.initial_master_nodes` must be set back to `false`
  once the cluster has formed - leaving it set on a running cluster risks a split
  cluster on restart.
- For multi-node clusters, review `discovery_seed_hosts` and the security enrollment
  flow (`elasticsearch-create-enrollment-token -s node` / `elasticsearch-reconfigure-node`)
  - only single/first-node bootstrap is automated here.
