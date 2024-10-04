# NFS Server Setup with Ansible 🚀

![Ansible](https://img.shields.io/badge/Ansible-Playbook-blue?logo=ansible)
![NFS](https://img.shields.io/badge/NFS-Server-yellowgreen)

This playbook allows you to set up and configure an NFS server automatically. It supports different Linux distributions such as **RedHat** and **Debian** families. The process includes installing the NFS server, creating a directory, and exporting it to the network.

## Purpose 🎯

- Set up an **NFS (Network File System)** server and enable file sharing over the network.
- Be compatible with both RedHat and Debian-based systems.
- Create an NFS directory, export it, and manage the service.

## Requirements 📋

- Ansible must be installed.
- The `nfs_server` group in your inventory should contain the host(s) that will act as the NFS server.

## Variables 📂

- `nfs_export_path`: The path to the directory you want to share over NFS.
- `nfs_allowed_hosts`: Hosts allowed to access the shared directory.
- `nfs_service_name`: Variable to manage NFS service names for RedHat and Debian families.

## How to Use ⚙️

1. **Prepare an inventory file**, for example:
    ```ini
    [nfs_server]
    nfs.example.com ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
    ```

2. **Run the playbook:**
    ```bash
    ansible-playbook -i inventory.ini nfs_setup.yml
    ```

3. **What the playbook does:**
   - Installs required NFS packages.
   - Creates the export directory and sets the correct permissions.
   - Updates the `/etc/exports` file.
   - Starts the NFS service and exports the directory.

## Testing 🧪

1. Check that the NFS service is running on the server:
    ```bash
    systemctl status nfs-server
    ```

2. Verify that the directory is exported:
    ```bash
    exportfs -v
    ```

3. Mount the NFS share from another machine to test:
    ```bash
    mount nfs.example.com:/srv/nfs /mnt
    ```

## Supported OS Families 🖥️

- **RedHat** family: RHEL, CentOS, Fedora
- **Debian** family: Debian, Ubuntu