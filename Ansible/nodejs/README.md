# 📋 Node.js Installation Playbook

This Ansible playbook installs a specified version of Node.js on multiple servers using the **geerlingguy.nodejs** role.

## 🛠️ Usage

### Install Node.js

Follow these steps to install Node.js on your servers:

1. Install the required Ansible role:
   ```bash
   ansible-galaxy role install geerlingguy.nodejs
   ```
2. Run the playbook to install Node.js:
   ```bash
   ansible-playbook -i inventory.ini install_nodejs.yml
   ```
The Node.js version can be customized in the playbook by setting the `nodejs_version` variable.

### Example

To install Node.js version `16.x`, set the `nodejs_version` variable in the playbook as shown below:

```yml
vars:
  java_packages:
    - openjdk-11-jdk
```

### Playbook Explanation

* **Role used:** [geerlingguy.nodejs](https://github.com/geerlingguy/ansible-role-nodejs)
* This role simplifies the Node.js installation process by downloading and installing the required version.


### 💻 Supported Linux Operating Systems
This playbook supports the following Linux distributions:
* 🐧 **Debian:** 10,11
* 🐧 **Ubuntu:** 20.04,22.04
* 🐧 **CentOS:** 7,8

### ⚙️ Supported Ansible Versions
* ✅ ansible-core 2.11.0
* ✅  ansible-core 2.12.5
* ❗️ ansible [core 2.17.3] (compatibility issues)

> Note: Ensure you run the playbook with appropriate privileges (e.g., use become: yes if needed).

### Resources

* [Ansible Galaxy - geerlingguy.nodejs Role](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/nodejs/documentation/)
* [GitHub - geerlingguy/ansible-role-nodejs](https://github.com/geerlingguy/ansible-role-nodejs)