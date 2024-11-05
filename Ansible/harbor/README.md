# 🚢 Harbor Deployment and Cleanup with Ansible

Harbor is an open-source container registry that provides users with secure storage, vulnerability analysis, role-based access control, and more for container images. This guide explains how to deploy and clean up a Harbor instance using Ansible.

---

## 📋 Prerequisites

- **Docker** and **Docker Compose** must be installed on the target machine.
- **Ansible** installed on the control node.
- **SSL Option**: You can use either `certbot` for automatic certificate generation or `self_signed` for custom certificates.

---

## ⚙️ Configuration: `vars.yml`

Edit the `vars.yml` file to set up your specific configuration for Harbor. 

```yaml
harbor_version: "v2.11.1"
harbor_hostname: "harbor.helm.uz"
harbor_admin_password: "Harbor12345"
harbor_db_password: "root123"
ssl_option: "certbot"  # Options: "certbot" or "self_signed"
certbot_cert_path: "/etc/letsencrypt/live/{{ harbor_hostname }}/fullchain.pem"
certbot_key_path: "/etc/letsencrypt/live/{{ harbor_hostname }}/privkey.pem"
self_signed_cert_path: "/path/to/selfsigned/fullchain.pem"  # Specify path for self-signed cert
self_signed_key_path: "/path/to/selfsigned/privkey.pem"     # Specify path for self-signed key
harbor_download_url: "https://github.com/goharbor/harbor/releases/download/{{ harbor_version }}/harbor-offline-installer-{{ harbor_version }}.tgz"
```

## 📂 Inventory File: `inventory.ini`
Define your target servers in `inventory.ini`.

```ini
[harbor_server]
rockylinux ansible_host=24.144.106.189 ansible_user=root
```

## 🚀 Deployment Steps
### 1. Run the Bootstrap Playbook
This playbook (`bootstrap_harbor.yml`) sets up Harbor on the specified host, including handling SSL configuration and deploying Harbor services.

Run the playbook:
```bash
ansible-playbook -i inventory.ini bootstrap_harbor.yml
```
### 📝 Important Playbook Variables:
* **Certificate Path:** Automatically set based on `ssl_option` (either `certbot` or `self_signed`).
* **Harbor Version:** Configurable via `vars.yml` to update Harbor versions seamlessly.

## 🧹 Cleanup Steps
To completely remove Harbor, use the `cleanup.yml` playbook. It stops and removes all Harbor-related containers, images, and data.

### 2. Run the Cleanup Playbook
This playbook removes Harbor components from the host, cleaning up all associated containers, images, and directories.

```bash
ansible-playbook -i inventory.ini `cleanup.yml`
```

### 📝 Cleanup Actions:
* Stops and removes all Harbor containers.
* Deletes all Harbor images.
* Clears Harbor data and installation directories.