# ⚙️ Grafana Stack Setup Playbook

This Ansible playbook installs and configures the **Grafana stack**, including **Prometheus** and **Grafana**, using the official collections with custom modifications. It allows you to manage and deploy Prometheus, Grafana, and various Prometheus exporters in a flexible way.

## 📦 Collections Used

This playbook is based on the following Ansible collections:

- [Grafana Ansible Collection](https://github.com/grafana/grafana-ansible-collection/tree/main)
- [Prometheus Ansible Collection](https://github.com/prometheus-community/ansible)

## ✨ Modifications

The playbook has been modified from the official repositories to provide more flexibility, including:
- **Selective Exporter Installation**: Ability to define which Prometheus exporters to install through variable flags (`yes` or `no`).
- **Preconfigured Alert Manager**: Integrated configuration for **AlertManager** to send notifications to Discord via webhooks.

## 📋 Prerequisites

Before running this playbook, ensure that the following requirements are met:

- **Ansible 2.9+** is installed on the control node.
- **SSH access** to all target servers is set up.

You can install the necessary collections using:

```bash
ansible-galaxy collection install prometheus.prometheus
ansible-galaxy collection install grafana.grafana
```
