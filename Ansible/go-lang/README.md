# Go

Installs the Go programming language from the official upstream binary tarball
(`go.dev/dl`), verified against the published SHA256 checksum. There is no vendor
package repository for Go itself — this is upstream's own documented install method.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | tarball install, no distro repo used |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, Amazon Linux 2023 | tarball install, no distro repo used |
| Suse | openSUSE Leap 15.x, SLES 15 | tarball install, no distro repo used |

Go's upstream binaries are not distro-specific; the OS matrix above reflects what this
repo asserts in preflight, not an upstream restriction. Anything else fails fast with an
explicit message. Supported architectures: `amd64`, `arm64`, `armv6l` (covers ARMv6/ARMv7).

## Requirements

- Ansible core >= 2.15
- No external collections (`ansible.builtin` only)
- `sudo` on the target

## Usage

```bash
ansible-playbook install_go.yml
ansible-playbook install_go.yml --check --diff   # dry-run
ansible-playbook uninstall_go.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `go_version` | `1.26.5` | Version to install. Update together with `go_checksums` |
| `go_checksums` | see `vars.yml` | SHA256 per arch, from `https://go.dev/dl/?mode=json` |
| `go_install_root` | `/usr/local` | Extraction target; matches upstream's own convention |
| `go_gopath` | `""` | Empty = leave `GOPATH` at the toolchain default (`$HOME/go`) |
| `go_purge_gopath` | `false` | `uninstall_go.yml` only — also delete `~/go` |

## Verify

```bash
/usr/local/go/bin/go version
```

## Notes

- Upstream is explicit that a new release must never be untarred over an existing
  `/usr/local/go` tree — this playbook always removes it first when the installed
  version differs from `go_version`.
- Bumping `go_version` without updating `go_checksums` will fail the download step
  (`get_url` checksum mismatch) by design — never skip the checksum.
- `go_gopath` left empty relies on the Go toolchain's own default (`$HOME/go`); only set
  it if your fleet needs a shared, non-default `GOPATH`.
