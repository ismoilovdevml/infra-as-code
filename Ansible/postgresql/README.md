# 🚀 PostgreSQL Setup with Ansible

This repository contains Ansible playbooks for installing and configuring PostgreSQL using the [ANXS.postgresql](https://galaxy.ansible.com/ui/standalone/roles/ANXS/postgresql/documentation/) role. The setup is divided into two stages:
1. **Installation**: Install PostgreSQL on the target servers.
2. **Configuration**: Set up PostgreSQL users, databases, and other settings.

## 📋 Prerequisites

Before running the playbooks, ensure that the following are installed and properly configured:

- Ansible 2.9+
- python3 
- Target servers with SSH access
- PostgreSQL role from Ansible Galaxy

You can install the required role with the following command:

```bash
sudo yum install -y python3
ansible-galaxy collection install community.postgresql
ansible-galaxy role install ANXS.postgresql,v1.16.0
```

## 🛠️ Playbooks
### Install PostgreSQL
The install_postgresql.yml playbook installs PostgreSQL on the target servers.

```bash
ansible-playbook -i inventory.ini install_postgresql.yml
```
### Configure PostgreSQL
The `configure_postgresql.yml` playbook configures PostgreSQL with custom users, roles, and authentication settings.

```bash
ansible-playbook -i inventory.ini configure_postgresql.yml
```