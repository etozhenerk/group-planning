# Инициализация iOS · задача 6.1

20 октября 2026 года. Создан SwiftUI target `Somewhere`, общая схема,
конфигурации Debug/Release и assets двух цветов из общей основы дизайна.
Внешних Swift-пакетов и генератора проекта нет. Инициализация затронула
только iOS, его CI и документы; Go, web и Android не менялись.

## Проверенное окружение

- Xcode 26.0.1 (17A400), Swift 6.2, swift-format 6.2.0.
- SDK iOS Simulator 26.0; deployment target 17.0, Swift 6 и complete concurrency.
- Сборка без подписи и аккаунта Apple Developer, generic iOS Simulator.
- Окно iPhone 17 / runtime iOS 26.0 (26.0.1) открыто по просьбе пользователя.

## Результаты

- `plutil -lint` проверил project.pbxproj; `xcodebuild -list` нашёл target
  и общую схему Somewhere, обе конфигурации.
- `sh scripts/format.sh --check` прошёл со строгим lint без записи.
- `sh scripts/build.sh` и `sh scripts/build.sh Release`: CLEAN, BUILD и
  ANALYZE SUCCEEDED. Компиляция выполнялась с warnings-as-errors.
- Info.plist содержит MinimumOSVersion 17.0; vtool подтверждает minos 17.0,
  SDK 26.0 и платформу IOSSIMULATOR для arm64 и x86_64.
- Release-приложение установлено и запущено через simctl на iPhone 17.
  [Снимок стартового экрана](assets/ios-bootstrap/iphone17.png) проверен визуально.
- Shell-скрипты проходят `sh -n`; YAML отдельного iOS workflow разбирается.
  CI использует macos-15 и закреплённый Xcode, те же lint/clean build/analyze.
- `npm run agent:check` и строгая валидация OpenSpec проходят.

В логах есть штатное предупреждение SDK: metadata extraction пропущен,
поскольку приложение не использует AppIntents. Сборка и анализ успешны.

## Границы проверки

Это основа приложения с названием Somewhere, без онбординга, API, сессии,
встреч и чата. Их реализация и тестовые targets относятся к задачам 6.2–6.7.
Отдельный runtime iOS 17, реальное устройство, подпись и публикация не проверены.
Успешная локальная сборка не означает проверенный пользовательский сценарий
или наблюдённый успешный запуск GitHub Actions.
