# Ansible Standards

Bu repodagi **har bir** playbook shu qoidalarga bo'ysunadi. Agent yoki odam — farqi yo'q,
kod shu hujjatga mos bo'lmasa, u merge qilinmaydi.

---

## 1. Qo'llab-quvvatlanadigan OS matritsasi

Har bir modul quyidagilarda ishlashi shart (upstream qo'llab-quvvatlagan darajada):

| Oila | Distributivlar |
|---|---|
| `Debian` | Debian 11/12/13, Ubuntu 20.04/22.04/24.04 |
| `RedHat` | RHEL 8/9/10, Rocky 8/9, AlmaLinux 8/9, CentOS Stream 9/10, Fedora 40+, Amazon Linux 2023 |
| `Suse` | openSUSE Leap 15.x, SLES 15 |
| `Archlinux` | Arch / Manjaro (faqat upstream paket bo'lsa) |

Qoidalar:

- OS oilasi bo'yicha ajratishda **`ansible_os_family`** ishlatiladi, `ansible_distribution` emas
  (aks holda Rocky/Alma/Amazon tushib qoladi).
- Versiyaga bog'liq shart kerak bo'lsa `ansible_distribution_major_version | int` ishlatiladi.
- Arxitektura kerak bo'lsa `ansible_architecture` → `amd64/arm64` map qilinadi. **Hech qachon**
  `x86_64` hardcode qilinmaydi.
- Upstream OSni qo'llamasa — jim o'tib ketilmaydi, **aniq xato** beriladi:

  ```yaml
  - name: Fail fast on unsupported platform
    ansible.builtin.fail:
      msg: >-
        {{ ansible_distribution }} {{ ansible_distribution_version }} is not supported by
        <component>. Supported: Debian/Ubuntu, RHEL/Rocky/Alma, openSUSE.
    when: ansible_os_family not in ['Debian', 'RedHat', 'Suse']
  ```

---

## 2. Fayl tuzilishi (har bir modul papkasi)

```
<module>/
  README.md          # majburiy — 3-bo'limga qarang
  ansible.cfg        # majburiy
  inventory.ini      # namunaviy, faqat placeholder host'lar
  vars.yml           # barcha sozlanadigan qiymatlar (defaults)
  install.yml        # asosiy o'rnatish playbook'i
  configure.yml      # (ixtiyoriy) konfiguratsiya
  uninstall.yml      # (ixtiyoriy, lekin tavsiya etiladi) toza o'chirish
  templates/*.j2     # barcha konfiglar template orqali
```

Standart `ansible.cfg`:

```ini
[defaults]
inventory = inventory.ini
host_key_checking = False
callbacks_enabled = profile_tasks
stdout_callback = default
callback_result_format = yaml
interpreter_python = auto_silent
deprecation_warnings = True
retry_files_enabled = False

[ssh_connection]
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o ServerAliveInterval=30
```

`inventory.ini` — **hech qachon real IP yoki parol bo'lmaydi**:

```ini
[<group>]
node1 ansible_host=10.0.0.11
node2 ansible_host=10.0.0.12

[<group>:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

---

## 3. README formati (qisqa, senior darajada)

Maksimum ~60 qator. Emoji yo'q. Marketing matn yo'q. Shablon:

```markdown
# <Component>

<Bir jumla: nima o'rnatiladi va qaysi usulda (paket repo / binary / docker).>

## Supported platforms

| OS family | Versions | Notes |
|---|---|---|
| Debian | Debian 11+, Ubuntu 20.04+ | official APT repo |
| RedHat | RHEL/Rocky/Alma 8+, Fedora 40+ | official YUM repo |

## Requirements

- Ansible core >= 2.15
- Collections: `community.general` (`ansible-galaxy collection install -r requirements.yml`)
- Target'da `sudo` huquqi

## Usage

```bash
ansible-playbook install.yml                 # o'rnatish
ansible-playbook configure.yml               # sozlash
ansible-playbook uninstall.yml               # o'chirish
ansible-playbook install.yml --check --diff  # dry-run
```

## Variables

| Variable | Default | Description |
|---|---|---|
| `x_version` | `1.2.3` | O'rnatiladigan versiya |

## Verify

```bash
systemctl status <svc>
<cli> --version
```

## Notes

- Prod uchun majburiy o'zgartiriladigan narsalar (parol, bind address, TLS).
```

---

## 4. Task yozish qoidalari

**Majburiy:**

1. **FQCN** — barcha modullar to'liq nom bilan: `ansible.builtin.apt`, `community.general.zypper`.
2. **Booleanlar** — `true`/`false`, hech qachon `yes`/`no`.
3. **Har bir play va task'da `name:`** — imperativ va aniq.
4. **Idempotentlik** — ikkinchi run `changed=0` bo'lishi kerak.
5. **`shell`/`command` — oxirgi chora.** Har biri uchun:
   - `changed_when:` aniq belgilanadi (aks holda `false`),
   - `creates:`/`removes:` yoki oldindan tekshiruv bilan himoyalanadi,
   - nima uchun modul ishlatilmagani izohda yoziladi.
6. **Repo qo'shish** — `shell` + `echo >> sources.list` **taqiqlanadi**. Faqat:
   - Debian: `ansible.builtin.get_url` (GPG key → `/etc/apt/keyrings/*.asc`) +
     `ansible.builtin.deb822_repository` (yoki `apt_repository`),
   - RedHat: `ansible.builtin.yum_repository`,
   - Suse: `community.general.zypper_repository`.
7. **Servis** — `ansible.builtin.systemd_service` (`enabled: true`, `daemon_reload` kerak bo'lsa).
   Servis nomi OS bo'yicha farq qilsa, `vars.yml` da map qilinadi.
8. **Handlers** — konfig o'zgarsa `notify: Restart <svc>`, restart task ichida emas.
9. **Fayl huquqlari** — `mode:` doim qo'shtirnoq ichida oktal string (`'0644'`).
   `0777`/`0666` **taqiqlanadi**.
10. **`become: true`** play darajasida, task darajasida takrorlanmaydi.
11. **Loop** — `loop:`, `with_items:` emas.
12. **`check_mode`** — playbook `--check` bilan yiqilmasligi kerak; `command` task'larga
    `check_mode: false` + `changed_when: false` qo'yiladi (faqat o'qish bo'lsa).
13. **Paket keshi** — Debian: `update_cache: true` + `cache_valid_time: 3600`.
14. **Downloadlar** — `get_url` + `checksum:` (imkoni bo'lsa) + `mode`. `curl | bash` taqiqlanadi.
15. **Xavfsizlik** — parol/token hech qachon default emas. `vars.yml` da:
    ```yaml
    x_admin_password: "{{ vault_x_admin_password | default('') }}"
    ```
    va bo'sh bo'lsa `assert` bilan to'xtatiladi. Real sirlar repoda saqlanmaydi.
16. **Tags** — har bir mantiqiy blokda barqaror teg: `install`, `configure`, `service`, `verify`.
17. **`ignore_errors: true` taqiqlanadi** — o'rniga `failed_when:` yoki `rescue:`.
18. **Verifikatsiya** — har bir `install.yml` oxirida servis/port/versiya tekshiruvi bo'ladi
    (`ansible.builtin.wait_for` yoki `command` + `changed_when: false`).

**Preflight bloki** — har bir `install.yml` boshida:

```yaml
- name: Assert supported platform
  ansible.builtin.assert:
    that:
      - ansible_os_family in ['Debian', 'RedHat', 'Suse']
    fail_msg: "Unsupported OS: {{ ansible_distribution }} {{ ansible_distribution_version }}"
    quiet: true
```

---

## 5. Sifat darvozasi (QA majburiy bajaradi)

```bash
ansible-playbook --syntax-check <playbook>.yml
ansible-lint --profile production .
```

- `ansible-lint --profile production` da **0 ta error** bo'lishi shart.
- Warning qolsa — README'da yoki `.ansible-lint` da sabab bilan yoziladi.
- YAML: 2 space indent, `---` bilan boshlanadi, qator uzunligi <= 160.

---

## 6. Collectionlar

Modul `ansible.builtin` dan tashqari narsa ishlatsa, papkada `requirements.yml` bo'ladi:

```yaml
---
collections:
  - name: community.general
    version: ">=9.0.0"
```

va README `Requirements` bo'limida o'rnatish buyrug'i ko'rsatiladi.
