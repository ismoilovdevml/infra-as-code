# Rancher

Installs SUSE Rancher Manager via its Helm chart (`kubernetes.core.helm`), from the
`rancher-stable` channel by default. Rancher's built-in Let's Encrypt integration
(`ingress.tls.source=letsEncrypt`) requires cert-manager to already be installed
(see `../certmanager/`) unless you bring your own certificates.

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
- cert-manager installed (see `../certmanager/`), unless using your own certificates
- A Kubernetes cluster within Rancher's certified range for the pinned version
  (2.14.3 is certified against v1.33-v1.35 — note this is behind `../kubectl/`'s
  current default of 1.36)

## Usage

```bash
ansible-vault edit group_vars/all/vault.yml
# vault_rancher_bootstrap_password: "<strong password, >= 12 chars>"

ansible-playbook install.yml --ask-vault-pass \
  -e rancher_hostname=rancher.example.com \
  -e rancher_letsencrypt_email=you@example.com
ansible-playbook expose_rancher_ui.yml -e rancher_hostname=rancher.example.com
ansible-playbook install.yml --ask-vault-pass --check --diff
ansible-playbook uninstall.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubeconfig_path` | `$KUBECONFIG` or `~/.kube/config` | Kubeconfig used for every task |
| `rancher_channel` | `stable` | `stable` (production), `latest` (testing only), `alpha`, `prime` (subscription) |
| `rancher_version` | `2.14.3` | Chart/app version |
| `rancher_hostname` | `rancher.example.com` | Placeholder — set to your real DNS name |
| `rancher_bootstrap_password` | vault, empty by default | >= 12 chars; asserted non-empty |
| `rancher_letsencrypt_email` | `""` | Required when `rancher_ingress_tls_source=letsEncrypt` |
| `rancher_ingress_tls_source` | `letsEncrypt` | Rancher's built-in ACME integration |

## Verify

```bash
kubectl -n cattle-system get deploy rancher
kubectl -n cattle-system rollout status deploy/rancher
```

## Notes

- Upstream recommends the `stable` channel for production; `latest` is CI-validated
  but explicitly not production-grade. This module defaults to `stable`
  (the pre-existing version of this playbook defaulted to `latest`).
- `rancher-prime` requires `registry.rancher.com` image-pull credentials tied to a
  SUSE subscription; only the repository URL is wired up here, not the registry
  secret.
- Rancher's own docs state it was "last tested with cert-manager version v1.13.1";
  `../certmanager/` defaults to a newer release. The `cert-manager.io/v1` API has
  been stable across that range, but check the Rancher support matrix before
  pairing an unusually new cert-manager with Rancher.
- `uninstall.yml` deletes only CRDs whose group is `*.cattle.io`. The previous
  version of this playbook ran `kubectl delete crd --all --namespace <ns>`, which is
  a no-op for `--namespace` on cluster-scoped CRDs — it deleted **every** CRD in the
  cluster (cert-manager's, MetalLB's, everything), not just Rancher's. Fixed here.
- The Helm install task uses `no_log: true` because `bootstrapPassword` is a secret.
