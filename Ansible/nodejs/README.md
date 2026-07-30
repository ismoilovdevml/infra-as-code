# Node.js

Two independent, clearly separated install paths:

- **`install_nodejs.yml`** — system-wide install from the official NodeSource repository
  (`nodejs` package, available to every user/service via `$PATH`). Use this for servers.
- **`install_nodejs_nvm.yml`** — per-user install via nvm, into the connecting
  `ansible_user`'s `$HOME/.nvm`. Use this on platforms NodeSource does not package for
  (openSUSE/SLES), or when a single host needs more than one Node.js version per user.

## Supported platforms

| OS family | `install_nodejs.yml` | `install_nodejs_nvm.yml` |
|---|---|---|
| Debian | Debian 10-12, Ubuntu 20.04/22.04/24.04 — NodeSource DEB repo | supported |
| RedHat | RHEL/Rocky/Alma 8-9, Fedora 29+, Amazon Linux 2023 — NodeSource RPM repo | supported |
| Suse | not supported (NodeSource publishes no SUSE packages) — fails fast, points here | supported |

Ubuntu 18.04 and RHEL 7 are explicitly unsupported by NodeSource and are not covered by
`install_nodejs.yml` either. Anything outside the matrix fails in preflight with a clear
message.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, SUSE
  dependency install for the nvm path only)
- `sudo` on the target for `install_nodejs.yml`; a regular non-root `ansible_user` for
  `install_nodejs_nvm.yml` (it deliberately runs without `become`)

## Usage

```bash
# system-wide (Debian/RHEL)
ansible-playbook install_nodejs.yml
ansible-playbook install_nodejs.yml -e nodejs_version=24
ansible-playbook uninstall_nodejs.yml

# per-user via nvm (any supported family, including SUSE)
ansible-playbook install_nodejs_nvm.yml
ansible-playbook install_nodejs_nvm.yml -e nodejs_nvm_version=24
ansible-playbook uninstall_nodejs_nvm.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `nodejs_version` | `"22"` | NodeSource major line for `install_nodejs.yml` (Active LTS: 22 or 24) |
| `nodejs_nvm_version` | `"22"` | Version `nvm install` resolves for `install_nodejs_nvm.yml` |
| `nvm_version` | `v0.40.6` | Pinned nvm release tag — never `master` |
| `nvm_dir` | `{{ ansible_user_dir }}/.nvm` | Per-user nvm install root |

## Verify

```bash
node --version && npm --version   # system-wide
```

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; node --version   # nvm
```

## Notes

- NodeSource's repository layout keys the Node major into the repo path itself
  (`nodistro` is the only suite); switching `nodejs_version` and re-running replaces the
  sources file rather than appending a second, conflicting one.
- nvm's install script is fetched over HTTPS and pinned to an exact tag before being run —
  this is the one place in this repo that runs a downloaded script directly, because nvm
  has no packaged install path and its own README documents nothing else.
- `install_nodejs_nvm.yml` intentionally runs its second play with `become: false`; Node.js
  installed this way is only on that user's `$PATH`, not visible system-wide or to
  `systemd` units.
