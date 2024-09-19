# 📋 Java Installation Playbook

This Ansible playbook installs the Java Development Kit (JDK) on multiple servers using the **geerlingguy.java** role.

## 🛠️ Usage

### Install Java

To install Java on your servers, follow these steps:

1. Install the required Ansible role:
   ```bash
   ansible-galaxy role install geerlingguy.java
   ```
2. Run the playbook to install Go:
   ```bash
   ansible-playbook -i inventory.ini install_java.yml
   ```
The Java version can be customized in the playbook by setting the `java_packages` variable.

### Example

To install OpenJDK 11, set the `java_packages` variable in the playbook as shown below:

```yml
vars:
  java_packages:
    - openjdk-11-jdk
```

### Playbook Explanation

* **Role used:** [geerlingguy.java](https://github.com/geerlingguy/ansible-role-java)
* This role handles the installation of the Java packages on supported operating systems. You can specify different JDK versions by updating the `java_packages` variable.

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

* [Ansible Galaxy - geerlingguy.java Role](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/java/documentation/)
* [GitHub - geerlingguy/ansible-role-java](https://github.com/geerlingguy/ansible-role-java)