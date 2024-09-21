# ⚙️ Ansible Setup for Prometheus and Exporters

This repository contains Ansible playbooks for installing **Prometheus** and a variety of **Prometheus exporters**.

## 📋 Prerequisites

Before starting, ensure you have **Ansible** installed and set up. You also need to install the **Prometheus Ansible collection**:

```bash
ansible-galaxy collection install prometheus.prometheus
```
## 🗂️ Inventory Setup
Make sure your `inventory.ini` is configured properly for your target servers. Here’s an example:

```
[prometheus_servers]
server1 ansible_host=10.128.0.47 ansible_user=root
server2 ansible_host=10.128.0.48 ansible_user=root
server3 ansible_host=10.128.0.45 ansible_user=root

[target_servers]
server1 ansible_host=10.128.0.47 ansible_user=root
server2 ansible_host=10.128.0.48 ansible_user=root
server3 ansible_host=10.128.0.45 ansible_user=root
```

## ⚙️ Installing Prometheus
To install **Prometheus** on your target servers, run the following playbook:

```bash
ansible-playbook -i inventory.ini install_prometheus.yml
```
This will install and configure Prometheus on the servers listed under `prometheus_servers`.

## 📊 Installing Prometheus Exporters
The playbook `prometheus_exporters.yml` allows you to selectively install multiple exporters. You can control which exporters to install by editing the `vars.yml` file and setting each exporter to `true` or `false`.

For example:

```yml
# vars.yml
exporters:
  node_exporter: true
  alertmanager: true
  bind_exporter: false
  blackbox_exporter: true
  cadvisor: false
  chrony_exporter: false
  ...
```

Once you’ve configured the exporters you want to install, run the following command:

```bash
ansible-playbook -i inventory.ini prometheus_exporters.yml
```
This will install the selected exporters on the servers listed under `target_servers`.

### Supported Exporters:
* **Node Exporter:** For hardware and OS metrics.
* **Alertmanager:** For handling alerts sent by Prometheus.
* **Bind Exporter:** For DNS statistics from Bind9.
* **Blackbox Exporter:** For probing endpoints such as HTTPS, DNS, TCP, etc.
* **cAdvisor:** For container metrics.
* **Chrony Exporter:** For time synchronization statistics.
* **Fail2Ban Exporter:** For monitoring Fail2Ban jails.
* **IPMI Exporter:** For server hardware metrics.
* **Memcached Exporter:** For Memcached server metrics.
* **MongoDB Exporter:** For MongoDB statistics.
* **MySQL Exporter:** For MySQL server metrics.
* **NGINX Exporter:** For NGINX web server statistics.
* **PostgreSQL Exporter:** For PostgreSQL database metrics.
* **Process Exporter:** For detailed process metrics.
* **Pushgateway:** For exposing metrics from batch jobs.
* **Redis Exporter:** For Redis server metrics.
* **Smartctl Exporter:** For monitoring hard drives.
* **Smokeping Prober:** For network latency and packet loss measurements.
* **SNMP Exporter:** For collecting SNMP metrics.
* **Systemd Exporter:** For systemd service metrics.