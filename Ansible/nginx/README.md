# 📋 NGINX Installation and Configuration Playbook

This Ansible playbook automates the installation of NGINX and the configuration of a reverse proxy and e.t.c. The playbook installs NGINX on multiple operating systems, configures directories, and sets up a reverse proxy and e.t.c with domain-based site configurations.

## 🛠️ Usage

## Install NGINX

1. Install the required Ansible role for NGINX:
   ```bash
   ansible-galaxy role install geerlingguy.nginx
   ```
2. Run the playbook to install NGINX:
   ```bash
   ansible-playbook -i inventory.ini install_nginx.yml
   ```
This playbook will:

* Install and configure NGINX on the target servers.
* Set up `sites-available` and `sites-enabled` directories.
* Create a default NGINX site configuration and enable it.

## Configure NGINX as a Reverse Proxy

To configure NGINX as a reverse proxy for your domain, run the following playbook:

```bash
ansible-playbook -i inventory nginx_config.yml
```
This will:

* Create a reverse proxy configuration for the specified domain.
* Apply the reverse proxy configuration by creating symbolic links in sites-enabled.
* Reload NGINX to apply the new configuration.

## Variables
* `domen`: The domain name for which you want to configure the reverse proxy. This can be set in the `nginx_config.yml` playbook. By default, it is set to `nginx.helm.uz`.

## Playbook Breakdown
`install_nginx.yml`
* Installs and configures NGINX.
* Creates sites-available and sites-enabled directories.
* Adds a default site configuration.
* Links the configuration into sites-enabled and reloads NGINX.

`nginx_config.yml`
* Configures NGINX as a reverse proxy for a specified domain.
* Copies the reverse proxy configuration to sites-available.
* Creates symbolic links in sites-enabled to enable the configuration.
* Reloads NGINX to apply the new configuration.

## 💻 Supported Linux Operating Systems
This playbook supports the following Linux distributions:
* 🐧 **Debian:** 11,12
* 🐧 **Ubuntu:** 20.04,22.04
* 🐧 **RHEL:** 7,8
* 🐧 **Rocky Linux:** 8,9

## ✅ Tested Operating Systems
The playbook has been tested on the following OS versions:
* ✅**Debian:** 11,12
* ✅**Ubuntu:** 20.04,22.04
* ✅**RHEL:** 7,8
* ✅**Rocky Linux:** 8,9

## ⚙️ Supported Ansible Versions
* ✅ ansible-core 2.11.0
* ✅  ansible-core 2.12.5
* ❗️ ansible [core 2.17.3] (compatibility issues)

## Playbook Explanation

* **Role used:** [geerlingguy.nginx](https://github.com/geerlingguy/ansible-role-nginx)
* This role simplifies the Go installation by downloading the appropriate Go tarball for your system's platform and architecture.

> Note: Ensure you run the playbook with sufficient privileges, such as using become: yes or executing as root.

## Resources

* [Ansible Galaxy - geerlingguy.nginx Role](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/nginx/documentation/)
* [GitHub - geerlingguy/ansible-role-nginx](https://github.com/geerlingguy/ansible-role-nginx)