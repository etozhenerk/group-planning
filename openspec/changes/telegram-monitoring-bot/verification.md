# Проверка Telegram-уведомителя — 25.10.2026

## Код

- Go 1.27.2: gofumpt/wsl, vet, build, `go test -race ./...` — прошли.
- Go 1.23.12: все тесты прошли, vendored source ZIP собирается для Linux amd64.
- Handler отклоняет чужой/неизвестный alert ID, folder/host/environment и статус
  до сетевых вызовов. Проверены подмена annotations/labels и ограничение event.
- Metadata/Lockbox: получение текущего токена, ротация, размер/HTTP/JSON-ошибки,
  отсутствие секретов/ответов/URL в ошибках. Metrics read: null/NaN/string int64,
  интервалы/количество точек, неоднозначные несколько рядов, лимит ответа.
- Доставка: ALARM/OK/NO_DATA, текстовый fallback при отказе истории/рендера,
  stale, пустые данные, UTF-16 caption, кнопка Monium при photo и text.
- Telegram: multipart/адресат, 429 retry_after (включая слишком большой), 5xx,
  сеть/403/invalid JSON/cancel/redirect, не более трёх попыток. 20 конкурентных
  событий прошли race detector. Exactly-once не заявляется.
- Probe: HTTPS 200/302/503, запрет redirect, неверный origin, отмена/ошибка TLS,
  большое тело, отсутствующие этапы, certificate expiry и время проверки.
  Metrics write: фиксированный endpoint/labels, bounded names, count/error response.
- CI: workflow, actionlint, routing и agent:check проверены вместе с
  [потоком релизов](../component-releases/verification.md).

## Визуальная проверка

[Демонстрационный PNG](assets/preview.png) просмотрен: кириллица, легенда,
пороговые линии, время UTC и последняя отметка читаемы; пропуск данных не соединён.
Данные синтетические, изображение не выдаётся за текущую нагрузку сервера.
Это график из MetricsData, а не screenshot браузера Monium.

## Не проверено в облаке

Настоящие сообщения не отправлялись; нет token/secret ID/chat ID. Не выполнены
live IAM/invocation/channel/rotation/scaling, Alarm → OK → No data, отказ ВМ/БД,
независимое оповещение о неисправности самой функции. Нет готового домена/API для
probe. Доставка email ранее не подтверждена и не считается резервным каналом.
Задача 3.1 остаётся открытой; локальные тесты её не закрывают.
