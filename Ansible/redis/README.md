# 🚀 Redis Ansible Playbooks

This repository contains two Ansible playbooks for installing and configuring Redis on multiple OS families (Debian/Ubuntu and RedHat/Rocky).

## 📂 Playbooks

1. **redis_install.yml** - Installs Redis on target hosts.
2. **redis_config.yml** - Configures `protected-mode` and `bind` in `redis.conf` without altering other settings.

## 🔧 Playbook 1: Redis Installation

Installs Redis and ensures it is running on both OS families.

### Run:
```bash
ansible-playbook -i inventory redis_install.yml
```

### Key Variables:
* Debian Package: `redis-server`
* RedHat Package: `redis`

### 🔧 Playbook 2: Redis Configuration
Modifies only `protected-mode` and `bind` in `redis.conf` and restarts 
```bash
ansible-playbook -i inventory redis_config.yml
```
### Key Variables:
* `protected-mode: no`
* `bind: 0.0.0.0`