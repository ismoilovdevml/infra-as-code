# Ansible

Standalone playbook sets, one directory per component. Each directory is
self-contained: its own `ansible.cfg`, `inventory.ini`, `vars.yml`, `requirements.yml`
and `README.md`. Read the component README before running anything.

Every playbook here follows [STANDARDS.md](STANDARDS.md) and must pass
`ansible-lint --profile production` with zero findings.

## Quick start

```bash
cd <component>
ansible-galaxy collection install -r requirements.yml   # if present
$EDITOR inventory.ini vars.yml
ansible-playbook install.yml --check --diff             # dry run first
ansible-playbook install.yml
```

## Components

### Containers and registries

| Directory | What it does |
| --- | --- |
| [docker/](docker/) | Docker Engine + buildx/compose plugins from the official repo |
| [portainer/](portainer/) | Portainer CE / Business Edition server and agent |
| [dozzle/](dozzle/) | Real-time Docker log viewer, server + agents |
| [harbor/](harbor/) | Harbor container registry from the official installer |
| [nexus/](nexus/) | Sonatype Nexus Repository Community Edition |
| [trivy/](trivy/) | Trivy vulnerability scanner (package, binary, Docker, Helm) |

### Databases and caches

| Directory | What it does |
| --- | --- |
| [postgresql/](postgresql/) | PostgreSQL from the PGDG repositories |
| [percona/postgresql/](percona/postgresql/) | Percona Distribution for PostgreSQL |
| [mysql/](mysql/) | MySQL Community Server from Oracle's repositories |
| [mongodb/](mongodb/) | MongoDB Community Edition |
| [cassandra/](cassandra/) | Apache Cassandra |
| [redis/](redis/) | Redis Open Source from `packages.redis.io` |
| [keydb/](keydb/) | KeyDB — **unmaintained upstream**, see its README |

### Messaging and streaming

| Directory | What it does |
| --- | --- |
| [kafka/](kafka/) | Apache Kafka in **KRaft mode** (no ZooKeeper) |
| [zookeeper/](zookeeper/) | Apache ZooKeeper standalone or quorum |
| [rabbitmq/](rabbitmq/) | RabbitMQ + matching Erlang from the official repos |
| [activemq-artemis/](activemq-artemis/) | ActiveMQ Artemis broker, single and clustered |

### Search, monitoring and observability

| Directory | What it does |
| --- | --- |
| [elasticsearch/](elasticsearch/) | Elasticsearch 9.x |
| [kibana/](kibana/) | Kibana with enrollment against an Elasticsearch node |
| [grafana-stack/](grafana-stack/) | Grafana, Loki, Promtail, Prometheus and exporters |
| [zabbix/](zabbix/) | Zabbix 7.0 LTS server, agent2 and API-driven host/template management |
| [percona-pmm/](percona-pmm/) | Percona Monitoring and Management 3.x server and client |
| [wazuh-ansible/](wazuh-ansible/) | Wazuh manager and agents from the official repo |

### Web, proxying and networking

| Directory | What it does |
| --- | --- |
| [nginx/](nginx/) | NGINX from nginx.org, with templated server blocks |
| [haproxy/](haproxy/) | HAProxy at a chosen branch, with config validation |
| [keepalived/](keepalived/) | VRRP virtual IPs, unicast by default |
| [certbot/](certbot/) | Let's Encrypt certificates and automatic renewal |
| [proxy/](proxy/) | System-wide HTTP proxy for shell, package managers, Docker and CLI tools |
| [nfs/](nfs/) | NFSv4 server exports and client mounts |
| [minio/](minio/) | MinIO object storage — **archived upstream**, see its README |

### Runtimes

| Directory | What it does |
| --- | --- |
| [java/](java/) | OpenJDK 8/11/17/21/25, distribution packages or Temurin |
| [go-lang/](go-lang/) | Go from the official tarball, checksum verified |
| [nodejs/](nodejs/) | Node.js system-wide (NodeSource) or per-user (nvm) |
| [php/](php/) | PHP-FPM from deb.sury.org or Remi |

### CI/CD and automation

| Directory | What it does |
| --- | --- |
| [jenkins/](jenkins/) | Jenkins LTS from `pkg.jenkins.io` |
| [sonarqube/](sonarqube/) | SonarQube + PostgreSQL as a Compose stack |
| [semaphore-ui/](semaphore-ui/) | Semaphore UI, package / binary / Docker |

### Kubernetes

| Directory | What it does |
| --- | --- |
| [Kubernetes/kubectl/](Kubernetes/kubectl/) | kubectl from `pkgs.k8s.io` |
| [Kubernetes/helm/](Kubernetes/helm/) | Helm 3 |
| [Kubernetes/certmanager/](Kubernetes/certmanager/) | cert-manager + Let's Encrypt ClusterIssuer |
| [Kubernetes/ingress-nginx/](Kubernetes/ingress-nginx/) | ingress-nginx controller |
| [Kubernetes/metallb/](Kubernetes/metallb/) | MetalLB with IPAddressPool/L2Advertisement |
| [Kubernetes/kubernetes-dashboard/](Kubernetes/kubernetes-dashboard/) | Kubernetes Dashboard |
| [Kubernetes/rancher-dashboard/](Kubernetes/rancher-dashboard/) | Rancher server |
| [Kubernetes/kubesphere-dashboard/](Kubernetes/kubesphere-dashboard/) | KubeSphere |

### Host baseline

| Directory | What it does |
| --- | --- |
| [security/](security/) | SSH hardening, fail2ban, automatic updates, auditd, sysctl |
| [firewall/](firewall/) | Portable rule list across ufw and firewalld |
| [update-upgrade/](update-upgrade/) | Unattended upgrade with reboot detection |
| [hashicorp-vault/](hashicorp-vault/) | Vault with raft integrated storage |
| [GCP/](GCP/) | GCE instance lifecycle through the GCP API |

## Secrets

No playbook here ships a working credential. Passwords, tokens and encryption keys
are vault-backed variables that the plays `assert` on before doing anything:

```bash
ansible-vault create group_vars/all/vault.yml
ansible-playbook install.yml --ask-vault-pass
```

Inventories contain RFC1918 placeholder addresses only.

## Verifying a change

```bash
ansible-lint --profile production .            # must be clean
yamllint -c .yamllint .
cd <component> && ansible-playbook --syntax-check -i localhost, *.yml
```

CI runs the same three gates on every push — see
[../.github/workflows/ansible-lint.yml](../.github/workflows/ansible-lint.yml).
