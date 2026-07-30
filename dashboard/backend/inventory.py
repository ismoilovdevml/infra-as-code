"""Minimal parser for Ansible INI inventories.

configparser is the wrong tool here: an inventory line is
`node1 ansible_host=10.0.0.11 ansible_user=ubuntu`, which configparser reads as a
key of `node1 ansible_host` with a value of `10.0.0.11 ...`, losing every variable
after the first. It also chokes on `[group:vars]` sections and on `#` comments in
positions it does not expect.

This returns a plain structure for display; the raw text is what actually gets
edited and written back.
"""
from typing import Dict, List


def parse_inventory(raw: str) -> Dict[str, List[Dict[str, str]]]:
    groups: Dict[str, List[Dict[str, str]]] = {}
    current = "ungrouped"

    for line in raw.splitlines():
        line = line.split("#", 1)[0].split(";", 1)[0].strip()
        if not line:
            continue

        if line.startswith("[") and line.endswith("]"):
            current = line[1:-1].strip()
            groups.setdefault(current, [])
            continue

        parts = line.split()
        if not parts:
            continue

        # `[group:vars]` sections hold bare `key=value` lines, not hosts.
        if current.endswith(":vars") and "=" in parts[0]:
            key, value = parts[0].split("=", 1)
            groups.setdefault(current, []).append({"name": key, "value": value})
            continue

        entry: Dict[str, str] = {"name": parts[0]}
        for part in parts[1:]:
            if "=" in part:
                key, value = part.split("=", 1)
                entry[key] = value
        groups.setdefault(current, []).append(entry)

    return groups
