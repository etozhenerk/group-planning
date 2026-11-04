# Спецификация тестирования

## Объём и источники

Следующий мобильный редизайн: iOS, Android, mobile web. Desktop — контроль отсутствия регрессии; backend/API сохраняется, новых серверных операций нет. Нормативные источники: specs/product-onboarding, specs/mobile-interface и действующие доменные specs активных изменений. Макеты/состояния — ux.md и approved-designs.json. Незавершённый flow-r1 исключён. Публикация кейсов и структурная проверка плана не подтверждают работу приложений.

## Риски и уровни проверки

| Риск | Минимальный достоверный уровень |
| --- | --- |
| Trim/пределы, role/date/голоса | unit для правил/переходов; прежние доменные assertions сохраняются |
| avatar_url теряется между API/session/cache/UI, утечка контактов | integration mapping/публичных проекций/смены аккаунта; немного UI для фото/fallback |
| Совместимость старых клиентов, idempotency/revision/unknown | API/клиентские integration, memory.Store/мок; без БД/Docker |
| Outbox/media/export, повтор/отмена/частичность, чтение | текущие unit/integration и реальный клиентский проход; не подмена fixture |
| Панели/IME/safe area, sticky только при scroll, фокус/доступность | работающий UI каждого клиента + независимый design-review |
| Жесты галереи, история/deep links, потеря черновика | небольшие E2E ключевых путей и ручная приёмка агентом |
| Общий CSS/токены меняют desktop | web границы/routing и визуальная baseline-регрессия |

При автоматизации не размножать все комбинации в UI E2E. Каталог содержит приёмочные сценарии; количество таких cases не задаёт квот пирамиды. Существующие test refs/статусы не превращаются автоматически в стабильное покрытие нового дизайна: 2.13 проверяет assertions/runner/health до кода.

## Кейсы и mapping

Точный список каждого task/case/platform — [testing-manifest.json](testing-manifest.json). Все 94 task ID классифицированы: 58 продуктовых задач (29 реализаций и 29 независимых приёмок), 36 обоснованных исключений для решений/публикации/планирования/отдельного release gate. Платформенный scope каждого case фильтруется по каталогу; backend-only правило не навязывается клиенту.

| Пакет | Код → независимая приёмка | Источники cases |
| --- | --- | --- |
| Запуск | 3.1/3.2 → 3.6/3.7 | TC-MOBILE-LAUNCH-COLD/RESUME/REDUCED |
| Знакомство/вход | 3.3/3.4/3.5 → 3.8/3.9/3.10 | mobile-mvp-entry + TC-MOBILE-WEB-SCOPE |
| Общая основа | 6.1–6.3 → 6.4–6.6 | mobile-interface: nav/sheet/short/required/error/avatar/web-scope; sheet-stability |
| Встречи | 7.1–7.3 → 7.4–7.6 | personal-meetings + новые list-calendar/maybe/nav/avatar |
| Создание/приглашение | 8.1–8.3 → 8.4–8.6 | meeting-creation, invitation-rsvp, entry-invitation, required/error/sheet |
| Чат/сведения/настройки | 9.1–9.3 → 9.4–9.6 | chat-composition/reactions/read-state/security/sync, meeting-media, настройки/event-feed, новые chat/avatar/error/required |
| Дата/место/подготовка | 10.1–10.3 → 10.4–10.6 | date-poll из event-feed, place-change-polls, preparation-tasks, required/error/nav |
| Вайб | 11.1–11.3 → 11.4–11.6 | meeting-memories, vibe-album-download, новые gesture/stability/short/avatar |
| Аккаунт/сервис | 12.1–12.3 → 12.4–12.6 | user-profile/support-feedback/service-information/web-release-identity + новые profile/support-section/about/doc |
| Сквозные пути | 13.1–13.3 → 13.4–13.6 | небольшой интеграционный набор nav/entry/list/maybe/feed/vibe/docs/support |

Manifest использует 327 уникальных существующих и новых cases, без повторных executions ради двух task ID: код и его QA ссылаются на один текущий платформенный plan/run. Пересечения пакетов — требования общей поверхности, а не отдельные дублированные кейсы.

Добавлены 18 UI-cases в testing/cases/mobile-interface.yaml; status manual/unknown на заявленных клиентах. Прежний стабильный TC-PROFILE-YANDEX-FIELDS пересмотрен по новому требованию: силуэт вместо инициалов, отсутствующие личные поля — «Не указан». Сохранены ID и исходный planned/unknown без test refs; прежний YAML/hash — planning-history/user-profile-before-mobile-redesign.*. Другие кейсы профиля с неотносящимся к ним упоминанием инициалов получили явную fixture с фото, их проверяемое поведение не изменялось. Автоматизация остальных кейсов не изменялась. Смена source/hash не является pass.

