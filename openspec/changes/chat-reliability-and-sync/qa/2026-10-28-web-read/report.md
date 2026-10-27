# Web 4.5 — read-state и финальный регрессионный кандидат

Дата: 28.10.2026. Исполнитель: `web_chat_sync`. Изолированная worktree
`/Users/misha/.codex/worktrees/chat-web-sync/group-planning`, ветка `codex/chat-web-sync`.
MAIN, пользовательский стенд и production не изменялись. Это отчёт исполнителя,
не независимая функциональная или визуальная приёмка; checkbox задач не изменён.

## Итог проверок исполнителя

- Application source `74d840f`: web-check PASS, 169 unit; demo и production-mode build PASS.
- `agent:check` PASS; `qa:test` 12/12 PASS.
- Полный frozen legacy: **191 PASS / 1 FAIL / 1 SKIP**, 0 flaky, 193 всего.
- Read-state 6/6, bounded window 4/4, real SDK 22/22 — PASS.
- После test-only `fa8a25db`: только reaction precondition targeted **2/2 PASS**;
  полный набор повторно не запускался и остаётся с указанным FAIL.
- Доказательства queued до исправления: `final/legacy-precondition-analysis.json`.
  После: `final/accepted-trace-excerpts.json`, private trace paths + SHA;
  assertion accepted предшествует Enter в обоих браузерах.

Готово для продолжения интеграции: код, сборки и перечисленные проверки. Не готово
к объявлению общего release PASS: требуется новый full на окончательном harness hash,
общая native fixture ветка и независимая приёмка. См. границу сессии ниже.

## Граница изменения

После checkpoint 4.4 `17dfd89` добавлены данные и состояния 4.5 по опубликованной
DS 2.5.1: badge непрочитанного в карточке встречи; фиксированный разделитель первого
непрочитанного; открытие соответствующего окна; собственные positive receipts;
пункт «Кто прочитал» внутри существующего меню своего сообщения, включая zero;
readers dialog/sheet с loading, empty, error/retry и постраничным списком.

Read marker использует переданный root owner: 500 мс непрерывной видимости конца
сообщения, active document/focus, отсутствие перекрывающего UI, max decimal position,
не более одного запроса в секунду. Logout, account, access и stream epoch меняют
поколение владельца. Late callback не возвращает приватные данные. Sync/read ответы
сливаются по версии и монотонному фактическому marker. `read_state=false` оставляет
старое поведение; `0` отличается от отсутствующих полей.

Личный список имеет одного владельца personal subscription и обновляет unread badge
после hint без открытия встречи. Healthy WebSocket не запускает idle HTTP polling.
После успешного fallback HTTP сбрасывается backoff, ошибки продолжают увеличивать
интервал. Контракт API не изменён.

## Состав интеграции

- `5d0c691` — отдельный frozen QA catalog; selector/mapping обновлены до запуска планов.
- `b53542dc6dd80735c0af01dfa61f06274a1fec5f` — основной source checkpoint 4.5.
- `9a627a1` — исправления регрессий; `74d840f6306f4e6327cbaf585bb5cd828eb5985f` —
  окончательный source после FSD split. Точные файлы: `final/integration.json`,
  source/build hashes: `final/candidate.json`.
- Baseline-коммиты `cbff7b0`, `fcd02ff`, `741497c` НЕ переносить: соответствующие
  DS, read data/owner и уточнения кейсов уже находятся в MAIN.

## Найденные регрессии и исправления

Исходный диагностический запуск сохранён в `run01/` и `full-run01-failures/`.
Он прерван: 153 успешных, 9 ошибок, 31 skipped/not-run, поэтому это не полный pass.
Во время диагностики после выполнения затронутых тестов изменялись их исходники;
единственным итоговым регрессионным доказательством служит новый frozen запуск.

1. Absolute wrapper виртуальной строки потерял flex-column контекст; `align-self`
   собственного bubble перестал работать. Возвращён существующий flex-контекст.
2. Helper геометрии читал три bounding box в разных кадрах после resize. Теперь
   читает их одной DOM-операцией и ждёт устойчивого layout; исходные пороги сохранены.
3. Пять старых тестов содержали origin/baseURL/OG image с портом 8444. Они используют
   origin своего текущего fixture, сохраняя проверки статуса и содержимого.
4. Успешный fallback HTTP ошибочно наращивал backoff до 30 с. Теперь успешные
   обновления идут через базовый интервал; отдельный unit проверяет ошибки и recovery.
5. Тест emoji dock использовал старый текст кнопки. Selector приведён к опубликованному
   «К новым сообщениям»; сохранены scroll offset, viewport и IME dock assertions.
6. Переход к хвосту не удерживал последнее сообщение при последующем уменьшении
   viewport из-за emoji dock. ResizeObserver сохраняет tail либо прежний visible anchor;
   исходные assertions проверяют это на Chromium и WebKit.
7. Старый c789 API fixture имел только две персоны, а roster test требует восемь.
   Итоговые прогоны используют свежий MAIN binary с требуемым roster, без ослабления кейса.

## Проверки и ограничения

Итоговые результаты, команды и hashes — в `final/`. Production-mode build имеет
локальный build identity; выпуск с release identity и независимые gates выполняет root.

Сценарий first-unread создаёт 10 000 сообщений реальными POST и проверяет around,
переход к хвосту, bounded 500 server rows / 200 mounted, количество initial HTTP calls.
Read UI проверяется двумя настоящими cookie-профилями: personal badge update,
500 мс, overlay pause, zero/empty/error/retry, positive receipt и focus return.

Headless `bringToFront` не делает второй документ скрытым: эксперимент сохранён в
`intermediate/headless-background-precondition.json`. Visibility regression поэтому
явно управляет document.visibilityState и событием; это проверка настоящего adapter,
а не доказательство физического переключения ОС или аппаратной клавиатуры/IME.

Многостраничный readers roster, аппаратные IME/VoiceOver, полный motion/AX и визуальное
совпадение всех состояний остаются за независимой приёмкой. Наличие кода, unit или
screenshot не объявляется приёмкой этих сценариев. Catalog mapping сохраняет partial.
WT qa:check ссылается на более старые общепроектные QA baseline; root выполняет его
на актуальном MAIN. Старые evidence и hashes не переписывались.

## Граница завершения сессии

По решению пользователя production activation сегодня не начинается. Application source
остаётся `74d840f`. Последующее исправление — только отсутствующее предусловие теста
реакции: дождаться accepted строки перед Enter. Отдельный test-only commit: `fa8a25db`. Trace исходного full подтверждает
`data-delivery=queued` непосредственно после Enter; ошибка и времена сохранены в
`final/legacy-precondition-analysis.json` и raw report.

Полный набор с этой ошибкой нельзя считать PASS после отдельного успешного targeted.
В следующей сессии до release нужен новый полный 193 на окончательном test hash,
завершение независимой функциональной и дизайн-приёмки точного кандидата, затем
release identity/receipt и согласованное включение backend flags. Исполнитель не
делает production deploy, не включает flags и не закрывает общеплатформенные задачи.


Единственный SKIP полного запуска: Chromium,
`08-cross-platform.spec.ts:5`, «one meeting shared by web, iOS and Android».
Причина на строке 8: `Requires the shared native UI fixture`. Это не platform N/A:
общий межплатформенный сценарий на этом окружении не выполнен и требует отдельной проверки.
