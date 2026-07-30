# Grafana stack

Two independent collections. Each has its own README, inventory and variables.

| Collection | Contents |
| --- | --- |
| [grafana-collection/](grafana-collection/) | Grafana, Loki, Promtail (binary and Docker) |
| [prometheus-collection/](prometheus-collection/) | Prometheus, Alertmanager, node_exporter and other exporters |

## Usage

```bash
cd grafana-collection    && ansible-playbook install_grafana.yml
cd prometheus-collection && ansible-playbook install_prometheus.yml
```

## Notes

- **Promtail is end-of-life.** Grafana replaced it with Alloy. The Promtail playbooks
  still work and are pinned to the last release that publishes assets, but new
  deployments should target Alloy — see
  [grafana-collection/README.md](grafana-collection/README.md).
- The pinned Prometheus version is not auto-verified. Check it against
  `github.com/prometheus/prometheus/releases` before rolling out.
