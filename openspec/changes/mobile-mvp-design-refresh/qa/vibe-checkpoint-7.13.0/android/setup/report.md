# Подготовка Android Vibe7.13

Статус: **prepared / awaiting frozen candidate**, runtime verdict отсутствует.

Прочитаны project design-review/feature-test, актуальные approved/UX/manifest и memories/album contracts/cases, изучены прежние instrumentation/fixture helpers. Подготовлены guarded source/APK preflight, test-only temp builder, короткий QA driver и команды/limits в README.

Проверены только синтаксис JS (`node --check`) и shell (`sh -n`); Kotlin намеренно не собирался до freeze. ADB, эмулятор, fixture API и приложение не запускались; устройство свободно. Product/эталоны/tasks/Git не менялись.

Необходимы exact candidate/APK/hash/source и совместимый binary/provenance + подтверждение свободного5554. Детали/точные команды — README. Дальнейшие account-service/final требуют отдельного актуального handoff, этот setup не выдаёт им pass.
