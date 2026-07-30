# ingress-nginx

Installs the `ingress-nginx` controller via its Helm chart (`kubernetes.core.helm`),
pinned to the final release that upstream will ever publish.

## Status: retired upstream

Verified 2026-07-31 against upstream:

- Best-effort maintenance ended **March 2026**; the `kubernetes/ingress-nginx` GitHub
  repository was archived (read-only) on **2026-03-24**. There will be no more
  releases, bugfixes, or security fixes, ever.
  Source: <https://kubernetes.io/blog/2026/01/29/ingress-nginx-statement/>
- The planned successor, **InGate**, never matured and is also retired
  (<https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/>).
- The chart repo (`https://kubernetes.github.io/ingress-nginx`) still resolves and is
  frozen at its last published release: chart **4.15.1**, app **1.15.1**
  (2026-03-19) — verified live against the repo's own `index.yaml`.
- Upstream recommendation: migrate to **Gateway API**
  (<https://gateway-api.sigs.k8s.io/guides/getting-started/>), or another maintained
  Ingress controller. "None of the available alternatives are direct drop-in
  replacements" — plan for engineering time.

`install_nginx_ingress.yml` refuses to run until
`ingress_nginx_accept_retired_software=true`. For anything new, do not start with
ingress-nginx.

## Supported platforms

Cluster-level Helm chart, not an OS package. Runs from `localhost` with a kubeconfig
(see `inventory.ini`) — an admin workstation, a bastion, or a control-plane node used
as the Ansible controller, with `helm` and network access to the API server.

## Requirements

- Ansible core >= 2.15
- Collections: `kubernetes.core` (`ansible-galaxy collection install -r requirements.yml`)
- Python `kubernetes` client library on the controller (`pip install kubernetes`)
- `helm` >= 3.8 on the controller (see `../helm/`)
- A kubeconfig with cluster-admin (or equivalent) access

## Usage

```bash
ansible-playbook install_nginx_ingress.yml -e ingress_nginx_accept_retired_software=true
ansible-playbook install_nginx_ingress.yml -e ingress_nginx_accept_retired_software=true --check --diff
ansible-playbook uninstall_nginx_ingress.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubeconfig_path` | `$KUBECONFIG` or `~/.kube/config` | Kubeconfig used for every task |
| `ingress_nginx_accept_retired_software` | `false` | Must be `true` before anything runs |
| `ingress_nginx_chart_version` | `4.15.1` | The only version that will ever exist — chart repo is frozen |
| `ingress_nginx_namespace` | `ingress-nginx` | Release namespace |
| `ingress_nginx_metrics_enabled` | `true` | Enables `controller.metrics` and Prometheus scrape pod annotations |
| `ingress_nginx_metrics_port` | `10254` | Metrics port used in the scrape annotation |

## Verify

```bash
kubectl get svc -n ingress-nginx
kubectl get pods -n ingress-nginx
```

## Notes

- No future CVE fixes will ship for this controller. Running it beyond a short
  migration bridge is a security decision the operator must own explicitly.
- The chart's `kubeVersion: '>=1.21.0-0'` constraint is the only compatibility
  guarantee upstream ever published; there is no guarantee of correctness against
  Kubernetes minors released after the March 2026 freeze.
- Prometheus scrape annotations (`prometheus.io/scrape`, `prometheus.io/port`) are
  applied as Helm values, replacing the previous `helm upgrade` shell-out.
