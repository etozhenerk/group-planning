# Android run02 — целевая инженерная проверка

27 октября2026. Somewhere_API_36 / emulator-5554, API36. DS1.4.1.
Исходники b1683d2f591bb458d2ffb4924d888f9ad229d2b68bf6351c45f85c3632731b61.
QA APK6e54bcd6725a261f0640b676b3cc422ba47eb7cdad03d360671d6889dc62c46d.
Полные хэши, команды и fixture — inputs.json; исходные run01/receipt сохранены.
Это инженерный прогон исполнителя, не независимая приёмка.

## Результат

- TelegramChatUiTests: 2/4 PASS, два FAIL только на проверках возврата фокуса.
- ComposerEditingDeviceTests: 3/3 PASS, включая Android ICU familyZWJ/modifier/flag/combining-mark deletion.
- Из run01 исправлена замена selection: range3..5 сохраняется до/после dock и после фокуса поиска; повторная вставка, возврат курсора к IME и Activity recreation прошли. Последний assertIsFocused на emoji-open после Back завершился FAIL.
- Формат шапки «Суббота,31октября ·6участников» и min48dp heading прошли. После закрытия информации heading имел Focused=false.
- Полные первоначальные errors/stacks находятся в chat/xml и chat.log.txt. ICU XML и лог отдельно в icu/xml и icu.log.txt. UI evidence скопирован до следующего Gradle запуска.
- Бинарные отчёты и сохранённые QA APK находятся в .cache/qa/2026-10-27-telegram-chat/android-implementation/run02; пути/SHA в inputs.json и *-raw-hashes.json.
- После результата emulator5554 остановлен штатно, heavy окно освобождено. Другие устройства не затрагивались.

## Подготовленное исправление после прогона

Источник причины проверен в локальных sources Jetpack Compose1.9.5:
Clickable использует Focusability.SystemDefined; Focusability.canFocus для него
возвращает false в InputMode.Touch. FocusTargetNode.fetchFocusProperties позволяет
переопределить это значение внешним focusProperties.canFocus.

У конкретных callback-targets возврата фокуса (emoji, header heading/info/Share,
reaction/people, add menu и roster expand/collapse) задано canFocus=true. Вызовы
requestFocus и исходные asserts сохранены. InputMode не меняется; текстовое поле
не получает фокус при Back. Существующий UI-тест дополнен assert для reaction
opener и проверкой WindowInsets.ime=false после Back.

Ktlint затронутых файлов и git diff --check PASS. Новая сборка и run03 ещё не
выполнялись; ожидается следующее разрешённое тяжёлое окно. Checkbox не менялись.
