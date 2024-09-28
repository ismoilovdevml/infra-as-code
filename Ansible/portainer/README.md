# Portainer Installation 🚀

This repository contains Ansible playbooks for installing and cleaning up Portainer Community Edition (CE) and Business Edition (BE). These playbooks manage Docker containers and images.

## 🛠 Installation Playbooks

### 📥 `install_portainer_ce.yml`
This playbook installs Portainer CE (Community Edition):
- Creates a Docker volume.
- Runs the Portainer container.
- Displays the list of Docker containers.

**Usage:**
```bash
ansible-playbook -i inventory install_portainer_ce.yml
```

### 📥 `install_portainer_ee.yml`
This playbook installs Portainer EE (Interprice Edition):
- Creates a Docker volume.
- Runs the Portainer container.
- Displays the list of Docker containers.

**Usage:**
```bash
ansible-playbook -i inventory install_portainer_ee.yml
```

### 🧹 Cleanup Playbook
🗑️ `clean_portainer.yml`
This playbook cleans up Portainer CE and BE installations:

* Removes the Portainer container (if it exists).
* Removes the Docker volume (if it exists).
* Removes Portainer CE and BE Docker images (if they exist).
**Usage:**

```bash
ansible-playbook -i inventory clean_portainer.yml
```

### 🔍 Notes
* The playbooks check for the existence of containers, volumes, and images before attempting removal.
* Docker images are checked using the **2.21.2** tag for Portainer CE and EE.