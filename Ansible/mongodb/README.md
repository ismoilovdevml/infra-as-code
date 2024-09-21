# 🚀 MongoDB Setup with Ansible

This repository contains Ansible playbooks for installing and configuring MongoDB using the [community.mongodb](https://galaxy.ansible.com/community/mongodb) collection. The setup is divided into two stages:
1. **Installation**: Install MongoDB on the target servers.
2. **Configuration**: Set up MongoDB with users and security settings.

## 📋 Prerequisites

Before running the playbooks, ensure that the following are installed and properly configured:

- Ansible 2.9+ 
- Target servers with SSH access
- `community.mongodb` Ansible collection

You can install the required collection with the following command:

```bash
ansible-galaxy collection install community.mongodb
```
## 🛠️ Playbooks

## Install MongoDB
The install_mongodb.yml playbook installs MongoDB on the target servers.
```bash
ansible-playbook -i inventory.ini install.yml
```
##  Configure MongoDB
The `configure_mongodb.yml` playbook configures MongoDB with authentication, binds to the appropriate IP address, and creates admin users.

```bash
ansible-playbook -i inventory.ini configure_mongodb.yml
```