# HashiCorp Vault

Installs HashiCorp Vault from the official package repository and configures it as a
raft (integrated storage) cluster with a repository-authored `vault.hcl`.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 22.04+ | `apt.releases.hashicorp.com` (deb822) |
| RedHat | RHEL/CentOS/Rocky/AlmaLinux 8+, Fedora 40+, Amazon Linux 2023 | `rpm.releases.hashicorp.com` |

Anything else — SUSE/SLES, openSUSE, Arch — fails fast in preflight. HashiCorp
publishes no zypper repository for Vault (`hashicorp/vault#22890`) and no Arch package.
Ubuntu 20.04 and other releases upstream has dropped are refused unless
`vault_strict_platform_check=false`.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- No external collections (see `requirements.yml`)
- `sudo` on the target
- An odd number of nodes (3+) in `vault_nodes` for a meaningful raft quorum

## Usage

```bash
ansible-playbook install_vault.yml                 # package + repo
ansible-playbook configure_vault.yml               # vault.hcl, service, optional init
ansible-playbook configure_vault.yml -e vault_init_enabled=true   # bootstrap a NEW cluster
ansible-playbook uninstall_vault.yml
ansible-playbook uninstall_vault.yml -e vault_purge_data=true     # also wipe raft data
ansible-playbook install_vault.yml --check --diff  # dry-run
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `vault_version` | `""` | Exact package pin. Empty = repo latest |
| `vault_data_path` | `/opt/vault/data` | Raft storage path |
| `vault_disable_mlock` | `true` | Raft + mlock conflict; upstream recommends disabling mlock for integrated storage |
| `vault_tls_disable` | `true` | Lab default. **Must be `false` in production**, with real cert/key paths |
| `vault_init_enabled` | `false` | Opt-in. Runs `vault operator init` on the first node only |
| `vault_init_key_shares` / `vault_init_key_threshold` | `5` / `3` | Shamir key shares/threshold |
| `vault_init_output_path` | `/root/vault-init.json` | Handoff file, `0600`, root-owned |
| `vault_strict_platform_check` | `true` | Refuse releases dropped upstream |

## Verify

```bash
systemctl status vault
VAULT_ADDR=http://127.0.0.1:8200 vault status
```

## Notes

- **Licence.** Vault CE has been under the Business Source License 1.1 (BUSL) since
  August 2023 (each release converts to MPL 2.0 four years after release). BUSL forbids
  offering Vault as a competing hosted/embedded service. **OpenBao** (openbao.org), a
  Linux Foundation fork under true MPL-2.0 taken from the last MPL release (1.14.0), is
  the open-source alternative if that restriction matters to you. This module installs
  upstream HashiCorp Vault, not OpenBao.
- **Unseal keys and the root token are the keys to everything Vault protects.**
  `configure_vault.yml` captures `vault operator init` output with `no_log: true`, never
  prints it with `debug`, and writes it `0600` to `vault_init_output_path` for the
  operator to collect. **Leaving that file on the Vault host defeats the purpose of
  Shamir sealing** — anyone who can read the sealed raft data on this host can also read
  the keys that unseal it. Copy it to a password manager or secret store off-host
  immediately, then delete it here. For anything beyond a lab, use auto-unseal
  (KMS/Transit) instead of keeping Shamir shares in a file at all.
- Only the **first host** of `vault_nodes` runs `vault operator init`; every other node
  joins the raft cluster via `retry_join`, already computed into `vault.hcl` from the
  other members of the group.
- The systemd unit is the one **shipped by the official package** (already hardened with
  `AmbientCapabilities=CAP_IPC_LOCK`, `NoNewPrivileges=yes`) — this repo does not
  template a competing unit file.
- `vault_tls_disable: true` is a lab default. Set it to `false` and provide
  `vault_tls_cert_file`/`vault_tls_key_file` before exposing a node beyond a trusted
  network; `configure_vault.yml` asserts both are set when TLS is enabled.
- GPG key is always fetched live from `https://apt.releases.hashicorp.com/gpg` /
  `https://rpm.releases.hashicorp.com/gpg` rather than pinned, since HashiCorp extends
  that key's expiry from time to time (HCSEC-2026-03) without changing its fingerprint.
