# kubectl

Installs `kubectl` from the official `pkgs.k8s.io` package repository (default), or as a
standalone binary from `dl.k8s.io` with checksum verification. Runs on any host that
needs the CLI — a control-plane node, an admin box, or a CI runner.

## Supported platforms

| OS family | Versions | Source |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `pkgs.k8s.io` APT repo |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, Amazon Linux 2023 | `pkgs.k8s.io` YUM repo |
| Suse | openSUSE Leap 15.x, SLES 15 | `pkgs.k8s.io` zypper repo |

The old `apt.kubernetes.io` / `packages.cloud.google.com` repositories are retired
upstream — do not use them.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- Collections: `community.general` (`ansible-galaxy collection install -r requirements.yml`) — SUSE only
- `sudo` on the target

## Usage

```bash
ansible-playbook install_kubectl.yml
ansible-playbook install_kubectl.yml -e kubectl_install_method=binary
ansible-playbook install_kubectl.yml --check --diff
ansible-playbook uninstall_kubectl.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `kubectl_minor_version` | `1.36` | `pkgs.k8s.io` repo track. Bump when the repo for an older minor 404s |
| `kubectl_install_method` | `package` | `package` or `binary` |
| `kubectl_package_version` | `""` | Package method pin; empty = repo latest |
| `kubectl_version` | `""` | Binary method pin, e.g. `v1.36.3`; empty = resolves `dl.k8s.io/release/stable.txt` |
| `kubectl_bin_dir` | `/usr/local/bin` | Binary method install path |

## Verify

```bash
kubectl version --client --output=yaml
```

## Notes

- `pkgs.k8s.io` publishes one repository per Kubernetes minor version and only keeps
  the most recent supported minors online; an unbumped `kubectl_minor_version` will
  eventually 404. Bump it, do not pin to a version this repo no longer serves.
- `kubectl_version=""` (binary method) always resolves to the newest patch of the
  newest minor, which can run ahead of the cluster's API server. `kubectl` supports one
  minor of version skew against the server either direction — pin `kubectl_version`
  explicitly if the cluster is not tracking the same minor.
- This playbook only installs the CLI. It does not create or manage `~/.kube/config`.
