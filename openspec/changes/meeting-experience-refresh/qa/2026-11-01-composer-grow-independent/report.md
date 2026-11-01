# Независимая проверка composer grow · 01.11.2026

**Адресный повтор iteration2: рост, ограничение высоты, shrink, внутренний scroll, reflow и критические действия прошли в проверенном native Chrome. P2-WEB-COMPOSER-GROW в выполненных путях не воспроизводится.** Это scoped review, не полный TC-CHAT-OUTSIDE-KEYBOARD, не все состояния design-manifest и не release pass.

Reviewer `/root/sdd_chat_audit` применил feature-test/design-review. Продукт, тесты, ожидания, tokens, manifest и родительские plan/run не редактировались. Suites выполняет root; их результаты здесь не присвоены независимому reviewer.

## Кандидат и среда

- Formal feature plan: `../2026-11-01-composer-grow/acceptance-v2/plan.json`, sourceHash `fe575f1b97f277c15c95a4d5856089553adb61c7e7864d835957c9ff018b33ca`, catalogHash `f0a3b23929371dfd70884c1b531974c89636bdb73303d9edb402eedff8479dfa`.
- Immutable bundle `/tmp/somewhere-sdd-composer-v2`, supplied inventory SHA256 `11b5f356f8fa6b262b3f381e10aa2b4528c377eeccd495f6b0b019a26890e9a9`; собственная побайтовая сверка в `freeze-verification.json`.
- Design inputHash **35408bcbb74d4331b6f4f07fa9afe633aa847556ccfb1e8ae8e1926af6c58ce6** одинаков в `design-context-before-iteration2.txt` и `design-context-after-iteration2.txt`. Source-after991inputs/runtime253files — `source-after-iteration2.json`.
- HTTPS8492: новый root-owned Go memory fixture с fake OAuth. Собственная UI-созданная встреча `ac01d74d-9cf5-468c-892a-36ebc86934ef`, synthetic Саша,30ноября2026. Production/реальные сообщения/пользовательские данные не используются.
- CUA native Google Chrome156.0.8078.74, macOS27.0.1(26A434), русский UI, host timezone Europe/Moscow. DevTools Responsive UI:1440×900,390×900,320×900, Fit to window; mouse/keyboard. IAB недоступен (`Browser is not available:iab`). Физические OS IME/touch не предоставлены.
- Approved raw: `http://127.0.0.1:8798/revisions/2026-10-27-telegram-chat/chat.html`, свежие reference PNG/AX с тем же текстом на1440/390/320; source hashes в `reference-sources.json`. Fullscreen composition сырого макета и desktop sidebar приложения различаются по существующей платформенной композиции; предмет этого review — поведение и доступность composer.

## Свежие действия iteration2

| Действие и ожидание | Наблюдаемый результат | Evidence actual |
|---|---|---|
|1440: две строки, затем20строк; рост до предела|Поле увеличивается,20строк остаются в ограниченном textarea; разговор/действия доступны|v2-desktop-two-lines, v2-desktop-max|
|Сокращение длинного текста и удаление оставшегося символа|После замены на один пробел поле уменьшается; BackSpace удаляет последний символ, поле пустое|v2-desktop-shrink-space, v2-desktop-one-char-delete|
|1440→390→320 с длинным paragraph и выделениемXX|Весь draft сохранён, ширина изменяет перенос/высоту; выделениеXX видно после обоих resize|v2-resize390-selection, v2-resize320-selection|
|320: внутренний scroll за пределом max-height|Cmd+Down показывает конец paragraph, wheel вверх — начало при прежнем composer; изменение текста до короткого уменьшает поле|v2-mobile320-internal-bottom, v2-mobile320-internal-top, v2-mobile320-shrink|
|320: outside history → первый emoji click → replacement|Фокус снимается; док открывается с первого click. 🍕 заменяет только выделенное «проверки», остальной multiline draft сохранён|v2-mobile320-outside, v2-mobile320-replaced-selection|
|Явный возврат к текстовому редактированию|Кнопка клавиатуры фокусирует textarea; ввод следующего текста работает|v2-mobile320-explicit-refocus|
|Первые Send на320/390/1440|Получены ровно три отдельные видимые canonicalстроки QA-V2-320-SINGLE, QA-V2-390-SINGLE, QA-V2-DESKTOP-SINGLE, по одной на каждое действие; поля очищаются и уменьшаются|v2-mobile320-send-shrink, v2-mobile390-send, v2-desktop-send, v2-final-three-canonical-rows|
|390: исходный пример multiline → плюс первым click → задача → Escape|Все три визуальные строки доступны; форма открывается; Escape возвращает фокус плюсу без автоматического refocus textarea; draft сохранён|v2-mobile390-two-lines, v2-mobile390-plus-first, v2-mobile390-task-open, v2-mobile390-return-no-refocus|
|390→1440 и Tab/Return/Escape|Две строки видимы после обратного resize. Tab из textarea фокусирует emoji, Return открывает popup, Escape возвращает фокус кнопке|v2-desktop-reflow-return, v2-desktop-keyboard-emoji, v2-desktop-keyboard-return|

Все перечисленные имена — `actual/<имя>.png` и `.ax.txt`. `interactions-iteration2.json` содержит capture index/timestamps; порядок действий и expected/actual дан выше. Пустой первоначальный REPL journal был восстановлен из реально созданных capture files, события не генерировались задним числом. Подтверждение сохранённого текста и фокуса опирается на AX+кадры+выполненные действия, а не на имена файлов.

`v2-desktop-empty` фиксирует неуспешную попытку инструментального Delete после select-all (выделенный текст оставался); этот файл не засчитан shrink pass. Последующие действительные операции сокращения/BackSpace перечислены отдельно. Ранние mis-targeting и key aliases iteration1 сохранены в её отчёте, не классифицированы как ошибка приложения.

## Граница вердикта

Визуально actual соответствует опубликованному raw по росту, доступности короткого multiline текста и ограниченному длинному полю с внутренним scroll. Точные computed CSSpx, pixel diff, разрешённые браузером шрифты и Console/ResizeObserver errors nativeAX не измеряет; они не выдуманы. Исправление console-loop требует собственных root suite evidence; этот ручной проход подтверждает только реальные UI пути после нового freeze.

Физические mobileOS IME/touch longpress, assistive technology, увеличенный текст и reduced motion в iteration2 не проверялись. Некоторые остальные outside-keyboard состояния проходили iteration1; их pass **не перенесён** на новый source. `feature-result.json` сохраняет scoped observations отдельно и полный case как incomplete/blocked по недоступным/неповторённым действиям. `design-scoped-review.json` содержит только проверенный composer scope, не121screen matrix.

Первый source `51fa5751...` и его46captures сохранены в iteration1.md; root снял freeze из-за настоящего ResizeObserver loop в WebKit suite. Новый источник и новый повтор оформлены отдельно, старые hashes не подменялись. Публикация rc15 по owner exception не использована как приёмка.

Чужие данные/приложения/процессы не менялись. В root memory fixture остаются только собственная QAвстреча и три synthetic сообщения; очистка всего fixture принадлежит root. Перед переключением DeviceHub другому reviewer Chromeввод остановлен и передан отдельный UIслот.
