# MetalLB Setup with Ansible 🚀

This repository contains Ansible playbooks to **install**, **configure**, and **uninstall** MetalLB in a Kubernetes cluster using Helm.

## Requirements 📋

- Ansible installed on your control node.
- Helm and kubectl configured on the target machine.
- Kubernetes cluster with access to manage system-level configurations.

## Playbook Overview 📝

### 1. Install MetalLB

This playbook installs MetalLB using Helm and modifies the `kube-proxy` configuration to enable strict ARP mode.

- **Playbook File:** `install_metallb.yml`
- **Tasks:**
  - Enables strict ARP in the `kube-proxy` config.
  - Adds the MetalLB Helm repository.
  - Installs MetalLB in the `metallb-system` namespace.
  - Verifies the installation by checking the MetalLB pods.

#### Usage:

```bash
ansible-playbook -i inventory install_metallb.yml
```

### 2. Configure MetalLB
This playbook configures an IP address pool and L2 advertisement for MetalLB.

* **Playbook File:** `configure_metallb.yml`
* **Tasks:**
    * Creates a MetalLB address pool configuration file.
    * Applies the configuration to the Kubernetes cluster.
### Usage:
```bash
ansible-playbook -i inventory configure_metallb.yml
```
### 3. Uninstall MetalLB
This playbook uninstalls MetalLB and removes the metallb-system namespace.

* **Playbook File:** `uninstall_metallb.yml`
**Tasks:**
    * Uninstalls the MetalLB Helm release.
    * Deletes the metallb-system namespace.
### Usage:

```bash
ansible-playbook -i inventory uninstall_metallb.yml
```
### Inventory Setup ⚙️
Prepare an inventory file to specify the target Kubernetes nodes:

```ini
[all]
target-host ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
```
### Testing 🧪
1. **Verify MetalLB Installation:** After installation, check the MetalLB pods:

```bash
kubectl get pods -n metallb-system
```
2. **Verify Configuration:** After applying the configuration, check the IP address pool:
```bash
kubectl get ipaddresspools -n metallb-system
```
3. **Uninstall and Cleanup:** After uninstallation, ensure the namespace is removed:
```bash
kubectl get namespaces
```
### Supported Platforms 🖥️
* Kubernetes clusters (compatible with both cloud and on-premises).
* Requires Helm and kubectl access.