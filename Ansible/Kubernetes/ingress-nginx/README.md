# NGINX Ingress Installation with Ansible 🚀

This repository contains Ansible playbooks to **install** and **uninstall** NGINX Ingress in a Kubernetes cluster using Helm.

## Requirements 📋

- Ansible installed on your control node.
- Helm and kubectl configured on the target machine.
- Kubernetes cluster access with sufficient permissions.

## Playbook Overview 📝

### 1. Install NGINX Ingress

This playbook installs NGINX Ingress using Helm and configures Prometheus annotations for metrics scraping.

- **Playbook File:** `install_nginx_ingress.yml`
- **Tasks:**
  - Adds the ingress-nginx Helm repository.
  - Installs NGINX Ingress in the `ingress-nginx` namespace.
  - Waits for services and pods to start.
  - Verifies NGINX Ingress services and pods.
  - Upgrades NGINX Ingress with Prometheus metrics support.

#### Usage:

```bash
ansible-playbook -i inventory.ini install_nginx_ingress.yml
```


### 2. Uninstall NGINX Ingress

- **Playbook File:** `uninstall_nginx_ingress.yml`
- **Tasks:**
  - Uninstalls the ingress-nginx Helm release.
  - Deletes the `ingress-nginx `namespace.
  - Removes the ingress-nginx Helm repository.

#### Usage:

```bash
ansible-playbook -i inventory.ini uninstall_nginx_ingress.yml
```

### Inventory Setup ⚙️
Prepare an inventory file to specify the target Kubernetes nodes:

```ini
[all]
target-host ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
```
### Testing 🧪
Verify NGINX Ingress Installation: After installation, check the NGINX services and pods:

```bash
kubectl get svc -n ingress-nginx
kubectl get pods -n ingress-nginx
```
Uninstall and Cleanup: After uninstallation, ensure the namespace and Helm repository are removed:

```bash
kubectl get namespaces
helm repo list
```
### Supported Platforms 🖥️
* Kubernetes clusters (both cloud and on-premises).
* Requires Helm and kubectl access.