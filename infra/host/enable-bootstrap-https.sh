#!/bin/bash
# Первое включение HTTPS до допуска постоянного хранилища приложения.
set -euo pipefail
test "$(id -u)" -eq 0
somewhere_config=${1:?Передайте путь к Caddyfile.bootstrap-https}
if systemctl cat somewhere.service >/dev/null 2>&1; then
    echo 'Приложение уже установлено: bootstrap не должен менять его маршруты.' >&2
    exit 1
fi
python3 - <<'PY'
import socket
addresses = {row[4][0] for row in socket.getaddrinfo('smwhere.ru', 443, socket.AF_INET, socket.SOCK_STREAM)}
if addresses != {'158.160.246.254'}:
    raise SystemExit('DNS smwhere.ru ещё не указывает исключительно на выбранную ВМ')
try:
    ipv6 = socket.getaddrinfo('smwhere.ru', 443, socket.AF_INET6, socket.SOCK_STREAM)
except socket.gaierror:
    ipv6 = []
if ipv6:
    raise SystemExit('Обнаружен AAAA: сначала проверить/убрать запись, у ВМ нет публичного IPv6')
PY
caddy validate --config "$somewhere_config" --adapter caddyfile
somewhere_backup=$(mktemp /etc/caddy/Caddyfile.before-https.XXXXXXXX)
cp --preserve=mode,ownership /etc/caddy/Caddyfile "$somewhere_backup"
install -o root -g root -m 0644 "$somewhere_config" /etc/caddy/Caddyfile
if ! systemctl reload caddy; then
    cp --preserve=mode,ownership "$somewhere_backup" /etc/caddy/Caddyfile
    systemctl reload caddy
    exit 1
fi
systemctl is-active caddy
printf 'Предыдущая конфигурация: %s\n' "$somewhere_backup"
printf 'Проверьте внешний сертификат, HTTP→HTTPS и HTTPS 503; это ещё не готовность API.\n'
