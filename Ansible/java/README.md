# Java (OpenJDK)

Installs one or more OpenJDK majors (LTS lines 8, 11, 17, 21, 25) either from the
distribution's own packages (default) or from the Eclipse Adoptium (Temurin) repository,
and selects the default `java`/`javac` via `alternatives`.

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | `openjdk-<N>-jdk`, or Temurin APT repo |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+, Amazon Linux 2023 | `java-<N>-openjdk[-devel]`, or Temurin YUM repo |
| Suse | openSUSE Leap 15.x, SLES 15 | `java-<N>-openjdk[-devel]` from the distro's own Update channel |

Anything else fails in preflight with an explicit message. `java_install_method: temurin`
is best-effort on openSUSE/SLES (Adoptium's zypper path is not independently re-verified
per SUSE variant) — the default `distro` method is the well-verified path everywhere.

## Requirements

- Ansible core >= 2.15 (`deb822_repository`)
- `ansible-galaxy collection install -r requirements.yml` (`community.general`, for
  `alternatives`, `zypper`, `zypper_repository`)
- `sudo` on the target

## Usage

```bash
ansible-playbook install_java.yml
ansible-playbook install_java.yml -e '{"java_versions": ["17", "21"], "java_default_version": "21"}'
ansible-playbook install_java.yml -e java_install_method=temurin
ansible-playbook install_java.yml --check --diff
ansible-playbook uninstall_java.yml
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `java_versions` | `["17"]` | JDK majors to install; installing several is supported |
| `java_default_version` | `"17"` | Must be one of `java_versions`; the one `alternatives` points `java`/`javac` at |
| `java_install_method` | `distro` | `distro` (distribution packages) or `temurin` (Adoptium repo) |
| `java_alternatives_priority` | `1700` | Priority passed to `alternatives`/`update-alternatives` |

## Verify

```bash
java -version
update-alternatives --list java    # Debian
alternatives --display java        # RHEL/SUSE
```

## Notes

- Installing multiple JDKs leaves every one of them registered as an `alternatives`
  choice; only `java_default_version` is (re-)pinned by this playbook, so re-running with a
  different `java_default_version` switches the active JDK without reinstalling anything.
- Debian's `openjdk-<N>-jdk` package already bundles the compiler; RHEL/SUSE split
  `java-<N>-openjdk` (JRE) from `java-<N>-openjdk-devel` (adds `javac`) — both are installed.
- JDK 8 and 11 no longer receive updates under Oracle's free/permissive license, but
  Temurin and the distributions' own community OpenJDK builds continue shipping them.
