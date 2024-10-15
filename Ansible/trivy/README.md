# Trivy Installation Playbooks 😊

This repository contains Ansible playbooks to install and configure [Trivy](https://github.com/aquasecurity/trivy), an open-source vulnerability scanner, using different methods. Choose the installation method that best suits your environment: OS package managers, Docker, Binary, or Helm.

## Installation Methods

### 1. Install Trivy using OS Package Managers 💻
- **Playbook**: `install_trivy_os.yml`
- **Description**: This playbook installs Trivy using the OS package managers (apt for Debian/Ubuntu, yum for RHEL/CentOS) depending on the target system's family.
- **Usage**: 
  ```bash
  ansible-playbook install_trivy_os.yml -i inventory.ini
  ```

**Supported OS:**
* **Ubuntu/Debian 🐧**
* **RHEL/CentOS 🎩**


### 2. Install Trivy using Docker 🐋
- **Playbook**: `install_trivy_docker.yml`
- **Description**: This playbook installs and runs Trivy using Docker containers. It pulls the Trivy Docker image and runs vulnerability scans.
- **Usage**: 
  ```bash
  ansible-playbook install_trivy_docker.yml -i inventory.ini
  ```
- **Requirement:** Docker must be installed on the target server. 🔧

### 3. Install Trivy using Binary 📦
- **Playbook**: `install_trivy_binary.yml`
- **Description**: This playbook downloads and installs Trivy from the official binary release for Linux systems.
- **Usage**: 
  ```bash
  ansible-playbook install_trivy_binary.yml -i inventory.ini
  ```
- **Supported OS:** Linux 🐧

### 4. Install Trivy using Helm 🚢
- **Playbook**: `install_trivy_helm.yml`
- **Description**: This playbook installs Trivy using Helm charts, targeting Kubernetes environments. It adds the AquaSecurity Helm repository, updates it, and installs the Trivy Helm chart.
- **Usage**: 
  ```bash
  ansible-playbook install_trivy_helm.yml -i inventory.ini
  ```
- **Supported OS:** Linux 🐧

- **Requirement:** Helm must be installed and configured properly. 🛠️