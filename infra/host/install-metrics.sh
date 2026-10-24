#!/bin/bash
set -euo pipefail
test "$(id -u)" -eq 0
folder_id=${1:?Pass Yandex Cloud folder ID}
[[ "$folder_id" =~ ^[a-z0-9]+$ ]]
ua_version=26.10.50
ua_sha256=4b408a2a283f6abb07c4b4c0eb17539b50f0947075548b2eaa42403e50d49a69
package=$(mktemp --suffix=.deb)
trap 'rm -f "$package"' EXIT
curl --fail --silent --show-error --max-time 120 -o "$package" "https://storage.yandexcloud.net/yc-unified-agent/releases/${ua_version}/deb/ubuntu-24.04-noble/yandex-unified-agent_${ua_version}_amd64.deb"
echo "$ua_sha256  $package" | sha256sum --check -
dpkg -i "$package"
install -d -m 0755 /etc/systemd/system/unified-agent.service.d
cat > /etc/systemd/system/unified-agent.service.d/limits.conf <<'EOF'
[Service]
MemoryMax=256M
Restart=on-failure
RestartSec=10
EOF
cat > /etc/yandex/unified_agent/config.yml <<EOF
status:
  port: "16241"
storages:
  - name: main
    plugin: fs
    config:
      directory: /var/lib/yandex/unified_agent/main
      max_partition_size: 128mb
      max_segment_size: 10mb
channels:
  - name: cloud_monitoring
    channel:
      pipe:
        - storage_ref:
            name: main
      output:
        plugin: yc_metrics
        config:
          folder_id: "$folder_id"
          iam:
            cloud_meta: {}
routes:
  - input:
      plugin: linux_metrics
      config:
        poll_period: 60s
        namespace: sys
        resources:
          cpu: advanced
          memory: advanced
          network: advanced
          storage: advanced
          io: advanced
    channel:
      channel_ref:
        name: cloud_monitoring
  - input:
      plugin: agent_metrics
      config:
        poll_period: 60s
        namespace: ua
    channel:
      pipe:
        - filter:
            plugin: filter_metrics
            config:
              match: "{scope=health}"
      channel_ref:
        name: cloud_monitoring
import:
  - /etc/yandex/unified_agent/conf.d/*.yml
EOF
systemctl daemon-reload
systemctl restart unified-agent
systemctl is-active unified-agent
dpkg-query -W yandex-unified-agent
