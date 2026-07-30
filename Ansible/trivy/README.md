# Trivy

Installs [Trivy](https://github.com/aquasecurity/trivy), Aqua Security's vulnerability
scanner, via four independent methods: OS package repo, GitHub release binary, Docker
image, or Helm chart. Pick the one method that matches your environment.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `get.trivy.dev/deb` (deb822), `install_trivy_os.yml` |
| RedHat | RHEL/CentOS/Rocky/AlmaLinux 8+, Fedora 40+ | `get.trivy.dev/rpm`, `install_trivy_os.yml` |
| Any | any Linux, any architecture with a release asset | `install_trivy_binary.yml` (no package repo needed) |
| Any | any Docker host | `install_trivy_docker.yml` |
| Any | any Kubernetes cluster reachable from the control host | `install_trivy_helm.yml` |

`install_trivy_os.yml` fails fast on SUSE/Arch — Aqua publishes no zypper repository
for Trivy. Use `install_trivy_binary.yml` or `install_trivy_docker.yml` there instead.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- `ansible-galaxy collection install -r requirements.yml` (`community.docker` for the
  Docker method, `kubernetes.core` for the Helm method)
- `sudo` on the target (except `install_trivy_helm.yml`, which only needs `kubectl`/
  `helm` configured against the cluster)

## Usage

```bash
ansible-playbook install_trivy_os.yml                              # apt/yum repo
ansible-playbook install_trivy_binary.yml                          # GitHub release
ansible-playbook install_trivy_docker.yml                          # docker image scan
ansible-playbook install_trivy_helm.yml                             # helm chart
ansible-playbook uninstall_trivy.yml                                # package + binary
ansible-playbook uninstall_trivy.yml -e trivy_uninstall_helm=true    # + helm release
ansible-playbook install_trivy_os.yml --check --diff                # dry-run
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `trivy_repo_domain` | `https://get.trivy.dev` | Package repo host; redirects to `aquasecurity.github.io/trivy-repo` |
| `trivy_version` | `0.72.0` | Pin for the binary and Docker methods |
| `trivy_docker_scan_target` | `alpine:3.20` | Example scan target — override for real use |
| `trivy_helm_chart_version` | `""` | Empty = latest chart from the repo index |
| `trivy_helm_namespace` | `trivy-system` | Created automatically (`trivy_helm_create_namespace`) |
| `trivy_strict_platform_check` | `true` | Refuse releases below this repo's baseline |

## Verify

```bash
trivy --version
docker logs trivy_scan            # install_trivy_docker.yml
helm status trivy -n trivy-system # install_trivy_helm.yml
```

## Notes

- **The package repo moved.** Aqua's own `trivy-repo` README now documents
  `get.trivy.dev` as the URL to use; the older `aquasecurity.github.io/trivy-repo` host
  still works (`get.trivy.dev` redirects to it) but is no longer the primary. Both
  playbooks fetch the GPG key live rather than pinning it.
- The APT suite is the literal word `generic`, not the distro codename — Trivy does not
  publish per-codename suites.
- The RPM baseurl has **no `$releasever` segment** (`.../rpm/releases/$basearch/`) —
  verified against the live repo layout.
- `repo_gpgcheck` is intentionally left off for the RPM repo: Trivy does not sign
  `repomd.xml` (`repomd.xml.asc` 404s), so enabling it would break `dnf`/`yum` entirely.
  Package-level `gpgcheck` stays on.
- `install_trivy_binary.yml` verifies every download against the release's published
  `checksums.txt` before extracting.
- `install_trivy_docker.yml` mounts the host's Docker socket into the Trivy container so
  it can scan local images without re-pulling; it fails fast (not silently) if Docker is
  absent, pointing at this repo's `docker` module.
- `install_trivy_helm.yml` targets a control host with `kubectl`/`helm` already
  configured against the cluster, not the cluster's own nodes.
