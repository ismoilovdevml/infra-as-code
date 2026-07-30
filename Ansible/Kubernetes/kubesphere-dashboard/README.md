# KubeSphere

Intended to install KubeSphere onto an existing Kubernetes cluster via Helm
(`kubernetes.core.helm`). See **Status** below before using this module.

## Status: no working install path confirmed

Verified 2026-07-31, checking actual bytes and repository contents, not just page
text:

1. `kubesphere/ks-installer` (used by the previous version of this playbook, pinned
   to `v3.3.2`) **no longer exists as a GitHub repository** —
   `curl https://api.github.com/repos/kubesphere/ks-installer` returns
   `{"message":"Not Found"}`.
2. KubeSphere v4's own GA announcement quotes:
   `helm upgrade --install -n kubesphere-system --create-namespace ks-core
   https://charts.kubesphere.io/main/ks-core-1.1.2.tgz --debug --wait`
   (<https://www.kubesphere.io/news/kubesphere-v4-ga-announcement/>). **That URL does
   not serve a chart**: `curl -I` returns HTTP 200, but `content-type: text/html`,
   and the body is the site's SPA shell, not a tarball — true for every version
   tried (1.1.0-1.1.4). `https://charts.kubesphere.io/main/index.yaml` and the
   `/test` channel are both live and valid, and **neither lists a `ks-core` chart**.
3. No `ks-core` or `ks-installer` repository exists under the `kubesphere` GitHub
   org (checked the full org listing).
4. KubeKey (`kk`), KubeSphere's own installer, is itself fine, but its README
   explicitly defers to `ks-installer` for adding KubeSphere to an *existing*
   cluster — this module's use case — and per (1), that no longer exists. KubeKey's
   primary purpose is bootstrapping brand-new clusters, not this.
5. The only "ks-core" chart discoverable via Artifact Hub belongs to an unrelated
   third party (`apecloud/helm-charts`), not an official KubeSphere channel — not
   used here.

The main `kubesphere/kubesphere` project itself is active; only the
install-artifact distribution above is broken or unverifiable as of this check.

**`install.yml` refuses to run** until you set `kubesphere_chart_url` to a chart
reference you have personally re-verified against current upstream sources — check
`content-type` and actual bytes, not just HTTP status, since the CDN returns a
misleading 200 for missing paths. `uninstall.yml` remains fully functional: it cleans
up a prior KubeSphere install (Helm release or legacy v3.x namespaces) regardless of
how it was installed.

## Requirements

- Ansible core >= 2.15
- Collections: `kubernetes.core` (`ansible-galaxy collection install -r requirements.yml`)
- Python `kubernetes` client library on the controller (`pip install kubernetes`)
- `helm` on the controller (see `../helm/`)
- A kubeconfig with cluster-admin (or equivalent) access

## Usage

```bash
# Only after you have personally re-verified a working chart reference upstream:
ansible-playbook install.yml -e kubesphere_chart_url=<your-verified-chart-ref> \
                             -e kubesphere_chart_version=<version>

ansible-playbook expose_kubesphere.yml -e kubesphere_ingress_host=kubesphere.example.com
ansible-playbook uninstall.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubeconfig_path` | `$KUBECONFIG` or `~/.kube/config` | Kubeconfig used for every task |
| `kubesphere_chart_url` | `""` | Must be set explicitly; `install.yml` fails otherwise |
| `kubesphere_chart_version` | `""` | Optional, chart-dependent |
| `kubesphere_namespace` | `kubesphere-system` | Release namespace |
| `kubesphere_service_name` | `ks-console` | v3.x console Service name; re-verify for v4 |

## Verify

```bash
kubectl get pods -n kubesphere-system
```

## Notes

- Do not copy the `charts.kubesphere.io/main/ks-core-*.tgz` URL from KubeSphere's own
  announcement without checking it first — it currently returns a misleading HTTP 200
  for an HTML error page rather than a real chart.
- `expose_kubesphere.yml`'s Service name/port reflect KubeSphere v3.x; re-verify
  against whatever chart you end up installing.
- `uninstall.yml` deletes whole namespaces (which cascades to every resource inside
  them) instead of deleting Pods/PVCs/StatefulSets individually first, as the
  pre-existing version of this playbook did.
