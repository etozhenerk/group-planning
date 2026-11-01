# Метрики HTTP API

Задача deployment-and-store-release 3.9. Метрики включаются явно:
`SOMEWHERE_METRICS_ADDR=127.0.0.1:9109` (либо числовой IPv6 loopback).
По умолчанию listener и сбор отключены. Адреса 0.0.0.0, внешние IP и DNS-имена
отвергаются. `GET /metrics` доступен только на этом отдельном listener;
на основном web/API origin путь `/metrics` всегда возвращает 404.
Listener запускается вместе с API и закрывается при завершении Serve.
Порт не публиковать в Caddy/security group. Включение scrape в Unified Agent,
сокращение прежнего набора метрик и облачный rollout — отдельный этап.

## Семейства

- `somewhere_api_requests_total{operation,outcome}`: только `/api/`, группы
  auth/meetings/feed/poll/invites/profile/health/other. Health, readiness,
  публичные приглашения и статика не входят в числитель/знаменатель API error rate.
- Outcomes взаимоисключающие: ok (2xx), redirect (3xx), client_error (4xx без429),
  limited (429), server_error (5xx без504, ошибка записи или abort), timeout
  (504 либо истёкший context deadline), cancelled (отмена клиентом), informational
  (в том числе WebSocket101). Один504 + deadline считается одним timeout.
  Bad = server_error + timeout; denominator = ok + redirect + Bad.
- `somewhere_http_duration_seconds{group,result}`: histogram групп
  read/write/auth/public и success/error. Границы 0.01/0.025/0.05/0.1/0.25/0.5/
  0.75/1/2.5/5 секунд и +Inf, sum/count. 2xx/3xx/upgrade дают success,
  отклонения/сбои/отмены — error. p50/p95/p99 вычисляются потребителем из
  buckets, с count для оценки выборки. Пустая группа не публикует нулевую latency.
- `somewhere_http_inflight{group}`: активные вызовы handler; завершаются также
  при отмене/панике. Наблюдение начинается с первого запроса группы.
- `somewhere_http_requests_total`, `somewhere_http_request_bytes_total`,
  `somewhere_http_response_bytes_total`: source × scope(api/public/assets).
  Байты — реально прочитанное handler тело запроса и успешно записанное тело
  ответа в Go, до Caddy compression; без заголовков и WebSocket frames.
  Непрочитанное тело отклонённого запроса не оценивается по недоверенному Content-Length.
  Это отдельный источник от внешних Caddy/VM байтов: их счётчики не складываются.

Source — один из пяти фиксированных классов: verified_bot, suspected_bot,
link_preview, synthetic, unknown. На первом этапе без доверенной конфигурации
источников verified_bot и synthetic не присваиваются. UA с известным названием
бота даёт только suspected_bot; известный preview-UA на invitation-пути —
предполагаемый link_preview. Это эвристика, без блокировки и CAPTCHA.
Обычный браузер остаётся unknown. X-Forwarded-For, Authorization и пользовательские
probe-заголовки не считаются доказательствами. Проверенный bot allowlist или
reverse+forward DNS/cache и подтверждение собственного probe ещё не подключены.
Это не позволяет ошибочно объявить весь трафик локального Caddy синтетическим.

## Ограничения и приёмка

Никаких URL/query, идентификаторов встреч/пользователей, токенов, IP, сырого UA,
SQL или произвольных версий в экспорте. Массивы имеют фиксированный размер;
максимум **217 рядов**:64 API outcomes +104 histogram +4 inflight +45 traffic.
Это на8 рядов больше первоначальной оценки из-за отдельного informational/101.
Полный лимит Monium500 включает остальные источники: последнее наблюдение470
уже требует уменьшить системный набор до подключения, даже если здесь217.
Counters сбрасываются при перезапуске; use rate/increase с обработкой reset.
Нет запросов — нет samples запросов и histogram; restart/тишина не являются PASS.

Middleware не меняет коды/API-контракт и не выполняет DNS/HTTP-запросы.
Hijack/ResponseController/Flush сохраняются; WebSocket измеряется до передачи
соединения, не по времени жизни/байтам всех последующих frames. DNS/TCP/TLS/TTFB
остаются в уже существующем отдельном Cloud Function probe. Proxy timeout до
попадания в Go виден только на Caddy. PG pool/worker, экспорт в Monium, панели,
нагрузка и actual cloud cardinality не принимаются этим локальным patch.

Первичные форматы: [Prometheus exposition](https://prometheus.io/docs/instrumenting/exposition_formats/),
[Go ResponseWriter/ResponseController](https://pkg.go.dev/net/http#ResponseWriter).
