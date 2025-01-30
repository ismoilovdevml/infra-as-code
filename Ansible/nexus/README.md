# Nexus Docker Playbook 🚀

This repository contains two Ansible playbooks for managing a Nexus Repository Docker container:

1. `nexus_docker.yml` - Sets up and starts a Nexus Repository in a Docker container.
2. `cleanup_nexus_docker.yml` - Stops, removes the Nexus container, its Docker image, and cleans up associated data directories.

## Requirements 📋

Ensure the following requirements are met before running the playbooks:

- Ansible 2.9 or higher
- Docker installed on the target servers
- Proper inventory configuration (`nexus_servers` group in your inventory)

```bash
ansible-galaxy collection install community.docker
```

## Playbooks

### `nexus_docker.yml` ⚙️

This playbook performs the following tasks:

1. Creates a Nexus data directory.
2. Runs the Nexus container with the specified image and ports.
3. Waits for the container to start.
4. Retrieves the Nexus admin password from the running container.
5. Displays the Nexus admin password.

#### Usage

```bash
ansible-playbook -i inventory.ini nexus_docker.yml
```


Here’s a README.md for your Nexus playbooks using icons for better readability:

md
Copy code
# Nexus Docker Playbook 🚀

This repository contains two Ansible playbooks for managing a Nexus Repository Docker container:

1. `install-nexus.yml` - Sets up and starts a Nexus Repository in a Docker container.
2. `cleanup_nexus_docker.yml` - Stops, removes the Nexus container, its Docker image, and cleans up associated data directories.

## Requirements 📋

Ensure the following requirements are met before running the playbooks:

- Ansible 2.9 or higher
- Docker installed on the target servers
- Proper inventory configuration (`nexus_servers` group in your inventory)

## Playbooks

### `nexus_docker.yml` ⚙️

This playbook performs the following tasks:

1. Creates a Nexus data directory.
2. Runs the Nexus container with the specified image and ports.
3. Waits for the container to start.
4. Retrieves the Nexus admin password from the running container.
5. Displays the Nexus admin password.

#### Usage

```bash
ansible-playbook -i inventory.ini nexus_docker.yml
```
#### Variables:
|**Variable**|	**Description**|
------------ | --------------- | 
`nexus_image`	|The Nexus Docker image (default: `sonatype/nexus3:latest`)
`nexus_data_dir` |	Directory to store Nexus data (`/mnt/nexus/nexus-data`)
`nexus_container_name` |	Docker container name (default: `nexus`)
`nexus_port` |	Port number for Nexus (default: `8081`)
`nexus_admin_password_file` |	Path to the admin password file inside the container (`/nexus-data/admin.password`)


`cleanup_nexus_docker.yml` 🗑️
This playbook cleans up the Nexus Docker setup:

* Stops the Nexus container if it exists.
* Removes the Nexus container.
* Removes the Nexus Docker image.
* Deletes the Nexus data directory and parent folder.
* 
#### Usage

```bash
ansible-playbook -i inventory.ini cleanup_nexus_docker.yml
```
#### Variables:
| **Variable**	| **Description** |
| ------------- | --------------- |
`nexus_container_name` |	Docker container name (default: `nexus`)
`nexus_image`	| The Nexus Docker image (default: `sonatype/nexus3:latest`)
`nexus_data_dir` |	Directory where Nexus data is stored (`/mnt/nexus/nexus-data`)