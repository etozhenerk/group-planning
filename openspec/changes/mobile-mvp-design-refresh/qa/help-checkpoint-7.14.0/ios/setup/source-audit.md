# Help/support iOS7.14 — предварительный source audit

Read-only, без build/runtime и без verdict работающего UI. Код читался во время подготовки родителя; success routing изменился между первым и последним чтением. Ниже только последний вид кода. Frozen checkpoint принимается отдельно в ios/r1.

## Существенные статические находки / проверки на actual

1. **Асинхронное чтение выбранного файла не блокирует submit и может менять unknown payload.** `SupportScreen.swift:79–90` ждёт `loadTransferable`, затем присваивает `owner.screenshot` независимо от sending/frozen. Reading-state отсутствует; `SupportSubmissionFooter.swift:44` отключает submit только по sending. В approved `FeedbackFooter.tsx` submit disabled при m.reading. Пользователь может нажать submit после picker до завершения чтения: первый запрос без нового файла; затем file присоединяется, а unknown-retry в `SupportOwner.submit` заново кодирует body и меняет requestID при отличии previousBody (`SupportOwner.swift:113–117`). Это статически открытая гонка; runtime пока не воспроизводился. Нужна блокировка send во время чтения и/или immutable unknown snapshot, не новая бизнес-ветка.
2. **Незавершённая форма закрывается напрямую.** `SupportScreen.swift:41–46` вызывает dismiss при любом reference=nil; нет dirty guard/retained owner у вызывающего ProfileServiceMenu/ServiceInformationScreen. При повторном открытии создаётся новый SupportOwner, файл/текст/unknown request identity теряются. Raw useHelpPreview живёт над маршрутами и сохраняет draft при обычном Back; общий mobile spec защищает выход с несохранённым вводом. Проверить actual Back→повторное открытие и сопоставить с действующим dirty-exit требованием, не выдавать старый canonical immediate-back за автоматический pass.
3. **Unknown/error notice использует старое повторное problem copy.** `SupportSubmissionFooter.swift:14–20` уже показывает заголовок «Не удалось отправить обращение»/«Отправка не подтверждена», а `SupportOwner.swift:140–143` даёт вторую фразу «Не удалось отправить обращение. Проверьте поля…». Raw helper — «Текст и скриншот сохранены. Повторите отправку.». Для frozen=true инструкция проверить поля дополнительно противоречит disabled форме. Статическое расхождение текста; нужно подтвердить actual в controlled lost reply.
4. **Success теперь показывает Help, но новым экземпляром.** Последний `SupportScreen.swift:28–29/42–49` использует showHelp=true, поэтому первоначальная ошибка «К помощи»→Profile уже устранена. Однако при входе из Help это новый ServiceInformationScreen/HelpContent с новым @State раскрытиями и scroll, тогда как исходный Help остаётся под fullScreenCover. Требование хранит FAQ open/scroll при возврате; проверить actual после success из Help. При обычном dismiss исходный Help сохраняется — это отдельный путь.

## Что статически выглядит согласованным, но не является pass

- Privacy NavigationLink внутри того же NavigationStack использует тот же owner/screenshot; явного reset нет. Реальное сохранение поля/файла/scroll после Back проверяется UI.
- Section — отдельная ActionFormSheet с8 SupportSection keys, selected trait/галочка, выбор меняет значение и закрывает, отмена не присваивает значение. Внутреннего Back/footer нет.
- Footer меняет flow/pinned по contentHeight+footerHeight>viewportHeight. Не выявлен безусловный sticky. При клавиатуре нужен actual available viewport и доступность последнего поля, статическая формула не доказывает settled geometry.
- FAQ state локально удерживается при fullScreenCover; скрытый ответ accessibilityHidden, whole-row button/plusminus сохранены. Recovery selector, использующий brand-wordmark, устарел для нового header.

## Canonical selector adaptations

Не менять expected ради старых тестов: support-submit identifier / labels «Отправить обращение» и «Повторить отправку»; attachment «Прикрепить скриншот» / «Убрать скриншот»; support-section-trigger; diagnostics «Данные об устройстве». После success проверять «К помощи» и Help, не «Назад»→«Яндекс ID». Profile вернулся к «Вход через Яндекс ID», Cookie теперь кратко «Cookie». На системном picker identifierAdd может иметь label«Готово». Support-keyboard-done и support-description сохраняются.

Receipt/idempotency доказательства остаются по принятой пирамиде unit/body-key + backend HTTP + actual UI lost-reply/retry/reference. Path-only trace не притворяется ручным proof невидимого key/receiptID. VoiceOver исключён.
