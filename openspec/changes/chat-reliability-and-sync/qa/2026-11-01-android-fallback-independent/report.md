# Android: независимая квалификация fallback-кандидата, 01.11.2026

Текущий кандидат прошёл обязательные проверки: **194 unit, 85 продуктовых + 2 внутренних UI-теста, два отдельных этапа process-death и stock-fixture cleanup — PASS, без skips**. Это автоматизированный срез; 279 ручных кейсов и дизайн-приёмка не объявляются пройденными.

## Точный кандидат и предварительный план

Source hash `2b0eafdb29ef1b3c6d111e0a07ea09a5360593d1dd23217501a369ef74a2484c`; все **992 inputs** совпали до/после сборки и полного прогона (`source-before.json`, `source-after-build.json`, `source-after-full.json`). Каталог `84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e`; backend/SDK pins не менялись.

Первый broad279 plan создан до actual unit: `acceptance/plan.json`. Перед повтором UI с правильной существующей подписью создан `acceptance-correct-key/plan.json`; его `run.json` содержит успешные required android-unit/android-ui receipts. `checks: []` сохранён честно: это не whole-feature qa:ready. Продуктовые кейсы, ожидания, runner и runtime в ходе независимой проверки не редактировались.

Проверенные APK: app `ddcf2f59090d6788a4167da75f85872325614fa690bbb72bf057205e75868334`, instrumentation `619ecb6c39fc65d8ae180573e0107769f957c8e73b6d63385e41bf6ff46a96a3`. Публичный сертификат обоих `78296c6f2a0cfdfc55f7aa6a8c216bd606aa251496789c90bee267d1ac15c5e3`. Полные размеры/подпись — `artifacts-correct-key.json`.

## Actual действия и результаты

- `sh frontend/android/scripts/check.sh`, 20:05:26–20:10:03 UTC, exit0: clean/formatCheck, Debug/unsigned Release, Lint Debug/Release, **реальные194 unit**, AndroidTest/QA builds. Доказательства: `evidence/check.log`, `check-result.json`, `unit-current-summary.json` и unit XML. Последующие формальные unit wrappers использовали UP-TO-DATE; новым запуском194 они не названы.
- Независимый отрицательный контроль в отдельной `/tmp` копии: ровно старый runtime FeedSync (SHA совпадает с frozen53ab), новый cadence regression без изменений. **1 expected FAIL**, expected10/actual11 на преждевременном24s poll; текущий тот же тест PASS. Исходные XML/log/source и expected-red classification в `evidence/old-control-*`, подробный механизм в `review-fallback.md`.
- Первоначальный UI bootstrap: **0 tests**, INSTALL_FAILED_UPDATE_INCOMPATIBLE из-за isolated debugstore414f против установленного7829. Это не87 продуктовых FAIL. Полная исходная история сохранена в `bootstrap-0-tests/`.
- Исправлена только среда подписи: существующий default debugstore, без чтения/экспорта key payload, новых ключей, uninstall или clear-data. Пересобраны только assembleQa/assembleQaAndroidTest. Все492 app и85 test несигнатурных ZIP members побайтно совпадают; unit/Lint не повторялись из-за одной подписи. См. `artifacts-correct-key.json`, `evidence/rebuild-qa-correct-key*`.
- Штатный `test-ui.sh all` через qa:run-suite, emulator-5554, maxworkers1, 20:21:30–20:31:06 UTC, exit0: **87/87,0 failures/errors/skips**. Затем отдельные процессы prepareProcessDeath/restoreAfterProcessDeath **OK1 каждый**, TestAndroidFixture **PASS** после cleanup. JUnit `full-current/connected-results/`, короткий stock stdout `full-current/stock-runner/`, весь console receipt `evidence/android-ui-correct-key.log`; сводка `full-current-summary.json`.

Команды воспроизведения/окружение сохранены в `verification-plan.md`, suite receipts и check stdout. JAVA_HOME JDK17.0.21+9, ANDROID_HOME SDK; ANDROID_SERIAL=emulator-5554; GRADLE workers1. Для UI подписи ANDROID_USER_HOME/ANDROID_SDK_HOME unset; используется прежний существующий default debugstore. Обычный пакет и другие устройства не затрагивались.

## Cleanup и границы независимости

`device-handoff.json`: QA host остановлен; private ui-fixture/namespace восстановлены побайтно без экспорта содержимого; reverse9 исходных записей сохранены; font1.0, app locales[], IME0 и animation scales восстановлены; **baselineDelta={}**. Stock fixture завершён exit0; собственных работающих fixture не осталось. Установленный QA APK совпадает с проверенным ddcf…; hashes артефактов после UI не изменились.

Проверяющий не автор новой fallback-дельты/расширенного cadence regression, но ранее автор части restore/access/auth/viewport и QA helpers. Поэтому данный отчёт не присваивает независимую приёмку этим веткам. Profile/onboarding manual captures и их дизайн-gates по завершающему поручению пользователя **не выполнялись**; keyboard/account-cleanup verdict остаётся за другим независимым проверяющим. Новые whole UI task IDs к закрытию на основании одной автоматизации не предлагаются. Checkboxes не изменялись.

## Хранение доказательств

Git-safe пакет содержит планы/receipts,194+87 JUnit, stock stdout, source/artifact manifests и отчёт. Полные logcat/screens/videos/APKs сохранены **локально вне Git**, без удаления: `/tmp/somewhere-android-fallback-independent/local-raw/full-current`; точные checksums каждого файла в `local-raw-manifest.json`. Старые53ab evidence и bootstrap failure сохранены отдельно и не названы текущим PASS. `agent:check` вывел Agent setup OK; `git diff --check` по собственным QA-папкам без замечаний.

## Долговременная локальная копия

Тяжёлые артефакты дополнительно сохранены вне Git: `infra/local/qa-20261101/android-fallback/full-current`; игнорирование подтверждено `.gitignore:62` через `git check-ignore` до копирования. Все478 файлов (59 287 338 bytes) побайтно совпали с исходным `/tmp`; treeSHA256 `78bed748dee2ab4a97813566179467914955b829da0ea52a7883732a5f7bdf9c`. Каталоги имеют0700, файлы0600. `local-raw-manifest.json` и `storage-verification.json` рядом; публичная проверка хранения — `durable-local-storage.json`. Ключи/секреты не копировались, оригиналы `/tmp` и прежние user-artifacts сохранены. Приложения и тесты при хранении не запускались.
