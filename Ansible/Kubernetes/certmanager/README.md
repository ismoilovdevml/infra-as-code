# cert-manager

Installs cert-manager on a Kubernetes cluster via the official Jetstack Helm chart
(`kubernetes.core.helm`), with CRDs installed and lifecycle-managed by the chart
itself (`crds.enabled=true` — the current upstream method, replacing the older
"apply CRDs manually, then `helm install`" flow). A separate playbook configures a
Let's Encrypt `ClusterIssuer`.

This module talks to the cluster over the Kubernetes API, not SSH: every play targets
`localhost` with a kubeconfig (see `inventory.ini`). Run it from an admin workstation,
a bastion, or a control-plane node used as the Ansible controller — any host with a
working kubeconfig, `helm`, and network access to the API server.

## Requirements

- Ansible core >= 2.15
- Collections: `kubernetes.core` (`ansible-galaxy collection install -r requirements.yml`)
- Python `kubernetes` client library on the controller (`pip install kubernetes`)
- `helm` >= 3.8 on the controller (see `../helm/`)
- A kubeconfig with cluster-admin (or equivalent) access

## Usage

```bash
ansible-playbook install_certmanager.yml
ansible-playbook configure_certmanager.yml -e certmanager_acme_email=you@example.com
ansible-playbook install_certmanager.yml --check --diff
ansible-playbook uninstall_certmanager.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubeconfig_path` | `$KUBECONFIG` or `~/.kube/config` | Kubeconfig used for every task |
| `certmanager_version` | `v1.21.1` | Chart version; matches the app version upstream |
| `certmanager_namespace` | `cert-manager` | Release namespace |
| `certmanager_crds_enabled` | `true` | Installs/manages CRDs via the chart |
| `certmanager_acme_email` | `""` | Required by `configure_certmanager.yml`; asserted non-empty |
| `certmanager_acme_server` | production ACME v2 directory | Switch to the staging directory while testing |
| `certmanager_cluster_issuer_name` | `letsencrypt-prod` | `ClusterIssuer` name |
| `certmanager_ingress_class` | `nginx` | Must match the cluster's ingress controller (see `../ingress-nginx/`) |

## Verify

```bash
kubectl get pods -n cert-manager
kubectl describe clusterissuer letsencrypt-prod
kubectl get certificate -A
```

## Notes

- `crds.enabled=true` must be passed on every install/upgrade, not just the first one,
  or Helm stops managing CRD lifecycle consistently.
- The cert-manager chart annotates its CRDs to survive `helm uninstall` (data-loss
  protection for existing `Certificate` resources). `uninstall_certmanager.yml` does
  not delete CRDs; remove them manually (`kubectl delete crd -l app=cert-manager`)
  only once nothing depends on them.
- The HTTP-01 solver requires a running ingress controller with a matching
  `IngressClass` before certificates can be issued.
- Use the staging ACME server first (`certmanager_acme_server`) — Let's Encrypt's
  production rate limits are easy to hit while testing.
