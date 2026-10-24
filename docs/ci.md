# Проверки в GitHub Actions

У каждого приложения свой workflow: [Web](../.github/workflows/web.yaml),
[Backend](../.github/workflows/backend.yaml), [iOS](../.github/workflows/ios.yaml)
и [Android](../.github/workflows/android.yaml). Они запускаются при push в `main`,
при изменениях pull request и вручную через **Actions → workflow → Run workflow**.

## Какие изменения запускают проверки

| Изменение | Автоматические проверки |
| --- | --- |
| `frontend/web/**` | Web |
| `frontend/ios/**` | iOS |
| `frontend/android/**` | Android |
| `backend/**` | Backend и Contracts |
| `contracts/openapi.yaml` и настройки контракта | Contracts |
| `contracts/fixtures/**` | Contracts, iOS и Android: их тесты читают эти fixtures |
| Корневые `package.json`, `package-lock.json`, `.nvmrc` | Web, Contracts, Repository: они используют эти зависимости |
| Документы, OpenSpec, инструкции и инструменты репозитория | Repository |
| Workflow платформы | Эта платформа и проверка конфигурации Repository |
| Общий код CI-отчётов | Все использующие его workflows |

Изменение исходников iOS не запускает Web, Android или Backend. Изменение Go
не запускает клиентские чекеры: совместимость HTTP-ответов проверяет отдельный
[Contracts](../.github/workflows/contracts.yaml). При смене поведения API нужно
также явно запустить интеграционные проверки затронутых клиентов; проверка
контракта не доказывает работоспособность всех экранов.

Таблица описывает основные входы. Локальные `AGENTS.md` и манифест веба дополнительно
проверяет [Repository](../.github/workflows/repository.yaml). Точные фильтры находятся
в `on.push.paths` и `on.pull_request.paths` каждого workflow. При смешанной правке
запускаются все затронутые области. Ручной запуск не ограничивается путями.

## Этапы платформы

У каждой платформы отдельные jobs **Build**, **Checkers**, **Tests** и **Run summary**.
Первые три выполняются независимо: ошибка оформления не отменяет сборку и тесты.
Внутри чекеров форматирование, типы, архитектура и статический анализ имеют
собственные шаги. После ошибки одного чекера остальные продолжаются, если
окружение подготовлено и запуск не отменён. Ошибки не подавляются.

| Платформа | Сборка | Чекеры | Тесты |
| --- | --- | --- | --- |
| Web | Production bundle | TypeScript, ESLint, стили, FSD, Prettier | Vitest, затем Playwright с отдельным Go API |
| Backend | Go packages | gofumpt, whitespace, gofmt, границы зависимостей, go vet | Race detector и сценарий memory-хранилища |
| iOS | Чистые Debug и Release для симулятора | swift-format, Xcode analysis | Swift Testing и XCUITest последовательно |
| Android | Debug, Release, QA и test APK | Kotlin format, Android Lint Debug/Release | JVM unit tests |

Компиляция зависимостей может понадобиться и анализатору, и тестам. Это не заменяет
отдельный результат сборки. Независимые jobs имеют собственные runner и кеши.
На iOS только job тестов создаёт симулятор; unit и UI не запускаются одновременно.
Android CI собирает instrumentation APK, но не запускает эмулятор: device/UI-тесты
выполняются локальными командами из [инструкции Android](../frontend/android/README.md).

У Contracts отдельные OpenAPI checks и HTTP contract tests. У Repository —
проверка инструкций, ссылок, OpenSpec и actionlint, а также тесты фильтров и отчётов CI.
Этим workflows не нужна сборка приложения.

## Где смотреть результат

Открой нужный запуск в **Actions**. В графе видны независимые статусы этапов.
**Run summary** выполняется после всех этапов, включая упавшие, и публикует
таблицу результатов в **Summary**. Для ошибки показываются имя шага, код выхода,
строки диагностики и конец лога. Отчёт каждого этапа содержит результат и длительность
каждой команды. `skipped` и `cancelled` отображаются отдельно от успеха.

Полный вывод доступен в шагах Actions. Артефакты `logs-<workflow>-<stage>-<attempt>`
содержат Markdown-отчёт, результаты JSON и текстовые логи; хранение — семь дней,
до 2 MiB текста на команду. При ошибке подготовки окружения смотри соответствующий
шаг setup: его внутренний лог остаётся в Actions.

Большие iOS `.xcresult` по умолчанию не загружаются в артефакты. Если для диагностики
нужны снимки или вложения Xcode, запусти iOS вручную с `full_diagnostics`.
Текстовые отчёты публикуются и без этой опции. Принудительная отмена, потеря runner
или ошибка checkout могут помешать публикации; пропавший отчёт не означает успех.

## Стоимость и публичный репозиторий

Для публичного репозитория GitHub не тарифицирует минуты стандартных hosted
runners, включая Linux и macOS. Это не относится к larger runners. Лимиты и
стоимость хранения артефактов/кеша проверяются отдельно в Billing; облачные
ресурсы Yandex Cloud оплачиваются независимо от CI.

Исходный код, история, Actions-логи и опубликованные release-артефакты доступны
публично. Ключи, `.env`, Terraform state, подписи мобильных приложений и локальные
учётные данные остаются вне Git. Секреты выпуска передаются через GitHub Secrets;
release workflow не запускается от внешнего pull request.

Официальные правила: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

## Проверка изменений CI

Из корня, после `npm ci`:

```sh
npm run agent:check
node --test scripts/ci/routing.test.mjs
python3 -m unittest discover -s scripts/ci -p 'test_*.py' -v
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12
```

Тесты проверяют изоляцию платформ для push и pull request, сохранение ненулевого
кода выхода, сводки ошибок и пропусков и ограничение размера логов.
Локальные результаты инструментов отчёта находятся в игнорируемом `.ci-results/`.
Сами платформенные команды описаны в [правилах разработки](development.md).

Поведение GitHub описано в официальной документации:
[фильтры путей](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
[зависимости jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs),
[сводки шагов](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions).


## Релизы компонентов

[Component releases](../.github/workflows/releases.yaml) запускается только по
тегам пяти компонентов или вручную с существующим тегом. В нём последовательные
Validate → Build → Publish и общий Summary; это отдельный поток от независимых
платформенных проверок по путям. Подпись, состав файлов, Secrets и откат описаны
в [руководстве релизов](releases.md). Он не выполняет автоматический деплой.

[Telegram bot](../.github/workflows/telegram-bot.yaml) проверяет изменения
`infra/telegram-bot/**`: Go format/vet/race, сборку, runtime Go 1.23.12 и vendored ZIP.
Общие изменения `scripts/ci/**` запускают и этот workflow.
Дополнительная проверка релизной обвязки:

```sh
python3 -m unittest discover -s scripts/release -p 'test_*.py' -v
```
