# Независимая приёмка web · подготовка

Исполнитель проверки: `independent-web-reviewer:/root/backend_release_finish`.
Этот агент не писал web-код. План и инвентарь не являются результатом приёмки.
Приложение, эталоны, specs, каталог и ожидания тестов reviewer не изменяет.

## Кандидат и начало

Финальная фиксация ожидает исправления найденной исполнителем композиции
собственного bubble после web 4.5. Hash промежуточного MAIN не используется для
pass. После интеграции последней правки повторить `design:check`, сохранить
`design:context` обоих manifests и точный source/fixture fingerprint, затем
собрать отдельный preview. При изменении inputs остановить старую приёмку,
сохранить её evidence и повторить затронутые проверки с новым hash.

Окружение CUA при первой инвентаризации недоступно: Mac заблокирован,
автоматическая разблокировка не удалась; apps/browsers пусты. Основной агент
уже передал пользователю запрос ручной разблокировки. До восстановления доступа
ни один live-сценарий не получает pass. Сертификатные предупреждения не обходятся.

С исполнителем web согласуется отдельный loopback preview/API fixture:
порт 8458 занят его полным прогоном, пользовательский 8445 не затрагивается.
Основа — `frontend/web/scripts/browser-server.ts`, Go TestBrowserFixture,
тестовый provider Саша/Лена и design seed по существующему harness. Флаги
chat sync/read/realtime, версия dist и API записываются в environment перед
началом. Чужие fixtures, браузерные профили и данные не сбрасываются.

## Дизайн

Точная подготовительная матрица находится в `design-scope.json`:

| Manifest DS 2.5.1 | Web-экраны | Состояния |
| --- | ---: | ---: |
| meeting-experience-refresh | 78 | 818 |
| chat-reliability-and-sync | 4 | 56 |
| Всего | 82 | 874 |

Проверяются viewport 320×760, 390×844, 768×1000, 1440×1000; низкий
390×430 и landscape 844×390 для emoji/reactions, 1280 для outbox/read.
Физический Safari/IME не подменяется desktop WebKit/emulation: доступный
runtime и реальные ограничения фиксируются отдельно. Locale ru-RU,
timezone Europe/Moscow, реальные шрифты и text scale заносятся в capture.

Порядок живых групп, на каждой применимой ширине:

1. Список: будни/выходные, много участников, длинный заголовок, без обложки,
   крупный текст, переход в чат и возврат; отсутствие вложенного tabbar.
2. Все действия плюса: меню и его вход/выход, формы даты/места/задачи,
   фото/файл; desktop dialog и mobile sheet над тем же чатом. Открытие,
   клавиатура, ошибки/повтор, pending повтор, close/reopen, отозванный доступ,
   крупный текст, reduced motion, черновик/scroll/focus. Для даты дополнительно
   два разных варианта/третий/удаление, пять настроек, deadline без weekday,
   равная высота полей и адаптивный перенос.
3. Info/Share/settings/task: роли организатора и участника, правильный состав,
   раскрытие/сворачивание, копирование ссылки, реальная обложка/удаление,
   подтверждения и статусы задач, одна поверхность, возврат к исходной панели
   и чату без потери черновика/якоря. На низком экране сохранение доступно.
4. Emoji: вставка по caret/selection, повторная вставка, русский поиск,
   пустой поиск, категории/recent, grapheme delete, клавиатура, Escape/opener,
   IME, composer/Send при низкой высоте, один dock, smile24 и пустой caret,
   анимация/быстрый reopen/reduced motion.
5. Реакции: context/keyboard/long press, quick/full привязка к bubble,
   поиск/recent, add/remove/multiple own, ошибки/повтор, selected/pressed,
   отмена hold при scroll, отсутствие постоянных кнопок. People по hold чипа
   с emoji filter, tap toggle, выбор объявлен, фокус/черновик/scroll сохранены.
6. Outbox: queued/uncertain/rejected/accepted в одной строке, локальная ошибка
   сохранения, reload, logout в двух вкладках, длинный текст и reduced motion.
7. Read/window: badge zero/unread, фиксированный divider, новый хвост,
   boundary loading/error/retry; readers loading/ready/empty/error/pagination,
   context-zero и menu exit → readers, close/focus/anchor, keyboard/large text/
   reduced motion/access revoked. Прочтение не продвигается под модальностью.

Нумерованный порядок групп не сокращает матрицу: для каждого screen/state
из JSON требуется наблюдение. Общий пользовательский проход может дать
evidence нескольким состояниям, только если их действия действительно выполнены.
Для pass сохраняются actual и независимый reference снимки, interaction log,
sourceHash/fixtureHash/runtime/OS/viewport/fonts/locale/timezone/textScale и SHA256.
Rejected extended-draft и исторические raw не являются эталонами; приоритет —
authority.json, актуальные contracts и указанная в manifest revision.

После проверки: отдельные reports для обоих manifests, `design:inspect-report`,
затем `design:ready --platform web`. Needs-fixes направляются исполнителю;
ожидания, пороги, эталоны и UI reviewer не исправляет.

## Функциональность и выпуск

Полный подготовительный каталог — `case-scope.json`, краткий индекс —
`case-index.txt`: 280 active web cases, два release profile, всего 560
case/profile результатов. Это не выборка только изменённого чата. Включены
onboarding/auth, profile/account, встречи/календарь/приглашения, создание,
лента/опросы/задачи/вложения/воспоминания, поддержка/документы, chat composition,
reactions, persistence/sync/security/read/window, web release identity.

До архива design preview разрешён, но не выдаёт release receipt. После
design-ready основной агент собирает неизменяемый архив. Reviewer получает
artifact directory, manifest SHA256, файлы и URL exact-archive fixture,
проверяет их и создаёт настоящий `qa:plan --purpose release --component web`
с environment web-desktop и web-mobile. В plan фиксируются текущие catalog/
source hashes; подготовительный JSON не подменяет plan.json или run.json.

Обязательные source runners: web-check, web-e2e, web-chat-e2e,
web-window-e2e, web-read-e2e. Их успешные запуски сохраняются как suite evidence;
они не отменяют ручное воспроизведение полного каталога на точном архиве.
Неавтоматизированные/partial/flaky кейсы также проходят агентом. Реальные
действия UI выполняются CUA; API допустим для контролируемой fixture и
наблюдения серверного результата, но не вместо заявленного UI-действия.

Сетевые ошибки/задержки, два аккаунта/вкладки, большие истории и потеря доступа
подготавливаются только в отдельном тестовом fixture. Очистка — собственные
тестовые встречи/аккаунты и собственный процесс. Production, магазины,
пользовательское демо и native приложения не затрагиваются.

Каждый case/profile получает actual result/evidence либо конкретный blocker.
Нет доступа/точного артефакта/нужного runtime — blocked, а не pass. После полного
прохода `qa:release-ready` создаёт receipt; receipt вручную не редактируется.
Перед передачей отчётов — `agent:check`, `git diff --check` и сверка отсутствия
изменений вне evidence/report файлов reviewer.
