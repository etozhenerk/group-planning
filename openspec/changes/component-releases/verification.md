# Проверка релизов — 25.10.2026

Реализация по schema spec-driven. Проверки приложений выполнены во временной
копии коммита `25a9059` плюс собственные release-изменения. Незакоммиченная
функциональность соседнего агента не включалась и не исправлялась. Секреты,
настоящие release tags, публикации GitHub Release и загрузки в магазины не создавались.

## Выполнено

- Python release tests: 8 сценариев — теги/ancestry/dirty checkout, неполный набор,
  подмена hashes/manifest, лишние файлы, отсутствие подписей, повторный release,
  отсутствие пароля из argv в ошибке. CI reporter: 10 тестов. Routing: 31 тест.
- actionlint 1.7.12 без ошибок. `npm run agent:check`, строгая валидация двух
  изменений OpenSpec и `git diff --check` прошли.
- Полный `scripts/release/build.py` выполнен для backend и monitoring на
  временных тегах изолированной тестовой Git-копии: проверки, упаковка,
  manifest/SHA256SUMS, повторная проверка целостности. В настоящем Git тегов нет.
- Backend: format/vet/race, API contract и сборка Linux amd64 архива.
  Web: production tar, TypeScript/ESLint/styles/FSD/Prettier и 56 Vitest-тестов
  (17 файлов). Локальный Playwright повторно не запускался: UI не менялся;
  release workflow содержит обязательный Playwright для web.
- Android: точный JDK 17 / API 36 / build-tools 36.0.0, ktlint, Debug/Release,
  Lint Debug/Release, QA и instrumentation APK. Подписанные AAB/APK/mapping
  получены через настоящий `android.build` с **одноразовым тестовым ключом**;
  apksigner/jarsigner/keytool подтверждают подпись. Debug и Release: по 94 unit
  теста, без ошибок/пропусков. Тестовый ключ удалён; пакеты не для магазина.
- iOS: точный Xcode 27.1 (27A9275), swift-format, clean Release simulator build
  и analyze, unsigned generic iOS archive. В архиве проверены bundle ID,
  версия `1.2.3`, build `42`, тестовый HTTPS origin, наличие Somewhere.app.dSYM.
  Симуляторы не создавались/не перезапускались; локальные unit/UI не повторялись.
- Бот/HTTPS-probe: [отдельный отчёт](../telegram-monitoring-bot/verification.md).
  Конечный source ZIP собран на основной и изолированной копии с одинаковым
  SHA-256 `443f2ccb8b1123b2da872f527427d5d2a6a999acbd906cac7cc02ad1daae2e1e`.

## Что остаётся внешней проверкой

- Настоящие Android signing secrets, Apple Distribution P12 + profile/team,
  production HTTPS origin. На компьютере нет действующей codesigning identity;
  владелец не подтвердил существование Android keystore.
- iOS distribution archive/export IPA, работа временного keychain с настоящим
  сертификатом и live cleanup после ошибок подписи. Отсутствие ключей проверено
  отрицательным тестом, но это не эквивалент подписанной сборке.
- Первый реальный tagged запуск GitHub Actions, загрузка draft/assets/publish,
  включая доступность runner Xcode и права token. YAML/локальная упаковка не
  подменяют эту проверку. Тестовые номера/версии не предложены для первого релиза.
- Бот: реальный token/Lockbox/chat, IAM и доставка; probe: домен, HTTPS, /readyz,
  timer, write IAM, алерты свежести и независимый канал отказа функции.
- Production deployment API требует постоянного адаптера хранилища. Подключённый
  PostgreSQL ещё не означает, что API перестал использовать memory.Store.

Проверки не подтверждают готовность пользовательских функций, магазинов и облачного
деплоя. Эти действия остаются отдельными задачами, а не скрытым продолжением CI.
