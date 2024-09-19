# 📋 PHP Installation Playbook

This Ansible playbook installs a specified version of PHP on multiple servers using the **geerlingguy.php-versions** role.

## 🛠️ Usage

### Install PHP

To install PHP on your servers, follow these steps:

1. Install the required Ansible role:
   ```bash
   ansible-galaxy role install geerlingguy.php-versions
   ansible-galaxy role install geerlingguy.repo-remi
   ansible-galaxy role install geerlingguy.php
   ```
2. Run the playbook to install PHP:
   ```bash
   ansible-playbook -i inventory.ini install_php.yml
   ```
The PHP version can be customized in the playbook by setting the `php_version` variable.

### Example

To install PHP version `8.3`, set the `php_version` variable in the playbook as shown below:


```yml
vars:
  php_version: "8.3"
```

### Playbook Explanation

* **Role used:** [geerlingguy.php-version](https://github.com/geerlingguy/ansible-role-php-versions)
* This role simplifies the installation of different PHP versions on supported operating systems.


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

* [Ansible Galaxy - geerlingguy.php-version Role](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/php-versions/documentation/)
* [GitHub - geerlingguy/ansible-role-php-version](https://github.com/geerlingguy/ansible-role-php-versions)