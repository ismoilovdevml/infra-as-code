How to Run These Playbooks:
Install Zabbix Server:

```bash
ansible-galaxy collection install community.zabbix
```

```bash
ansible-playbook -i inventory.ini zabbix_server.yml
```
Install Zabbix Agents:

```bash
ansible-playbook -i inventory.ini zabbix_agent.yml
```
Manage Hosts (API-based):

```bash
ansible-playbook -i inventory.ini zabbix-hosts-management.yml
```
Link Templates:

```bash
ansible-playbook -i inventory.ini zabbix-templates-management.yml
```