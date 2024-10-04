# Helm Installation with Ansible 🚀

This playbook installs Helm v3 on a target machine using an official installation script.

## Requirements 📋

- Ansible installed on your control node.
- Sudo privileges on the target machine.

## Playbook Overview 📝

This playbook performs the following steps:

1. Downloads the official Helm installation script.
2. Runs the installation script.
3. Verifies the installation by checking the Helm version.

## Usage ⚙️

1. **Prepare your inventory file**:
    ```ini
    [all]
    target-host ansible_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa
    ```

2. **Run the playbook**:
    ```bash
    ansible-playbook -i inventory.ini install_helm.yml
    ```

## Playbook Tasks Overview 🧩

- **Download Helm script**: Fetches the official installation script.
- **Run Helm script**: Installs Helm on the target machine.
- **Verify installation**: Checks the installed Helm version.