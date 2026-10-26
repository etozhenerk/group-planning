# Следующий независимый web run

## Ревизия 27.10.2026

Root назначил новый итоговый report:
`openspec/changes/meeting-experience-refresh/design-review-2026-10-27-chat-sheets.json`.
Новые evidence сохраняются только в `live-review/2026-10-27-chat-sheets/`;
предыдущие волны остаются историей. Перед запуском адаптировать ещё не
исполненные final harness под опубликованные ссылки новой ревизии HTML.
Не использовать прежние action-page references как окончательные mobile sheets.
Матрица остаётся полной: 62 группы / 348 состояний, включая onboarding iOS/Android.

Промежуточный dd37ef5b не объявлен окончательным freeze: публикация references
и исправление iOS DatePicker меняют входы. До нового handoff browser/runtime
не запускаются. Недостающие полные raw references не заменяются actual PNG.

См. `onboarding-live-plan.md`, `native-screen-reader-feasibility.md` и
`mobile-web-ime-feasibility.md`. Отмена настоящего системного web file picker
требует отдельного headful disposable Chromium run через UI; setFiles/закрытие
предпросмотра не являются доказательством этой отмены. В Git сохраняется кадр
возврата в приложение, без содержимого системного каталога.

## Последовательность после handoff

Все шаги ждут fresh production dist и source freeze. Каждый driver получает
REVIEW_SOURCE_HASH из самостоятельно вычисленного context. Старые captures
не переименовываются и не связываются с новым hash.

1. Новый test-only runtime8444, чистая memory fixture: basic4width captures.
2. List states: один QA объект через API, long-title/no-cover и возврат из чата.
   Reference использует исходную card DOM-композицию с такими же данными fixture;
   CSS и исходный HTML не меняются. Adaptation описана в fixture-variant.json.
3. Перезапуск только нашего8444 для чистой fixture перед zoom-list.
4. Zoom200%: disposable Chromium profile/extension; actual/reference одинаковый
   browser zoom, layout CSS viewport/DPR/pixel dimensions записаны отдельно.
5. Remaining fixes: info/settings/share/media/reaction/task details на4width.
6. Form states: committed-response loss, pending, error, reopen, retry, actual
   reduced-motion preference, access revoke+rejoin. Новые QA встречи изолируют мутации.
7. Личный просмотр пар, обновление image inventory, затем verdict по каждой
   manifest строке. Непросмотренные или невыполненные состояния остаются blocked.

Реальная software IME mobile web этими headless сценариями не имитируется.
Keyboard focus/кнопки и изменение viewport не выдаются за виденную IME.
