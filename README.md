# group-planning

**somewhere** — сервис для встреч и поездок с друзьями. Организатор создаёт
план и делится приглашением; участники договариваются о деталях в общей ленте.
`group-planning` — техническое имя монорепозитория.

## Приложения

| Приложение | Стек | Запуск и проверки | Правила кода |
| --- | --- | --- | --- |
| Сервер | Go, HTTP/JSON | [backend](backend/README.md) | [Go](backend/AGENTS.md) |
| Веб | React, TypeScript, FSD | [web](frontend/web/README.md) | [React / TS](frontend/web/AGENTS.md) |
| iOS | Swift, SwiftUI | [iOS](frontend/ios/README.md) | [Swift](frontend/ios/AGENTS.md) |
| Android | Kotlin, Jetpack Compose | [Android](frontend/android/README.md) | [Kotlin](frontend/android/AGENTS.md) |

У приложений отдельные сборки. Клиенты реализуют интерфейс в собственном коде
и работают с общим [API-контрактом](contracts/openapi.yaml). Принципы взаимодействия
описаны в [архитектурном решении](docs/architecture/0002-client-ui.md).

## Подготовка окружения

Для веба и инструментов разработки нужен Node.js из [.nvmrc](.nvmrc).
Из корня репозитория:

```sh
nvm use
npm ci
npm run agent:check
```

Пакеты устанавливаются по общему lock-файлу. Версии Go, Xcode, JDK и Android SDK,
настройки сервера и команды запуска приведены в README соответствующих приложений.

## Структура репозитория

```text
backend/             Сервер
frontend/web/        Веб-клиент
frontend/ios/        Приложение iOS
frontend/android/    Приложение Android
contracts/           OpenAPI и общие примеры данных
docs/                Продукт, архитектура, дизайн и правила разработки
openspec/specs/      Спецификации продукта
openspec/changes/    Проектирование, задачи и отчёты изменений
.agents/skills/      Навыки агента
scripts/             Инструменты репозитория
.github/workflows/   CI
```

## Работа над изменениями

Открой корень репозитория и прочитай [AGENTS.md](AGENTS.md). Разработка проходит
через OpenSpec: проработка сценария → дизайн → техническое решение → задачи
→ код → проверка. Подробности — в [процессе разработки](docs/workflow.md).

| Команда из корня | Назначение |
| --- | --- |
| `npm run agent:check` | Проверка инструкций, ссылок и структуры OpenSpec |
| `npm run --silent openspec -- list --json` | Изменения и их задачи |
| `npm run api:test` | Проверка контракта на HTTP-ответах сервера |
| `npm run web:check` | Типы, оформление, архитектура и тесты веба |
| `npm run web:build` | Сборка веба |

## Документация

- [Продукт и основные сценарии](docs/product/overview.md)
- [Архитектурные решения](docs/architecture/decisions.md)
- [Дизайн и правила соответствия макетам](docs/design/README.md)
- [Соглашения кода и проверки](docs/development.md)
- [Работа с агентом и OpenSpec](docs/workflow.md)
