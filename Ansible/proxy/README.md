## Proxy Configuration Playbook 🔧
This Ansible playbook automates proxy setup for multiple tools across Linux distributions. Configure proxies with ease for Git, Curl, Wget, Zypper, Python's pip, NodeJS's npm, APT, Yum, and DNF! 🚀

### Supported Tools 🛠️

| Tool	| Supported OS |
| ----- | ------------ |
|Git	|All Linux distros |
|Curl	|All Linux distros |
|Wget	|All Linux distros |
|Zypper	|SUSE-based distros	|
|Python pip	|All Linux distros	|
|NodeJS npm	|All Linux distros	|
|APT	|Debian-based distros	|
|Yum	|RedHat/CentOS	|
|DNF	|RedHat/Fedora	|


### Variables 🎛️
Configure your proxy settings by adjusting these variables in the playbook:

```yml
http_proxy: "http://proxy.example.com:3128"
https_proxy: "http://proxy.example.com:3129"
no_proxy: "localhost,127.0.0.1,docker-registry.example.com,.corp"
```
Enable or disable proxy configuration for specific tools by setting the following variables to `true` or `false`:

```yml
configure_git: true        # Git proxy
configure_curl: true       # Curl proxy
configure_wget: true       # Wget proxy
configure_zypper: true     # Zypper proxy
configure_pip: true        # Pip proxy
configure_npm: true        # NPM proxy
configure_apt: true        # APT proxy
configure_yum: true        # Yum proxy
configure_dnf: true        # DNF proxy
```

### Running the Playbook 🏃‍♂️
1. Clone this repository to your local machine. 📂
2. Customize the variables in the playbook to match your proxy settings. 🛠️
3. Run the playbook on your hosts with the following command: 🖥️

```bash
ansible-playbook -i inventory.ini proxy.yml
```