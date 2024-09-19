# 📋 Go Installation Playbook

This Ansible playbook installs a specified version of the Go programming language across multiple servers using the official **geerlingguy.go** role.

## 🛠️ Usage

### Install Go

Follow these steps to install Go on your servers:

1. Install the required Ansible role:
   ```bash
   ansible-galaxy role install geerlingguy.go
   ```
2. Run the playbook to install Go:
   ```bash
   ansible-playbook -i inventory.ini install_go.yml
   ```
The Go version can be customized in the playbook by setting the `go_version` variable.

### Example

To install Go version `1.20.4`, set the `go_version` variable in the playbook as shown below:

```yml
vars:
  go_version: "1.20.4"
```

### Playbook Explanation

* **Role used:** [geerlingguy.go](https://github.com/geerlingguy/ansible-role-go)
* This role simplifies the Go installation by downloading the appropriate Go tarball for your system's platform and architecture.

# 💻 Supported Linux Operating Systems
This playbook supports the following Linux distributions:
* 🐧 **Debian:** 10,11
* 🐧 **Ubuntu:** 20.04,22.04
* 🐧 **CentOS:** 7,8

# ⚙️ Supported Ansible Versions
* ✅ ansible-core 2.11.0
* ✅  ansible-core 2.12.5
* ❗️ ansible [core 2.17.3] (compatibility issues)

> Note: Ensure you run the playbook with sufficient privileges, such as using become: yes or executing as root.

### Resources

* [Ansible Galaxy - geerlingguy.go Role](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/go/documentation/)
* [GitHub - geerlingguy/ansible-role-go](https://github.com/geerlingguy/ansible-role-go)