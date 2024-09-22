# 📋 Node.js Installation Playbook

This Ansible playbook installs a specified version of Node.js on multiple servers using either the geerlingguy.nodejs role or by managing Node.js with nvm.

## 🛠️ Usage

### 🚀 Install Node.js using the geerlingguy.nodejs role

Follow these steps to install Node.js on your servers using the geerlingguy.nodejs role:

1. 📥 Install the required Ansible role:
   ```bash
   ansible-galaxy role install geerlingguy.nodejs
   ```
2. ▶️ Run the playbook to install Node.js:
   ```bash
   ansible-playbook -i inventory.ini install_nodejs.yml
   ```
   > **⚠️ Important:** There may be compatibility issues on **RedHat-based** systems with the geerlingguy.nodejs role, especially for newer Node.js versions. For RedHat-based systems, it's recommended to use the `install_nodejs_nvm.yml` playbook instead (see below).

The Node.js version can be customized in the playbook by setting the `nodejs_version` variable.

## 🟢 Install Node.js using NVM (Recommended)
For systems that encounter issues with the `install_nodejs.yml` playbook (particularly RedHat-based systems like CentOS, Rocky Linux, and RHEL), you can use nvm (Node Version Manager) to install Node.js.

### ▶️ Run the playbook to install Node.js via NVM:
```bash
ansible-playbook -i inventory.ini install_nodejs_nvm.yml
```
This playbook installs the specified Node.js version using **nvm**, ensuring better compatibility and flexibility, particularly for managing multiple Node.js versions.

### 🔧 Example

To install Node.js version `21.x`, set the `nodejs_version` variable in the playbook as shown below:

```yml
vars:
  nodejs_version: "21.x"
```

### Playbook Explanation

* 📦 **Role used:** [geerlingguy.nodejs](https://github.com/geerlingguy/ansible-role-nodejs) for `install_nodejs.yml`.

* 🛠️ **Alternative: nvm** is used in `install_nodejs_nvm.yml` for better compatibility on RedHat-based systems.

* The role and playbooks simplify the Node.js installation process by downloading and installing the required version.

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

### 📚 Resources
* [🌐 Ansible Galaxy - geerlingguy.nodejs Role](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/nodejs/documentation/)
* [🌐 GitHub - geerlingguy/ansible-role-nodejs](https://github.com/geerlingguy/ansible-role-nodejs)
* [🌐 nvm - (Node Version Manager) Github](https://github.com/nvm-sh/nvm)