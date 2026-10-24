# Подготовка окружения · 24.10.2026

## Контекст

Проверка нового окружения macOS 27.0.1 / Apple Silicon начата на `main`,
коммит `c293d47`. После `git fetch origin` локальная ветка совпадала с удалённой,
рабочее дерево было чистым. Активно изменение `gathering-activity-feed`:
63 из 103 задач отмечены выполненными. Подготовка окружения не закрывает
оставшиеся продуктовые задачи.

## Установленные инструменты

- nvm 0.40.7 и Node.js 22.22.3; общий набор npm-пакетов установлен через `npm ci`.
- Go 1.27.2 и инструменты из `backend/tools/go.mod`.
- Playwright Chromium 1248, Chrome Headless Shell и FFmpeg.
- Temurin JDK 17.0.21+9, Gradle 8.14.3 через wrapper.
- Android command-line tools 22.0, SDK Platform 36 revision 2,
  Build Tools 36.0.0 и platform-tools 37.0.1; SDK Manager распознаёт пакеты.
- Android Emulator 37.2.12 и образ Google Play arm64 API 37.0 revision 8.
  Использован существующий AVD `Pixel_10a`, без создания или сброса устройств.
- Xcode 27.1 и runtime iOS 27.0; существующий iPhone 18 Pro загрузился.
  Также установлен runtime iOS 27.1, но тестовые скрипты используют 27.0.

Node.js, Go, JDK и Android CLI установлены в пользовательские каталоги.
Пути сохранены в `~/.zprofile`, nvm также подключён в `~/.zshrc`.
Для Android Studio локальные `local.properties`, `.gradle/config.properties`
и `.idea/gradle.xml` задают SDK и JDK 17; эти файлы игнорируются Git.
Архивы проверены по контрольным суммам официальных каталогов. Для зависавших
загрузок Go и Android использованы диапазоны байтов по HTTPS с последующей
проверкой целого архива, без изменения состава и версий зависимостей.

## Обновление iOS

Пользователь согласовал переход с Xcode 26.0.1 на установленный Xcode 27.1
и завершил его первый запуск. Закреплены build 27A9275, Swift 6.4 и SDK
`iphonesimulator27.1`; minimum deployment target остаётся iOS 17.
Встроенный swift-format сообщает версию `main`, поэтому проверяется вместе
с точной сборкой Xcode. Прикладные Swift-исходники не менялись.

Для тестов выбран runtime iOS 27.0, доступный на официальном
[preview-образе GitHub Actions](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md).
Workflow использует `xcode-27` и явно выбирает Xcode 27.1. Метка зарегистрирована
в конфигурации actionlint 1.7.12, который ещё не включает её в свой список.
Это GitHub-hosted образ; настройка линтера не требует self-hosted runner.

## Выполненные проверки

- `npm run agent:check`: структура OpenSpec, инструкции и ссылки проходят.
- `npm run web:check`: типы, линтеры, FSD, оформление; 54 теста в 17 файлах.
- `npm run web:build`: production-сборка проходит.
- `npm run web:test:e2e`: 49 сценариев проходят, один совместный сценарий
  web/iOS/Android штатно пропущен без внешнего мобильного стенда.
- `go test -race ./...`, `go vet ./...`, `go build ./...`, проверка границ
  модулей и `sh scripts/format.sh --check` проходят.
- Собранный Go-сервер запущен на локальном порту: `/healthz` возвращает
  HTTP 200 и `{"status":"ok"}`; остановка через SIGTERM завершается с кодом 0.
- `npm run api:test`: 39 схем, 19 fixtures и 178 настоящих HTTP-ответов.
- iOS: проверка toolchain, swift-format, чистые Debug/Release build/analyze
  и `build-for-testing` обеих схем `Somewhere` и `SomewhereUI` проходят.
- iOS: `sh scripts/test-ui.sh startup` проходит на iPhone 18 Pro / iOS 27.0
  с настоящим Go API; проверены загрузка и возврат в приложение. Обычная сборка
  отдельно установлена и запущена, экран онбординга проверен снимком симулятора.
- Android: проверка toolchain и ktlint, сборки Debug/Release, Android Lint
  для обеих сборок, Debug instrumentation APK и отдельные QA/QA instrumentation
  APK проходят. Debug-приложение установлено и запущено на `Pixel_10a`.
- Android: `sh scripts/test-device.sh` проходит на `Pixel_10a` / API 37.0:
  все 7 instrumentation-тестов настоящего Android Keystore завершились успешно.
- actionlint 1.7.12, 26 тестов маршрутизации CI, 10 Python-тестов отчётов
  и синтаксическая проверка shell-скрипта симулятора проходят.

## Выявленные ограничения

- iOS: 76 из 77 unit-тестов прошли на iPhone 18 Pro / iOS 27.0.
  `ContractTests.allSharedFixturesDecode` падает при чтении `starts_at: null`:
  модель создания встречи ещё требует строку с датой и временем.
- Android: 77 из 78 JVM-тестов прошли. `ContractTests.allSharedFixturesDecode`
  ожидает 16 общих примеров, тогда как контракт уже содержит 19. Простая замена
  числа не исправляет поддержку новых данных: `CreateMeeting` требует
  ненулевой `startsAt`, а декодер `DatePoll` ещё не реализован.
- Эти расхождения относятся к открытым задачам 10.4–10.5, а не к отсутствующим
  зависимостям. Тесты и прикладные модели при подготовке окружения не менялись;
  полные мобильные проверки остаются красными до реализации этих задач.
- Реальный Яндекс ID, постоянное хранение и облако остаются отложенными по плану.
  Полные мобильные UI-сценарии и запуск на минимальной поддерживаемой iOS 17
  в этой проверке не выполнялись. Новый workflow GitHub Actions пока не запускался.

## Точка продолжения разработки

Сервер опросов даты (10.2) реализован. Веб (10.3) содержит рабочую реализацию
и последние исправления диалогов, но остаётся открытым до проверки ошибок,
потери доступа и переходов времени. UX граничных состояний (10.1) также открыт.
Следом идут опросы даты в iOS и Android (10.4–10.5), затем отдельный этап
приглашений с ответом «Возможно». Полный статус — в [tasks.md](tasks.md),
последний продуктовый отчёт — [date-poll-web-verification.md](date-poll-web-verification.md).
