# Kubectl Installation with Ansible 🚀

This playbook automates the installation of `kubectl` for either x86_64 or arm64 architecture on a target machine.

## Requirements 📋

- Ansible installed on your control node.
- Sudo privileges on the target machine.

## Playbook Overview 📝

This playbook performs the following actions:

1. Downloads the latest stable `kubectl` binary for the appropriate architecture.
2. Verifies the SHA256 checksum of the downloaded binary.
3. Installs `kubectl` and verifies the installation.

## Usage ⚙️

1. **Prepare your inventory file**:
    ```ini
    [all]
    target-host ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
    ```

2. **Run the playbook**:
    ```bash
    ansible-playbook -i inventory.ini install_kubectl.yml
    ```

## Playbook Tasks Overview 🧩

- **Download kubectl**: Fetches the latest stable release for the target architecture.
- **Verify checksum**: Ensures the integrity of the downloaded binary.
- **Install kubectl**: Installs `kubectl` in `/usr/local/bin`.
- **Check version**: Verifies the installed `kubectl` version.