# 📋 Certbot and NGINX SSL Automation Playbook

This Ansible playbook automates the installation of Certbot and the NGINX plugin on multiple operating systems. It also obtains SSL certificates from Let's Encrypt for your domain and configures NGINX to use the certificates.
## 🔧 Requirements
Ensure NGINX is installed on the target servers before running this playbook. Certbot requires a valid domain name for generating SSL certificates.

# 🛠️ Usage

## Install Certbot

To install Certbot and the NGINX plugin on your servers, run the following command:
```bash
ansible-playbook -i inventory.ini ./install.yml
```
This playbook will:
* Install Certbot and the NGINX plugin on Debian/Ubuntu systems using `apt`.
* Install Certbot and the NGINX plugin on CentOS/RHEL/Rocky systems using `dnf`.

## Obtain SSL Certificates

After installing Certbot, use the following command to obtain SSL certificates for NGINX and configure them automatically:

```bash
ansible-playbook -i inventory.ini ./obtain_ssl.yml
```
The `obtain_ssl.yml` playbook performs the following actions:

* Obtains an SSL certificate for the specified domain using Certbot.
* Configures NGINX with the SSL certificate.
* Restarts NGINX to apply the new SSL certificate.

## Variables

* `domen`: The domain name for which you want to obtain an SSL certificate. By default, it is set to `nginx.helm.uz`, but you can customize it by changing the variable in `obtain_ssl.yml`.


## Playbook Breakdown

* **install.yml:**
    * Installs Certbot and the Certbot NGINX plugin based on the operating system (Debian/Ubuntu or CentOS/RHEL/Rocky).
* **obtain_ssl.yml:**
    * Uses Certbot to automatically obtain SSL certificates for NGINX.
Configures NGINX with the certificates and restarts the service to apply them.

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

> Note: Ensure you run the playbook with sufficient privileges, such as using become: yes or executing as root.