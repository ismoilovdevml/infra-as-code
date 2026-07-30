# Kubernetes Dashboard

Installs the Kubernetes Dashboard via its Helm chart (`kubernetes.core.helm`),
creates an `admin-user` ServiceAccount bound to `cluster-admin` (upstream's own
"sample user" quick-start pattern), and prints a short-lived login token via
`kubectl create token`.

## Status: archived upstream

Verified 2026-07-31 against upstream:

- The GitHub repository moved to `kubernetes-retired/dashboard` and was archived
  (read-only) on **2026-01-21**.
  Source: <https://kubernetes.io/blog/2026/06/01/dashboard-to-headlamp/>
- Upstream recommends migrating to **Headlamp** (<https://headlamp.dev/>), now part
  of Kubernetes SIG UI.
- **The chart repository URL upstream's own README still prints,
  `https://kubernetes.github.io/dashboard/`, is dead (HTTP 404, "Site not found").**
  The chart is still reachable at a different, verified-live URL:
  `https://kubernetes-retired.github.io/dashboard/`, frozen at chart **7.14.0** (the
  final release before archival). This module uses the corrected URL.

`install.yml` refuses to run until `dashboard_accept_unmaintained_software=true`. For
anything new, evaluate Headlamp instead.

## Supported platforms

Cluster-level Helm chart, not an OS package. Runs from `localhost` with a kubeconfig
(see `inventory.ini`) — an admin workstation, a bastion, or a control-plane node used
as the Ansible controller, with `helm` and `kubectl` on PATH and network access to the
API server.

## Requirements

- Ansible core >= 2.15
- Collections: `kubernetes.core` (`ansible-galaxy collection install -r requirements.yml`)
- Python `kubernetes` client library on the controller (`pip install kubernetes`)
- `helm` >= 3.8 and `kubectl` on the controller (see `../helm/`, `../kubectl/`)
- A kubeconfig with cluster-admin (or equivalent) access
- An ingress controller (see `../ingress-nginx/`) and cert-manager (see
  `../certmanager/`) if using `expose_kubernetes_dashboard.yml`

## Usage

```bash
ansible-playbook install.yml -e dashboard_accept_unmaintained_software=true
ansible-playbook expose_kubernetes_dashboard.yml -e dashboard_ingress_host=dashboard.example.com
ansible-playbook install.yml -e dashboard_accept_unmaintained_software=true --check --diff
ansible-playbook uninstall.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubeconfig_path` | `$KUBECONFIG` or `~/.kube/config` | Kubeconfig used for every task |
| `dashboard_accept_unmaintained_software` | `false` | Must be `true` before anything runs |
| `dashboard_chart_repo_url` | `https://kubernetes-retired.github.io/dashboard/` | Corrected repo URL — see Status |
| `dashboard_chart_version` | `7.14.0` | The final release — chart repo is frozen |
| `dashboard_namespace` | `kubernetes-dashboard` | Release namespace |
| `dashboard_admin_service_account` | `admin-user` | Bound to `cluster-admin`; see Notes |
| `dashboard_admin_token_duration` | `1h` | `kubectl create token` `--duration` |
| `dashboard_ingress_host` | `dashboard.example.com` | Placeholder — set to your real hostname |

## Verify

```bash
kubectl get pods -n kubernetes-dashboard
kubectl -n kubernetes-dashboard create token admin-user
```

## Notes

- Binding `admin-user` to the built-in `cluster-admin` ClusterRole grants full
  cluster control through its token. This is upstream's documented quick-start
  pattern, not a production-scoped RBAC recommendation — replace it with a
  narrower Role/RoleBinding before exposing the dashboard beyond a trusted operator.
- The printed token grants cluster-admin for its duration
  (`dashboard_admin_token_duration`, default 1 hour). Anyone who can read this
  playbook run's output can use it until it expires — treat the output like a
  credential.
- The chart deploys **Kong** as a reverse proxy in front of the dashboard component
  (`<release>-kong-proxy` Service); `expose_kubernetes_dashboard.yml` targets that
  Service on port 443.
- No future security fixes will ship for this chart. Running it beyond a short
  evaluation/migration period is a security decision the operator must own explicitly.
