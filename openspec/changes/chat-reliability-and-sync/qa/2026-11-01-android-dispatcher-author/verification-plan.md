# Android: план исправления QA scheduling

Дата: 01.11.2026. Исполнитель sdd_server_audit; независимую приёмку назначает root.
Объём: QA dispatcher, два регулярных regression tests, сохранение locale setup.
Требования, каталог, backend, CI, Telegram и релизы не меняются.

Исходный план до правок: `/tmp/somewhere-android-qa-dispatcher-fix/report.md`.
Он прошёл peer review `/tmp/somewhere-sdd-android-dispatcher-independent/report.md`.
Первое сохранение этого файла Python-скриптом завершилось ошибкой кодировки;
после этого применён только согласованный patch и добавлен класс в runner.
Проверки приложения к этому моменту ещё не начинались.

1. Сохранить исходные 75 PASS / 10 FAIL, exact patch и peer report.
2. Штатный all: 85 product + 2 internal tests; два process-death stages отдельно.
3. Собрать default-control instrumentation: framework factory только у нового
   класса; два метода по одному в свежем процессе на emulator-5554. Сохранить
   source/APK hashes, сертификат, настройки, instrumentation и logcat.
4. Собрать fixed instrumentation: два метода вместе в свежем процессе.
   Проверить effect/collector/apply main thread, текст и последующий state apply.
5. Короткий исходный prefix и motion tests на synthetic fixture. При FAIL
   сохранить первый stack; устранить причину без ослабления ожиданий/таймаутов.
6. После адресного PASS выполнить штатный all и persistence. Разделить результаты
   85 product / 2 internal; сохранить screenshots, raw и очистку своих данных.
7. Android format, Debug/Release, Lint, unit, QA build по локальным инструкциям;
   agent:check, diff-check и карта task/case/evidence. Checkbox не закрывать до
   независимых feature/design gates.

Авторские проверки не заменяют независимую приёмку. Физическое устройство
не проверяется: пользователь разрешил только симуляторы.
