# Portainer

Runs the Portainer server (CE or Business Edition) and the Portainer Agent as
containers. Portainer publishes no OS packages — Docker must already be installed
(see [../docker/](../docker/)).

## Supported platforms

| Requirement | Supported |
| --- | --- |
| Host OS | Any Linux that runs Docker — upstream qualifies the runtime, not the distro |
| Architecture | x86_64, arm64 |
| Docker Engine | 28.5.x / 29.6.x tested with Portainer 2.39.5 LTS |
| Podman | 5.8.x tested |

Docker must be reachable over its **Unix socket** and running as root; rootless
Docker and the Ubuntu snap package are not supported upstream.

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`community.docker`)
- `docker` python SDK on the target: `pip install docker`
- An admin password in Ansible Vault as `vault_portainer_admin_password`

## Usage

```bash
ansible-playbook install_portainer_ce.yml --ask-vault-pass
ansible-playbook install_portainer_ee.yml --ask-vault-pass
ansible-playbook install_portainer_agent.yml
ansible-playbook clean_portainer.yml
ansible-playbook clean_portainer.yml -e portainer_purge_data=true   # also drop the database
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `portainer_tag` | `lts` | Image tag. `lts` = 2.39.5, `sts` = 2.44.0 |
| `portainer_admin_password` | vault | First-run admin password, min 12 chars |
| `portainer_https_port` | `9443` | HTTPS UI port |
| `portainer_bind_address` | `0.0.0.0` | Set to `127.0.0.1` to keep the UI off public interfaces |
| `portainer_publish_edge_tunnel` | `true` | Publish 8000/tcp for Edge agents |
| `portainer_agent_port` | `9001` | Agent listen port |
| `portainer_selinux_privileged` | `false` | Upstream's SELinux workaround — see Notes |

## Verify

```bash
docker ps --filter name=portainer
curl -k https://<host>:9443/api/status
```

Then open `https://<host>:9443`.

## Notes

- **First-run bootstrap.** Since 2.39.4/2.43 an uninitialised instance generates a
  one-time setup token, printed as `setup_token=` in `docker logs portainer`, and the
  admin account must be created within 5 minutes of container start. This playbook
  avoids both by passing `--admin-password-file`, which suppresses the token. That is
  upstream's recommended path for unattended installs.
- Port **9000** (legacy HTTP UI) is deliberately not published. **8000** is only needed
  for Edge agents.
- Docker publishes ports by writing iptables rules that **bypass ufw and firewalld**.
  Set `portainer_bind_address: 127.0.0.1` and front it with a reverse proxy if the UI
  should not be world-reachable.
- **SELinux.** Portainer's documented install assumes SELinux is disabled. On an
  enforcing host upstream's workaround is to run the container privileged
  (`portainer_selinux_privileged: true`). That grants the container full host access —
  prefer a targeted socket policy instead where you can.
- The server and the agent **must run the same version**; both use `portainer_tag`.
- Business Edition needs a license key, entered in the UI after first login.
- The UI serves a self-signed certificate by default, which is why the verify step
  passes `-k` / `validate_certs: false`.
