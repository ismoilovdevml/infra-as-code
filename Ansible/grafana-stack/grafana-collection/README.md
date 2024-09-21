# 🚀 Ansible Setup for Grafana, Loki, and Promtail

This repository contains Ansible playbooks for setting up and configuring **Grafana**, **Loki**, and **Promtail** on your servers.

## 📋 Prerequisites

Ensure that you have Ansible installed and can connect to your target servers. You will also need to install the Grafana Ansible collection using the command below:

```bash
ansible-galaxy collection install ansible.posix
ansible-galaxy collection install grafana.grafana
```
## 🗂️ Inventory File

Before running the playbooks, configure the inventory.ini file with your server details. Here’s an example:

```
[grafana_servers]
server1 ansible_host=10.128.0.47 ansible_user=root
server2 ansible_host=10.128.0.48 ansible_user=root
server3 ansible_host=10.128.0.45 ansible_user=root

[loki_servers]
server1 ansible_host=10.128.0.47 ansible_user=root
server2 ansible_host=10.128.0.48 ansible_user=root
server3 ansible_host=10.128.0.45 ansible_user=root

[promtail_servers]
server1 ansible_host=10.128.0.47 ansible_user=root
server2 ansible_host=10.128.0.48 ansible_user=root
server3 ansible_host=10.128.0.45 ansible_user=root
```
## ⚙️ Installing Grafana
To install Grafana on your target servers, run the following command:

```bash
ansible-playbook -i inventory.ini install_grafana.yml
```
This playbook installs and configures Grafana, including setting admin credentials.

## 📊 Installing Loki

To install **Loki**, the log aggregation system, use this command:

```bash
ansible-playbook -i inventory.ini install_loki.yml
```
This installs Loki and applies the configuration as defined in `install_loki.yml`.

## 📨 Installing Promtail
For **Promtail**, the log shipper for Loki, use this playbook:

```bash
ansible-playbook -i inventory.ini install_promtail.yml
```
This ensures Promtail is installed and ready for log collection.

## 🔧 Configuring Promtail

Once Promtail is installed, you can configure it with the following command:

```bash
ansible-playbook -i inventory.ini configure_promtail.yml -e "promtail_config_file_name=config.yml"
```

In this case, the configuration file `config.yml` (located in the `promtail_config/` directory) will be copied to the server and applied by restarting the Promtail service.

