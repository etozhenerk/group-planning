# Help/support iOS7.14 — независимый checkpoint R1

Вердикт: **needs-fixes по actual notice; partial по остальному flow**. Это ограниченный экранный checkpoint, не final gates/матрица и не основание закрывать все cases.

Frozen artifact `9b8ac94a84cf3fabd79e7444a54f840601938bedacf392f9f00bb91a8b974934`, source `5341949da43629cea2095ddc5946d89d277ad55eae5dff6da44407a5647e8695`, input `b2c0d35bdd0502e48c8b9a36e72d329e1378f5a928f28f6aaae39486e1d39629`. Все20 файлов immutable app и mainApp копии проверены SHA; после helperfix повторная подстановка: [binding](artifact-binding.json), [rerun binding](helper-rerun-binding.json). Product/test source репозитория не менялся; QA driver сохранён [здесь](HelpCheckpoint714Tests.swift), исполнялся в прежней temp-copy.

## F1 — actual unknown notice просит исправить заблокированные поля

После реального server201 с потерянным ответом виден заголовок «Отправка не подтверждена», затем «Не удалось отправить обращение. Проверьте поля и повторите попытку.» При этом message/section/diagnostics disabled. Approved raw использует helper «Текст и скриншот сохранены. Повторите отправку.» Повтор причины и инструкция редактировать frozen поля не соответствуют состоянию.

[Actual](actual/unknown-notice.png), [AX](actual/unknown-notice.ax.txt), [settled geometry](actual/unknown-notice.geometry.json), [approved raw](reference-form-unknown.png). Причина в frozenR1 `SupportSubmissionFooter.swift:14–20` + `SupportOwner.swift:140–143`. Код не исправлялся.

## Выполнено

- **B PASS22.567s**: собственная memory fixture реально приняла POST, ResponseGate записал исходный201 и заменил клиентский ответ503. Unknown сохранял текст, блокировал message/section, не показывал success. Retry после снятия gate привёл к реальному SW-reference и «Обращение принято», затем «К помощи» открыл Help. [Лог](smoke-independent.log), [receipt](actual/unknown-retry-real-receipt.png), [proof](actual/unknown-retry-result.json), [counts](actual/unknown-http-counts.json), [Help](actual/unknown-success-help.png). Невидимые request key/original receiptID не сравнивались: это manualUI слой принятой unit/backendHTTP/UI пирамиды, не утверждение exactkey/receipt equality.
- **A partial**: Help whole-row collapse первого/expand третьего, required-message «Баг»→inlineerror+focus/keyboard→исправление, section8вариантов/выбор «Чат встречи» и nativegrabber cancel с сохранением значения. Systempicker cancel сохранил message; затем реальный файл появился как «Скриншот.jpg» с «Убрать скриншот». [FAQ](actual/faq-ready.png), [form](actual/form-ready.png), [validation keyboard](actual/validation-focus-keyboard.png), [8options](actual/section-eight-options.png), [cancel](actual/section-cancel-before-assert.png). Диагностика/file подтверждены failureAX до следующего шага: [AX](attempt1/diagnostics-actual.ax.txt), Switchvalue0.
- Первый A остановился на устаревшем QA Button selector для реального Switchvalue0/1. После исправления selector один повтор A остановился раньше на full-swipe reveal section после validation/IME: helper осциллировал, `isHittable=false`, не установлена продуктовая причина. Логи: [первый](smoke-independent.log), [повтор](a-helper-rerun.log). Серия новых повторов не выполнялась. Privacy→Back draft/file, diagnostics toggle, success→исходный FAQ-state **не приняты**.
- **C partial**: actual QAwindow320×568, AX5 и системный ReduceMotion=true получен; submit hittable, framebottom540=568−padding28. Последний QAassert ошибочно требовал≤538 (hardcodedbottom30), поэтому Cfailed18.592s; это не доказанный дефект UI и не pass полного largeflow. [Actual](actual/compact-large-reduced-footer.png), [environment](actual/compact-large-reduced-footer.environment.json), [bounds](actual/compact-footer-bounds.json). Последние поля не прокручивались/не принимались. Normal402 form имеет реальный overflow, footer закреплён flush-edge и доступен; short/nonoverflow branch не воспроизведён.

## Статические риски, не выдаваемые за actual failure

[Source audit](../setup/source-audit.md) отдельно фиксирует: незаблокированное async screenshot reading способно изменить unknown body; прямой Back может уничтожить draft/identity; success создаёт новый экземпляр Help и может потерять исходные раскрытия/scroll. Эти сценарии текущим UIпроходом не подтверждены. Их нельзя закрыть screenshot/старым pass. Ошибка первоначального success→Profile уже отсутствует в frozenR1: B реально дошёл в Help.

## Isolation и cleanup

Только disposable Go memory + nil notifier, syntheticSDKidentity; никаких реальных обращений/Telegram/OAuth аккаунтов. iOS27.0, physical402×874; C — отдельные QAwindow320×568, не другой physicaldevice. VoiceOver не читался и не включался. Файлы только из QA Photos fixtures.

XCTest раннее завершение C не оставило restore-подтверждения, поэтому отдельный cleanup test **PASS6.118s** восстановил исходный ReduceMotion0: [record](actual/reduce-motion-cleanup.json), [лог](a-helper-rerun.log). Softwarekeyboard preference восстановлен1 обоими wrapper. Собственная fixture остановлена, app уже отсутствовал при terminate, lock снят; rootfixtures сохранены: [cleanup](cleanup.json). **Source/device RELEASED.** Новых runtime/build не будет до handoff. Full suites, desktop/Android, final design/QA gates не запускались.
