```bash
ansible-galaxy role install geerlingguy.certbot
```
[geerlingguy.certbot](https://galaxy.ansible.com/ui/standalone/roles/geerlingguy/certbot)

install certbot

```bash
ansible-playbook -i inventory.ini ./install.yml
```

obtain ssl

```bash
ansible-playbook -i inventory.ini ./obtain_ssl.yml
```