# Android run01 — целевая инженерная проверка

27 октября 2026. Только Somewhere_API_36 / emulator-5554, Android16/API36.
QA APK и исходники совпали с первоначальным receipt; полные входы в inputs.json.
Эмулятор запущен без wipe/нового AVD и остановлен после обоих прогонов.
Это проверка исполнителя, не независимая приёмка.

## Результат

- TelegramChatUiTests: 3/4 PASS, один FAIL; chat.log.txt и chat/xml сохраняют исходную ошибку.
- ComposerEditingDeviceTests: 2/3 PASS, один FAIL; icu.log.txt и icu/xml сохраняют исходную ошибку.
- QA сборки были UP-TO-DATE; выполнялись только connectedQaAndroidTest.
- UI XML/captures сохранены до запуска ICU, чтобы следующий Gradle run их не перезаписал.
- Raw reports, logcat, protobuf/binary — в .cache/qa/2026-10-27-telegram-chat/android-implementation/run01/{chat,icu}/; хэши в chat-raw-hashes.json и icu-raw-hashes.json.

## Исходные дефекты

1. dockReplacesSelectionRepeatsAndRestoresKeyboardCursor: ожидалось «До 🍕 после», получено «До XX🍕 после». Диапазон3..5 сворачивался при clearFocus перед открытием dock. Поиск выполнялся после потери selection. Критерий замены выделения сохраняется без ослабления.
2. deletionUsesAndroidGraphemeBoundariesForFamiliesModifiersAndFlags: IllegalArgumentException: offset out of bounds в BreakIterator.isBoundary. Внутри BreakIterator.apply свойство text перекрывало TextFieldValue.text; setText получал собственный пустой CharacterIterator.

## Подготовлено после прогона

- Dock включается до снятия фокуса. Композиция IME завершается; фоновые onValueChange от unfocus не заменяют сохранённый диапазон, пока открыт dock. Возврат в composer разрешает обычное редактирование.
- BreakIterator.setText получает строку явно вне apply.
- Существующий UI-тест дополнен проверкой range3..5 до открытия dock, после открытия и после фокуса поиска. Исходные ожидания текста и остальные шаги сохранены.
- Лёгкий ktlint для трёх затронутых файлов и git diff --check PASS.
- Новая сборка и run02 пока не выполнялись; требуется следующее тяжёлое окно. Исходный receipt/run01 не переписываются хэшами исправления.
