How to Run These Playbooks:
Install Zabbix Server:

```bash
ansible-galaxy collection install ansible.posix
ansible-galaxy collection install community.general
ansible-galaxy collection install ansible.netcommon
ansible-galaxy collection install community.zabbix
```

```bash
ansible-playbook -i inventory.ini zabbix_server.yml
```
Install Zabbix Agents:

```bash
ansible-playbook -i inventory.ini zabbix_agent.yml
```