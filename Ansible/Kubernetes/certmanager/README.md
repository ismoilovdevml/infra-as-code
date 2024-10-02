# Cert-Manager Setup with Ansible 🚀

![Ansible](https://img.shields.io/badge/Ansible-Playbook-blue?logo=ansible)
![Cert-Manager](https://img.shields.io/badge/Cert--Manager-Installation-yellowgreen)

This repository contains Ansible playbooks to **install**, **configure**, and **uninstall** Cert-Manager on a Kubernetes cluster using Helm. The playbooks also include configuring a Let's Encrypt ClusterIssuer to automate SSL certificate management.

## Purpose 🎯

- **Install Cert-Manager** in a Kubernetes cluster for managing TLS certificates.
- **Configure Let's Encrypt** using ClusterIssuer to obtain certificates automatically.
- **Uninstall Cert-Manager** and clean up associated resources.

## Requirements 📋

- Ansible installed on your system.
- A Kubernetes cluster with Helm and kubectl configured.
- Ensure the `helm` and `kubectl` commands are accessible on the control node.

## Variables 📂

- `version`: The version of Cert-Manager to install (e.g., `v1.15.3`).
- `namespace`: The Kubernetes namespace for Cert-Manager (default: `cert-manager`).
- `email`: Email address for Let's Encrypt configuration (for certificate notifications).

## Playbook Overview 📝

### 1. Install Cert-Manager

This playbook installs Cert-Manager using Helm and applies the necessary CRDs.

- **Playbook File:** `install_certmanager.yml`
- **Tasks:**
  - Apply Cert-Manager CRDs.
  - Add and update the Jetstack Helm repository.
  - Install Cert-Manager using Helm.
  - Wait for Cert-Manager pods to start.
  - Display Cert-Manager resources.
  
#### Usage:

```bash
ansible-playbook -i inventory install_certmanager.yml
```

### 2. Configure Cert-Manager with Let's Encrypt ClusterIssuer

This playbook configures Cert-Manager with Let's Encrypt by creating a ClusterIssuer, allowing the automation of TLS certificates using ACME challenges.

* **Playbook File:** configure_certmanager.yml
* **Tasks:**
    * Create and apply a ClusterIssuer configuration file.
    * Display secrets in the Cert-Manager namespace.

### Usage:

```
ansible-playbook -i inventory configure_certmanager.yml
```
### 3. Uninstall Cert-Manager and Clean Up
This playbook uninstalls Cert-Manager and deletes the associated Kubernetes resources, including CRDs and namespaces.

* **Playbook File:** uninstall_certmanager.yml
* **Tasks:**
    * Uninstall Cert-Manager Helm release.
    * Delete the Cert-Manager namespace.
    * Remove Cert-Manager CRDs.
### Usage:

```
ansible-playbook -i inventory uninstall_certmanager.yml
```
### Inventory Setup ⚙️
Prepare an inventory file to specify the target Kubernetes nodes:

```ini
[all]
kubernetes-node ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
```

### Testing 🧪
1. **Verify Cert-Manager Installation:** After installation, check the Cert-Manager resources in the namespace:
```bash
kubectl get all -n cert-manager
```
2. **Check Let's Encrypt ClusterIssuer:** Ensure the ClusterIssuer is applied correctly:

```bash
kubectl describe clusterissuer letsencrypt-prod
```
3. **Uninstall and Cleanup:** Once done, verify that the Cert-Manager namespace and CRDs are deleted:

```bash
kubectl get namespaces
kubectl get crds | grep cert-manager
```
### Supported Platforms 🖥️
* Kubernetes clusters (compatible with both cloud and on-premises).
* Requires Helm and kubectl access.