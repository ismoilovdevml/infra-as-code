# Wazuh

Installs the Wazuh manager and agents from the official `packages.wazuh.com`
repository.

## Scope

This module covers the **manager and agents only**. It does not deploy the Wazuh
indexer or dashboard. For a full indexer + dashboard cluster, use upstream's own
collection rather than a fork:

```bash
ansible-galaxy install -r https://raw.githubusercontent.com/wazuh/wazuh-ansible/main/requirements.yml
```

## Supported platforms

| OS family | Source |
| --- | --- |
| Debian | `packages.wazuh.com/4.x/apt`, suite `stable`, component `main` |
| RedHat | `packages.wazuh.com/4.x/yum` |

Repository architectures: amd64, arm64, armhf, i386, ppc64el. SUSE has no Wazuh
repository — the play fails with an explicit message there.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- `ansible-galaxy collection install -r requirements.yml`
- `sudo` on the target
- The manager reachable from the agents on 1514/udp and 1515/tcp

## Usage

```bash
ansible-playbook install_manager.yml
ansible-playbook install_agent.yml -e wazuh_manager_address=10.0.0.11
ansible-playbook uninstall.yml
ansible-playbook uninstall.yml -e wazuh_purge_data=true   # also delete /var/ossec
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `wazuh_manager_address` | `""` | Required by the agent play |
| `wazuh_version` | `""` | Exact pin, e.g. `4.14.7-1`. Empty = repo current |
| `wazuh_agent_group` | `default` | Group the agent registers into |
| `wazuh_registration_password` | vault | Optional registration password |
| `wazuh_hold_packages` | `true` | Pin the packages against unplanned upgrades |

## Verify

```bash
systemctl status wazuh-manager        # manager
/var/ossec/bin/agent_control -l       # list registered agents
systemctl status wazuh-agent          # agent
tail -f /var/ossec/logs/ossec.log
```

## Notes

- **The `roles/` directory in this folder is a broken partial fork.** It was vendored
  from `wazuh/wazuh-ansible` at Wazuh **4.4.1**, but only `defaults/`, `handlers/`,
  `vars/` and `files/` were copied — **none of the roles contain a `tasks/`
  directory**, so none of them can execute. The old `wazuh-cluster.yml` and
  `wazuh-agent-install.yml` wrappers also referenced paths
  (`wazuh-ansible/roles/wazuh-indexer`) that do not exist in the tree, and both
  failed `--syntax-check`. Those two wrappers have been replaced by the native
  playbooks here. The `roles/` and `playbooks/` directories are left in place but are
  **not used by anything** — delete them, or re-vendor from current upstream.
- The fork also targets the OpenDistro era, which was superseded by OpenSearch.
- **Version skew matters.** Wazuh requires the manager to be at least the agent
  version. `wazuh_hold_packages` puts the packages on hold so an unrelated
  `apt upgrade` cannot silently break the fleet; upgrade managers before agents.
- Agent configuration is applied through the `WAZUH_MANAGER`,
  `WAZUH_AGENT_GROUP` and `WAZUH_REGISTRATION_PASSWORD` environment variables read
  by the package post-install script, so `ossec.conf` is not edited afterwards.
