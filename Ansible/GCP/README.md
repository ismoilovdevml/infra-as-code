# GCP compute

Creates, starts, stops and deletes GCE instances through the GCP API. Runs on the
control node — there is no target host.

## Supported platforms

Control node only. Requires Python and the GCP client libraries locally; the target
OS is irrelevant.

## Requirements

- Ansible core >= 2.15
- `ansible-galaxy collection install -r requirements.yml` (`google.cloud`)
- `pip install requests google-auth`
- A service account key with the Compute Admin role, or Application Default
  Credentials, or a GCE machine account

## Usage

```bash
ansible-playbook create-vm.yml -e gcp_project=my-real-project
ansible-playbook create-vm.yml -e gcp_state=stopped
ansible-playbook create-vm.yml -e gcp_state=started
ansible-playbook create-vm.yml -e gcp_state=absent -e gcp_delete_disks=true
ansible-playbook create-vm.yml --check --diff
```

## Variables

| Variable | Default | Description |
| --- | --- | --- |
| `gcp_project` | `my-project-id` | Real project ID — the play asserts you changed it |
| `gcp_zone` / `gcp_region` | `us-central1-a` / `us-central1` | Placement |
| `gcp_auth_kind` | `serviceaccount` | `serviceaccount`, `machineaccount` or `application` |
| `gcp_service_account_file` | `~/.gcp/credentials.json` | JSON key path |
| `gcp_instances` | one `e2-medium` | List of instances to manage |
| `gcp_state` | `present` | `present`, `started`, `stopped`, `absent` |
| `gcp_delete_disks` | `false` | Also delete boot disks when removing instances |

## Verify

```bash
gcloud compute instances list --project <project>
gcloud compute disks list --project <project>
```

## Notes

- **This replaces a `gcloud` shell wrapper.** The previous version hardcoded the
  instance name, zone and image, prompted for the action with `vars_prompt` (so it
  could not run unattended), and reported `changed` on every run.
- Boot disks are created as separate resources with `auto_delete: false`. Deleting an
  instance therefore **leaves its disk behind** unless `gcp_delete_disks=true` — that
  is deliberate, since an accidental instance deletion should not destroy data.
- External addresses are **reserved**, not ephemeral, so an instance keeps its IP
  across a stop/start. They are billed while reserved even when unattached, and are
  released only by `gcp_state=absent`.
- The default image is a current Ubuntu LTS family. The previous default,
  `ubuntu-2004-lts`, is past end of standard support.
- Never commit the service account JSON key. Keep it outside the repository and
  reference it with `gcp_service_account_file`.
