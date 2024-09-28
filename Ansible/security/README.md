# Linux Server Security Playbook 🔐

This Ansible playbook is designed to enhance the security of your Linux servers, whether they're running **Debian/Ubuntu** or **RedHat/CentOS**. It applies essential security practices such as SSH hardening, automatic updates, and intrusion prevention (fail2ban) on both platforms.

## Features ✨

- 🔐 **SSH Hardening**: Configures SSH to disable password authentication, limit root access, and restrict login to specific users or groups.
- 🔄 **Automatic Updates**: Enables automatic updates for both Debian/Ubuntu (via `unattended-upgrades`) and RedHat/CentOS (via `yum-cron`).
- 🚨 **Fail2ban Installation**: Protects against brute-force attacks by installing and configuring `fail2ban`.
- 🔑 **Sudoers Configuration**: Grants sudo permissions to specified users with or without password prompts.
- ⚙️ **Cross-Platform Support**: Works on both Debian/Ubuntu and RedHat/CentOS systems.

## Requirements 📋

- **Ansible** must be installed on the control node.
- On **RedHat/CentOS** systems, the **EPEL repository** must be available for `fail2ban` installation (automatically handled by the playbook).

## Role Variables 🛠️

You can configure the behavior of the playbook using the following variables in your `vars.yml` file:

| Variable                            | Description                                                                 | Default Value         |
|--------------------------------------|-----------------------------------------------------------------------------|-----------------------|
| `security_ssh_port`                  | The port for SSH access                                                     | `22`                  |
| `security_ssh_password_authentication` | Enable/disable SSH password authentication (`yes` or `no`)                  | `"no"`                |
| `security_ssh_permit_root_login`     | Permit root login (`yes` or `no`)                                           | `"no"`                |
| `security_ssh_allowed_users`         | List of allowed SSH users                                                   | `[]` (empty by default) |
| `security_ssh_allowed_groups`        | List of allowed SSH groups                                                  | `[]` (empty by default) |
| `security_autoupdate_enabled`        | Enable/disable automatic updates (`true` or `false`)                        | `true`                |
| `security_autoupdate_reboot`         | Reboot automatically after updates if needed (`true` or `false`)            | `true`                |
| `security_fail2ban_enabled`          | Enable/disable fail2ban installation and configuration (`true` or `false`)  | `true`                |
| `security_sudoers_passworded`        | List of users who require a password for sudo access                        | `[]` (empty by default) |

### Example `vars.yml` Configuration ⚙️

```yaml
---
# SSH security configurations
security_ssh_port: 22
security_ssh_password_authentication: "no"
security_ssh_permit_root_login: "no"
security_ssh_allowed_users:
  - johndoe
  - adminuser
security_ssh_allowed_groups:
  - admin
  - devops

# Sudoers configuration
security_sudoers_passworded:
  - johndoe
  - deployacct

# Automatic updates configuration
security_autoupdate_enabled: true
security_autoupdate_reboot: true
security_autoupdate_mail_to: "admin@example.com"
security_autoupdate_mail_on_error: true

# Fail2ban configuration
security_fail2ban_enabled: true
```

## Usage 🚀

Clone this repository and navigate to the playbook directory.
Customize the vars.yml file to fit your security requirements.
Run the playbook with the following command:

```bash
ansible-playbook -i inventory main.yml
```
Make sure to replace inventory with your actual inventory file path.

## How It Works ⚙️

* The playbook uses **geerlingguy.security** role to handle most of the security configurations.
* It installs necessary packages, configures SSH, and ensures fail2ban is running.
* The playbook supports both **Debian/Ubuntu** and **RedHat/CentOS** by using conditional tasks.