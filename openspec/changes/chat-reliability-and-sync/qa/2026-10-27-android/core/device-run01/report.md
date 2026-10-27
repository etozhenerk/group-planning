# Android core: проверка на эмуляторе

Замороженный candidate `ff1cf42748debe02c51519db20dac298e67f69d5`; APK и test APK сверены по SHA из engineering artifacts. Установлены только `dev.groupplanning.android.uitesthost` и его instrumentation package на уже работающий emulator-5554. Обычное приложение не менялось; сброс устройства/данных не выполнялся.

13 instrumentation tests PASS: сохранение того же Compose semantics node после ACK, доступность следующего ввода при отправке, encrypted multi-intent queue/draft с настоящим Android Keystore, interrupted AtomicFile write, tamper/origin/missing-key rejection, grapheme-aware удаление/вставка emoji. Runtime 2.241s по AndroidJUnitRunner. Синтетические файлы и ключи создаются и удаляются самими тестами.

Это самостоятельный запуск root уже существующих проверок на точном APK, не независимая полная feature/design-приёмка. Сетевой SDK, реальный backend, read-state UI и длительная прокрутка этими 13 тестами не проверены. Raw взаимодействий instrumentation и receipt сохранены рядом. Устройство передано исполнителю следующего Android-среза.
