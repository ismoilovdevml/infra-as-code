# Grafana Stack Setup Playbook

This playbook sets up the Grafana stack, including Prometheus and Grafana, with minor modifications from the official collections.

- Source repositories:
  - [Grafana Ansible Collection](https://github.com/grafana/grafana-ansible-collection/tree/main)
  - [Prometheus Ansible Collection](https://github.com/prometheus-community/ansible)

---

## Prerequisites

Ensure the following requirements are met before running the playbook:

- Ansible 2.9+ is installed.
- Target servers have Python installed.
- SSH access to the target servers.

