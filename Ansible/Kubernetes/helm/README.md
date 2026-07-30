# Helm

Installs the Helm CLI from the checksum-verified `get.helm.sh` release tarball
(default, works on every supported OS family), or from the official Debian APT
repository (`packages.buildkite.com`) on Debian family only — upstream publishes no
RPM/zypper repository.

## Helm 3 to Helm 4

Helm v4 reached GA in November 2025 and is the current stable major; this playbook
installs it by default. Helm v3 is in its sunset window: final feature release
**2026-09-09**, security-fix-only after that, EOL **2027-02-10**
(<https://github.com/helm/helm-www/blob/main/blog/2026-06-02-helm3-eol.md>). Upstream
states charts deployable with Helm 3 are deployable by Helm 4. Set `helm_major_version:
3` only if you have tooling not yet validated against v4.

## Supported platforms

| OS family | Versions | Source |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `get.helm.sh` tarball, or `packages.buildkite.com` APT repo |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, Amazon Linux 2023 | `get.helm.sh` tarball only |
| Suse | openSUSE Leap 15.x, SLES 15 | `get.helm.sh` tarball only |

`baltocdn.com`, previously used for Helm's package repos, is retired — do not use it.

## Requirements

- Ansible core >= 2.15
- No external collections
- `sudo` on the target
- Outbound HTTPS to `get.helm.sh` and `api.github.com` (version lookup), or to
  `packages.buildkite.com` (package method)

## Usage

```bash
ansible-playbook install_helm.yml
ansible-playbook install_helm.yml -e helm_major_version=3
ansible-playbook install_helm.yml -e helm_version=v4.2.3
ansible-playbook install_helm.yml -e helm_install_method=package   # Debian family only
ansible-playbook install_helm.yml --check --diff
ansible-playbook uninstall_helm.yml
ansible-playbook uninstall_helm.yml -e helm_purge_data=true
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `helm_major_version` | `4` | `3` or `4`. Selects the release resolved when `helm_version` is empty |
| `helm_version` | `""` | Exact tag pin, e.g. `v4.2.3`; empty = latest release for `helm_major_version` |
| `helm_install_method` | `tarball` | `tarball` (all OS families) or `package` (Debian only) |
| `helm_bin_dir` | `/usr/local/bin` | Tarball method install path |
| `helm_purge_data` | `false` | Uninstall only: also remove `~/.config/helm`, `~/.cache/helm`, `~/.local/share/helm` |

## Verify

```bash
helm version --short
```

## Notes

- The tarball method verifies the download against the upstream `.sha256sum` sidecar
  published alongside every release at `get.helm.sh`.
- The APT method additionally checks the fetched GPG key's fingerprint against the
  value upstream publishes in its own install instructions, refusing to trust a
  swapped or compromised key.
- This playbook only installs the CLI binary. Repository/chart management,
  `helm repo add`, and cluster access (`~/.kube/config`) are out of scope.
