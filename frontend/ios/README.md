# Somewhere для iOS

Инициализировано SwiftUI-приложение с общей схемой `Somewhere` и минимальной
версией iOS 17. Пока оно показывает название на графитовом фоне.
API, вход, встречи и чат подключаются в задачах 6.2–6.7; это ещё не рабочий
мобильный сценарий. Сторонних Swift-пакетов нет.

## Окружение

- macOS с Xcode **26.0.1**, build **17A400**.
- Компилятор **Swift 6.2**, языковой режим **Swift 6** и complete concurrency checks.
- **swift-format 6.2.0** из Xcode, отдельная установка не требуется.
- Сборочный SDK — **iOS Simulator 26.0**, deployment target — **17.0**.
- Схема и target — **Somewhere**, bundle ID — `dev.groupplanning.ios`.

Xcode закреплён в `.xcode-version`, остальные инструменты — в
`Config/toolchain.env`. Swift-режим, deployment target, warnings-as-errors
и параметры приложения задаются `.xcconfig`, отдельно для Debug и Release.
Несовпадение инструмента останавливает проверку с понятной ошибкой.

Если Xcode не выбран по умолчанию, задай его только для нужной команды:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer sh scripts/check-toolchain.sh
```

В CI используется `macos-15` с `/Applications/Xcode_26.0.1.app` из
[официального набора runner-images](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md).
Обновлять инструменты следует отдельным изменением вместе с локальной проверкой.
Поддержку SDK и deployment target описывает [Apple](https://developer.apple.com/xcode/system-requirements).

## Проверки и запуск

Из `frontend/ios`:

```sh
sh scripts/check-toolchain.sh
sh scripts/format.sh --check
sh scripts/build.sh
sh scripts/build.sh Release
```

`format.sh --check` запускает строгий lint без записи; `--write` применяет
[swift-format](https://github.com/swiftlang/swift-format) с конфигурацией проекта:
4 пробела, строка до 100 символов, не больше одной пустой строки подряд.
`build.sh` выполняет clean/build/analyze с отключённой подписью на
`generic/platform=iOS Simulator`; Apple Developer account и секреты не нужны.
Результаты находятся в игнорируемом `.build/DerivedData`.

[Результаты и снимок запущенного приложения](../../openspec/changes/gathering-activity-feed/ios-bootstrap-verification.md).

Открой `Somewhere.xcodeproj`, выбери схему `Somewhere` и доступный iPhone
с iOS 17 или новее, затем Run. Локально доступен iPhone 17 / iOS 26.0.
Сборка для симулятора не проверяет публикацию и подпись на реальном устройстве.
Минимум 17 закреплён в бинарнике; отдельный запуск на iOS 17 ещё не проверен.

В [CI](../../.github/workflows/ios.yaml) те же lint, чистая сборка и анализ
запускаются при изменениях iOS. Тестовых targets пока нет: проверки сетевых
моделей и сессии добавляются вместе с реализацией 6.2, UI — вместе с экранами.

## Структура

`Somewhere/App` содержит точку входа и корневое представление.
`Somewhere/Resources` содержит assets; цвета соответствуют общей
[основе дизайна](../../docs/design/foundations.md).
Xcode автоматически включает файлы внутри синхронизированной группы `Somewhere`;
генератор проекта и CocoaPods не нужны.

Далее небольшие представления, владельцы состояния и адаптеры добавляются
по ответственности. API и Keychain не создаются внутри SwiftUI View.
Общие правила и будущие платформенные проверки — в [AGENTS.md](AGENTS.md).