Девять TC-MAP кейсов и задачи 5.1–5.8 перенесены в meeting-place-picker по прямому решению пользователя. Их ID/шаги/ожидания/automation сохранены, изменён только путь источника. Текущий UI-пакет их не исполняет и не выдаёт pass.

## Окружения и данные

- Web: Chromium и WebKit, mobile 320/390/739, desktop 740/1100/1440; действующая landscape/coarse-pointer ветка, keyboard/pointer/touch/trackpad, zoom/крупный текст/Reduce Motion. Desktop screenshots сравниваются с baseline до редизайна.
- iOS/Android: конкретные simulator/emulator и поддерживаемые OS из локальных AGENTS.md, маленький экран/крупный текст, VoiceOver/TalkBack, safe area/IME/системный Back, cold/resume, Reduce Motion. Системные save/permission проверяются реальным клиентским механизмом; недоступный device-only путь — blocked с причиной.
- Backend: memory.Store и мок очереди, старые/новые DTO, права/revision/idempotency. Не поднимать БД/Docker для этого этапа.
- Fixtures: минимум организатор/участник/Maybe/посторонний; фото/без фото/broken URL; 20 встреч в день, 30 участников, длинные имена/названия, пустые/длинные формы, до 20 вариантов даты; файл/частичный upload/export; timezone/DST, offline/timeout/unknown/conflict/revoke/смена аккаунта.

В планах фиксируются точные SHA/версия/build/API, устройства, роль/данные, locale/timezone/время. Выполняется cleanup только собственных тестовых данных. Скриншоты макетов не используются как подтверждение поведения.

## Независимая приёмка и закрытие

1. После разрешённой реализации и стабилизации кандидата 13 создать новые qa/final/{web,ios,android}/plan.json и run.json официальным qa:plan. Сейчас эти пути — назначение будущих результатов, файлы/pass не подделываются.
2. План платформы содержит объединение всех её mapped cases, применимые окружения и обязательные suites. Все cases/окружения сохраняются в плане; scope отдельной задачи выводится из manifest, не из выборки удачных checks.
3. Независимый feature-test на работающем клиенте/API: предусловия → действия → actual/evidence → повторное чтение/другой аккаунт при необходимости. Manual требует interaction log; UI также screenshot; suite — raw log. Partial/manual/flaky не пропускаются из-за зелёной сборки.
4. Независимый design-review: каждый объявленный экран/state/viewport, реальные взаимодействия, геометрия/motion/доступность. design:ready по опубликованному manifest обязателен. Screenshot-only, старая версия и непроверенная платформа не дают pass.
5. Исполнитель устраняет дефекты, обновляет требования/кейсы при изменении поведения, проходит revisions/publish при изменении UI и запускает новый независимый проход. Старое evidence/hash сохраняется. qa:ready scoped по manifest + design:ready — до кодового и приёмочного checkbox.
6. Последующий пакет, общий token или catalog/source change может инвалидировать прежний pass: переоткрыть затронутые задачи, зафиксировать новый план/hash и выполнить применимую приёмку заново. Для этого план предусматривает общий frozen-кандидат платформы. Нет устройства/сервиса — blocked, не молчаливое исключение.

Release-test в 4.2 выполняется только при поручении выпуска: все применимые текущие cases, обязательные suites, финальные юридические/операционные условия и qa:release-ready/receipt точных кандидатов. TC-INFO-PUBLIC-POLICY-RELEASE не требуется для UI-фичи с явно черновыми документами, но остаётся в каталоге и полном release scope. Этот feature manifest не выдаёт разрешение на публикацию.

## Проверки текущего планирования

agent:check, openspec validate --strict, qa:check, qa:test, schema/task mapping, hash принятых входов и git diff --check. Фактические результаты — [verification.md](verification.md). Реализация разрешена пользователем; functional/design/release pass новой композиции сейчас отсутствуют.

## Ограничение текущего прохода

04.11.2026 пользователь отдельно исключил VoiceOver из текущей проверки.
Озвучивание VoiceOver не запускать и не засчитывать. Связанные непроверенные
кейсы остаются открытыми; семантические имена, крупный текст и Reduce Motion
проверяются отдельно и не заменяют проход с VoiceOver.
