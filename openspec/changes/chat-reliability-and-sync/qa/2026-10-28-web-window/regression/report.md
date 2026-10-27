# Web: границы ACK, соседней вкладки и реакций

Изолированный кандидат после baseline `f034b8c`; baseline не переносить в main.
Изменения не закрывают task 4.4/4.5 и не заменяют независимую приёмку.

## Разбор main run01

В mobile WebKit 28/32/34 тест обращался к строке сразу после Enter/появления
текста. Trace подтверждает, что POST ещё не завершился. В утверждённом UX pending
не открывает реакции. Теперь сценарий явно ждёт `data-delivery=accepted`, затем
сохраняет прежние действия и ожидания реакций, retry и отмены touch hold.

В двух вкладках (37) обнаружена ошибка runtime: владелец удалял принятый intent
из IndexedDB раньше, чем соседняя вкладка получала каноническую запись.
Legacy polling следующей вкладки мог перейти с 3 на 6 секунд; строка временно
исчезала. Добавлен ID-only BroadcastChannel ACK hint, немедленная HTTP-сверка
и удержание предыдущей pending-строки до канонического результата. В тесте обе
строки помечены DOM-атрибутом до ACK; после ACK проверяются сохранённый узел,
ровно один POST и ровно одна серверная запись.

Для plain-text intent ответ ACK принимается только при совпадении участника,
встречи, stable key, текста, kind=message и отсутствии attachments. Этот же
предикат применяется к UI-dedupe. Unit regression сохраняет intent после
совпадающего текста с media в ответе.

Root-правки 02/04 (same-row и автоматическое восстановление) включены в baseline
и повторно проверены вместе с указанными регрессиями; собственный commit их
не дублирует.

## Проверки

- `npm run web:check`: 144 unit/integration, типы, lint, FSD, CSS, format.
- `npm run --workspace @somewhere/web build:demo`.
- Targeted legacy: 12/12 Chromium + mobile WebKit, workers=1, realtime=false.
- Actual SDK suite: 22/22 Chromium + mobile WebKit, workers=1, realtime=true.
- `npm run agent:check` и `git diff --check`.

Точный backend: d32deaa07093e50c138089f77f989e7cacc8e43a,
`/tmp/chat-realtime-browser-fix.test`, SHA256
`723913f7047f26ffcb549cfdd628d30f68949153f7405a0b0049607c12a6d6cf`.
Свой loopback 8458; main/user fixtures не изменялись. Read-state=false.
Команды и хеши web/demo находятся в candidate.json; raw JSON/log рядом.

`legacy-run01.json` сохраняет промежуточный 7/8: mobile touch hold ещё имел
старое предусловие accepted. Он не объявлен pass и не перезаписан. Последующие
финальные результаты перечислены отдельно. Полный набор 193 здесь не повторялся;
исправления проверены адресно и существующим sync/outbox набором.
