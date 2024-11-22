# Percona PMM Ansible Playbooks 📊

This repository contains a set of Ansible playbooks to automate the setup, configuration, and cleanup of Percona Monitoring and Management (PMM) server, clients, and PostgreSQL monitoring integration.

## Playbooks Overview 📋

1. **`pmm_server.yml`** - Deploy and configure the PMM Server using Docker.
2. **`pmm_client_with_package.yml`** - Install the PMM client using package managers.
3. **`pmm_client_with_docker.yml`** - Configure the PMM client using Docker.
4. **`pmm_postgresql.yml`** - Configure PostgreSQL for monitoring with PMM.
5. **`cleanup_server.yml`** - Clean up PMM Server Docker setup.
6. **`cleanup_client_package.yml`** - Remove the PMM client installed using package managers.
7. **`cleanup_client_docker.yml`** - Remove the PMM client Docker setup.

---

## Requirements 📦

- **Ansible Version:** 2.9 or higher
- **Supported Operating Systems:** Debian-based (e.g., Ubuntu) and RedHat-based (e.g., CentOS)
- **Dependencies:**
  - Docker installed on target servers for `pmm_server.yml` and `pmm_client_with_docker.yml`.
  - Package managers (APT/YUM) for `pmm_client_with_package.yml`.
  - PostgreSQL installed for `pmm_postgresql.yml`.

---

## Inventory Configuration 🗂️

Ensure the `inventory.ini` file is properly configured with the following groups:

- `pmm_servers` - Hosts where the PMM server will be installed.
- `pmm_clients` - Hosts where the PMM client will be installed.
- `postgresql_servers` - Hosts where PostgreSQL monitoring will be configured.

Example:

```ini
[pmm_servers]
server1 ansible_host=192.168.1.100

[pmm_clients]
client1 ansible_host=192.168.1.101
client2 ansible_host=192.168.1.102

[postgresql_servers]
postgresql1 ansible_host=192.168.1.103
```
## Playbooks and Usage Instructions 🚀
### 1. PMM Server Deployment (`pmm_server.yml`) 🖥️

This playbook sets up the PMM Server using Docker.

**Steps:**

1. Ensures Docker is installed.
2. Pulls the PMM Server Docker image.
3. Runs the PMM Server container.
4. Sets up the admin password.
5. Verifies that the PMM Server is running.

**Run:**
```bash
ansible-playbook -i inventory.ini pmm_server.yml
```

### 2. PMM Client Installation (`pmm_client_with_package.yml`) 📡

This playbook installs the PMM client using system package managers (APT or YUM).

**Steps:**

1. Adds the Percona repository.
2. Installs the PMM client package.
3. Configures the client to connect to the PMM Server.

**Run:**
```bash
ansible-playbook -i inventory.ini pmm_client_with_package.yml
```

### 3. PMM Client with Docker (`pmm_client_with_docker.yml`) 🐋

This playbook sets up the PMM client using Docker.

**Steps:**

1. Checks for Docker installation.
2. Pulls the PMM Client Docker image.
3. Runs the PMM client container and configures it to connect to the PMM Server.

**Run:**

```bash
ansible-playbook -i inventory.ini pmm_client_with_docker.yml
```

### 4. PostgreSQL Configuration (`pmm_postgresql.yml`) 🛢️

This playbook configures PostgreSQL monitoring for PMM.

**Steps:**

1. Adds the Percona PostgreSQL repository.
2. Installs the pg_stat_monitor extension.
3. Configures the pg_hba.conf and postgresql.conf files.
4. Registers PostgreSQL with the PMM Server.

**Run:**
```bash
ansible-playbook -i inventory.ini pmm_postgresql.yml
```

### 5. Cleanup Playbooks 🧹
**a. Cleanup PMM Server (`cleanup_server.yml`)**

Removes the PMM Server Docker setup, including:

1. Stopping and removing the container.
2. Deleting the Docker image.
3. Removing the data directory.

**Run:**
```bash
ansible-playbook -i inventory.ini cleanup_server.yml
```

**b. Cleanup PMM Client Installed via Package (`cleanup_client_package.yml`)**

Removes the PMM client installed via package managers.

**Run:**
```bash
ansible-playbook -i inventory.ini cleanup_client_package.yml
```
**c. Cleanup PMM Client Docker Setup (`cleanup_client_docker.yml`)**

Removes the PMM client Docker setup, including:

1. Stopping and removing the container.
2. Deleting the Docker image.
3. Cleaning up the data directory.

**Run:**
```bash
ansible-playbook -i inventory.ini cleanup_client_docker.yml
```
### Variables 📖

All variables are defined in `vars.yml`. Customize these variables as per your environment.

| Variable	| Description |
| --------- | ----------- |
| `pmm_image`	| PMM Server Docker image (default: `percona/pmm-server:2`). |
| `pmm_data_dir` |	Directory to store PMM Server data. |
| `pmm_container_name`	| Name of the PMM Server Docker container. |
| `pmm_server_address`	| PMM Server address (e.g., `34.56.26.160:443`). |
| `admin_password` |	Admin password for PMM Server. |
| `postgresql_version` |	PostgreSQL version to configure (default: `16`). |
| `pg_extensions` |	Extensions to install (e.g., `pg_stat_monitor,pg_stat_statements`). |
