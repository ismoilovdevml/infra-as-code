# Zabbix

Installs Zabbix 7.0 LTS server and agent2 from the official `repo.zabbix.com`
packages, then manages host groups/hosts/templates through the Zabbix API using
`community.zabbix` modules authenticated with a Bearer-native API token.

## Supported platforms

| OS family | Versions | Notes |
| --- | --- | --- |
| Debian | Debian 11+, Ubuntu 20.04/22.04/24.04 | official `repo.zabbix.com` apt repo |
| RedHat | RHEL/Rocky/Alma/CentOS Stream/Oracle Linux 8/9 | official `repo.zabbix.com` yum repo |
| Suse | not implemented | repo.zabbix.com SLES path not verified against a primary source |

Zabbix 7.0 is the current LTS (full support until 2027-06-30). 8.0 LTS is not
yet released (planned Q3 2026) — do not bump `zabbix_series` until it ships.

## Requirements

- Ansible core >= 2.15
- Collections: `community.zabbix`, `community.general`, `ansible.posix`
  (`ansible-galaxy collection install -r requirements.yml`)
- `sudo` on every target
- A running MySQL or PostgreSQL server, with the `zabbix` database/user already
  created — **this playbook does not install or provision the database**
- A Zabbix API token (Users -> API tokens) for `zabbix-hosts-management.yml` /
  `zabbix-templates-management.yml`

## Usage

```bash
ansible-playbook zabbix_server.yml
ansible-playbook zabbix_agent.yml
ansible-playbook zabbix-hosts-management.yml
ansible-playbook zabbix-templates-management.yml
ansible-playbook uninstall.yml
ansible-playbook zabbix_server.yml --check --diff
```

Set secrets before running:

```bash
ansible-vault edit group_vars/all/vault.yml
# vault_zabbix_server_dbpassword: "..."
# vault_zabbix_api_token: "..."
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `zabbix_series` | `7.0` | Current LTS; must match a real `repo.zabbix.com/zabbix/<series>/` tree |
| `zabbix_db_type` | `mysql` | `mysql` or `pgsql`; selects package suffixes and import command |
| `zabbix_agent_flavor` | `agent2` | `agent2` (recommended) or `agent` (classic) |
| `zabbix_server_dbpassword` | vault-backed, empty | Play asserts non-empty |
| `zabbix_api_token` | vault-backed, empty | Bearer-native Zabbix API token; play asserts non-empty |
| `zabbix_host_group` | `Production Servers` | Host group created/used by the management playbooks |
| `zabbix_purge_data` | `false` | `uninstall.yml`: also delete `/var/lib/zabbix` and `/etc/zabbix` |

## Verify

```bash
systemctl status zabbix-server zabbix-agent2
ss -ltnp | grep -E '10050|10051'
```

## Notes

- **API auth:** Zabbix 7.0 deprecated the `auth` body parameter in favour of an
  `Authorization: Bearer` header; 7.4 makes the old parameter a hard error. The
  management playbooks use `ansible_zabbix_auth_key` (an API token) with the
  `httpapi` connection plugin, which is Bearer-native — not username/password.
- **Frontend package name differs by OS**: `zabbix-frontend-php` on Debian/
  Ubuntu vs `zabbix-web-<db>` on RHEL; both are selected automatically from
  `ansible_os_family`.
- The DB schema import (`zabbix-sql-scripts`) is guarded by a marker file since
  it is not safely re-runnable against an already-initialized database.
- The release `.deb`/`.rpm` bootstrap package is installed with GPG checking
  relaxed only for that one package (it is what installs Zabbix's own key);
  every package installed afterwards is verified against that key as usual.
