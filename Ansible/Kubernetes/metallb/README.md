# MetalLB

Installs MetalLB via its Helm chart (`kubernetes.core.helm`) and configures a Layer 2
`IPAddressPool` / `L2Advertisement` (`metallb.io/v1beta1` CRDs — the ConfigMap-based
configuration this project used before v0.13 is gone). Also enables `strictARP` on
kube-proxy, required for MetalLB's Layer 2 mode to own ARP replies for service IPs.

This module talks to the cluster over the Kubernetes API, not SSH: every play targets
`localhost` with a kubeconfig (see `inventory.ini`). Run it from an admin workstation,
a bastion, or a control-plane node used as the Ansible controller.

## Requirements

- Ansible core >= 2.15
- Collections: `kubernetes.core` (`ansible-galaxy collection install -r requirements.yml`)
- Python `kubernetes` client library on the controller (`pip install kubernetes`)
- `helm` >= 3.8 on the controller (see `../helm/`)
- A kubeconfig with cluster-admin (or equivalent) access
- A bare-metal or on-prem cluster (cloud LoadBalancer services already have a
  provider-managed implementation and do not need MetalLB)

## Usage

```bash
ansible-playbook install_metallb.yml
ansible-playbook configure_metallb.yml \
  -e metallb_ip_pool_start=10.0.0.200 -e metallb_ip_pool_end=10.0.0.220
ansible-playbook install_metallb.yml --check --diff
ansible-playbook uninstall_metallb.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubeconfig_path` | `$KUBECONFIG` or `~/.kube/config` | Kubeconfig used for every task |
| `metallb_chart_version` | `0.16.1` | Chart version (no `v` prefix) |
| `metallb_namespace` | `metallb-system` | Release namespace |
| `metallb_restart_kube_proxy` | `true` | Restarts the kube-proxy DaemonSet after the strictARP patch |
| `metallb_extra_values` | `{}` | Merged into the Helm values as-is (e.g. to disable the FRR-K8s backend) |
| `metallb_ip_pool_name` | `first-pool` | `IPAddressPool` / `L2Advertisement` name |
| `metallb_ip_pool_start` | `10.0.0.200` | Placeholder — set to a real range routable on your LAN |
| `metallb_ip_pool_end` | `10.0.0.220` | Placeholder — set to a real range routable on your LAN |

## Verify

```bash
kubectl get pods -n metallb-system
kubectl get ipaddresspools,l2advertisements -n metallb-system
kubectl get configmap kube-proxy -n kube-system -o jsonpath='{.data.config\.conf}' | grep strictARP
```

## Notes

- `strictARP` lives inside a YAML string nested in the `kube-proxy` ConfigMap
  (`data['config.conf']`), not a top-level field, so it is patched with a text
  substitution rather than a structured merge — this mirrors upstream's own
  `sed`-based instructions without shelling out.
- Restarting the kube-proxy DaemonSet causes a brief network blip cluster-wide (each
  kube-proxy pod is recreated to pick up the new config). Set
  `metallb_restart_kube_proxy=false` to skip this and restart it yourself on your own
  maintenance window.
- Clusters without a kube-proxy ConfigMap (eBPF dataplanes, kube-proxy replaced) skip
  the strictARP step entirely rather than failing.
- `configure_metallb.yml` requires the MetalLB CRDs to already be Established; run it
  only after `install_metallb.yml` has finished.
- The Helm chart defaults to also deploying the FRR-K8s BGP backend alongside the
  speaker. This module only configures Layer 2 mode; the BGP components sit idle when
  no `BGPPeer`/`BGPAdvertisement` is applied. To drop them for a smaller footprint, set
  `metallb_extra_values: {speaker: {frr: {enabled: false}}, frrk8s: {enabled: false}}`
  (left empty by default, since it changes the chart's own defaults).
