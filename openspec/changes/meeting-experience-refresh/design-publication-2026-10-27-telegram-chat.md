# Публикация дизайна 1.3.0 · мобильный чат

## Решение и границы

27.10.2026 пользователь ответил «Подходит, переносим» на финальный интерактивный
прототип и предложение переноса на mobile web, iOS и Android. Ревизия
`2026-10-27-telegram-chat` — **APPROVED**, общая версия системы — **1.3.0**.
Она заменяет мобильные композиции emoji/reactions, людей, info/settings,
подробностей задачи и форм даты/места/задачи. Desktop-маршруты/sidebar и остальные
согласованные поверхности сохраняются. Предпросмотры вложений продолжают
использовать `2026-10-27-chat-sheets` и прежние полные требования.

Отказ от `extended-draft` и прежние проверки не переписаны. Прототип остаётся
макетом: его local-only операции, маленький emoji-каталог, фиктивные Share/обложка
и отсутствие настоящего IME не переносятся в приложения. Business/API, права,
подтверждения, drafts/idempotency, системные picker и все пять настроек даты
сохранены. Изменений backend/API эта публикация не требует.

## Зафиксированные исходники

Каталог: [2026-10-27-telegram-chat](assets/revisions/2026-10-27-telegram-chat/README.md).
Первоначально принятый набор сохранён в [историческом source-hashes.json](assets/revisions/2026-10-27-telegram-chat/history/1.4.0/source-hashes.json).
Его aggregate SHA-256:
`be9e0e9a8afa0da56ad2524438adcd0c1292a249e4338c4a330ac740d58be5f8`.

| Вход | SHA-256 |
| --- | --- |
| chat.html | c21b8aa602326e768143895d662515027c3dd18522e00e3a07eb4efacb241add |
| tokens.css | dc102920d047475b4e7af0ff267a87df934b66fa11252abcc46e5f68f0c29b0a |
| chat.css | 0277edf72f70e0977c402d0dca9c039d821fb40d927d4c28f00194cbb8f85825 |
| panels.css | 4e99e54ff89f70a95a084cb7e2a9382f94a77c91c991b883b299d7078f28fdb7 |
| generated/chat.js | d513cb237b74333bcab06d20bcc33243b4f2e04d70ba3a6a076707ba30ac1c6b |
| generated/workbench.js | d3ecc7f0b779c4582db3186654b3935af94a0d8f51cc33f1627787e6a9115caa |
| workbench.css | ef08392fb6bb52841254ae1c3bb10a4083b968402771432c743249912938e1a9 |

При исходной публикации 1.3.0 TS/HTML/CSS и generated bundle не изменялись. В README добавлено
одобрение; старый scope `draft prototype only; no application acceptance`
в source-hashes описывает момент capture и не переписан. Названия `--draft-*`
оставлены в просмотренном CSS для сохранения его hash. Нормативные роли теперь
в `design-system/tokens.json`, generated — только через `design:generate`.
Прежние `render/run01`…`run11`, проваленные проверки и последующие fixes сохранены.
Внешняя рамка scale/overflow:clip — средство просмотра, не часть продукта.

## Источник каждого состояния

Прямой URL — `chat.html?view=...`; поиск, selection, фильтры и переходы следует
воспроизвести действиями внутри единого чата, не отдельными статическими снимками.

| Поверхность | Старт / переход | Источник композиции |
| --- | --- | --- |
| Composer/док | chat → улыбка; `view=emoji` | chat.css `.composer/.emoji-*`; composer.ts, emoji-picker.ts |
| Quick/full reactions | явная кнопка m3 → «ещё»; `view=quick/reactions` | chat.css `.reaction-*`; reactions.ts |
| Люди | кнопка людей → «Все»/эмодзи; `view=reactors` | panels.css `.reactor-filters/.person-row`; sheet-content.ts, actions.ts |
| Сведения/состав | header → compact/expanded; `view=info` | panels.css `.info-*/.people-*`; sheet-content.ts, sheets.ts |
| Настройки | info → settings → info; `view=settings` | panels.css `.sheet-form/.form-section/.cover-*`; forms.ts |
| Подробности задачи | inline card → details; `view=task` | panels.css `.task-*`; sheet-content.ts, task-actions.ts |
| Дата | плюс → дата; `view=date` | forms.ts; `.date-options/.switch-group/.two-fields`; полные gathering UX/specs |
| Место | плюс → место; `view=place`, fixture открытого опроса выключен | forms.ts; `.field/.sheet-actions`; прежний place-change-polls spec |
| Предложение задачи | плюс → задача; `view=new-task` | forms.ts; `.field/.sheet-actions`; прежний preparation-tasks spec |
| Share | info → Share → info; `view=share` | sheet-content.ts; `.share-content`; системный Share проверяется в приложении |

Пути TS выше относительно `src/pages/chat/{lib,ui}` прототипа. Fixtures ролей
организатор/автор/получатель и proposed/accepted/completed нужны для композиции,
не заменяют данные и серверные правила. В compact fixture 4 текущих участника
и «+1», в раскрытии 6 ответов; в продукте оба числа вычисляются из данных.

## Token mapping

Палитра не изменилась. Используются `color.background/surface/raised/message`,
`ownMessage/ownText`, `accent/focus/text/muted`, `borderStrong/line`,
`selectedSegment`, `sheetBackdrop`, `roster*`, `participantChipText/Avatar/More`.
Значения прежних токенов сохранены; новые роли отделены от desktop. Размеры ниже
в исходных CSS px, native — pt/dp; типографические размеры Android — sp.

| Роль | Принятые значения и источник |
| --- | --- |
| `component.chatComposer` | gap6, inset10/8/10, radius22, textarea44…108, line22, emoji icon23 — `.composer/#message-input` |
| `component.mobileChat` | header66/56 compact, avatar28, bubble18/corner6, inset11×14, inline radius17 — chat.css |
| `component.emojiDock` | preferred284/compact174, min160/148 с ограничением доступным пространством, max ratio0.45; search36/radius9; grid target платформы — `.emoji-*` |
| `component.reactionPicker` | maxWidth316/edge8; quick radius18/inset4; full radius20, preferredHeight352; context10/12/8 — `.reaction-*` |
| `component.reactionChip` | inset4×8, gap5, border1, opener icon18; target 44/48 — `.reaction-chip` |
| `component.mobileSheet` | radius24, top reserve50/20 compact, header≥48, content12/20/24, footer12/20/max16-safe, buttons46/radius12 — panels.css |
| `typography.*.mobileSheetTitle` | 19,650,1.25; `mobileChatTitle`16/14 narrow; `emojiChoice/Quick/Category`27/28/23 |
| `component.mobileField/mobileForm` | field gap7/radius10/height46, padding10×12, textarea min72; form gap18, section14, date gap8, switch row48 — `.field/.form-section` |
| `component.meetingSettings` | cover52/radius10/gap12 — `.cover-row/.cover-preview` |
| `component.mobilePeopleChip` | initial21, gap4, border2, overlap4, padding3/10/3; opener48 — `.people-chip/.people-summary` |
| `component.mobileRoster/reactionPeople` | row55/avatar32/gap11; filters target 44/48/radius12/padding8×13 — `.person-row/.reactor-filters` |
| `component.taskDetails` | facts inset7, row inset8/gap18; actions gap10/top22 — `.task-facts/.task-detail-actions` |
| `component.chatAddMenu` | width244/radius16/inset6/row46 — `.add-menu` |
| `typography.family.mobileChat` | system stack из tokens.css; native system/sans-serif |
| `motion.duration.mobileSheet/reactionLongPress` | sheet180ms/easing.standard, web long press450ms и cancel movement12; native системный recognizer, reduced motion |
| `breakpoint.chatCompactHeight/chatNarrowWidth` | 500/350 для мобильной адаптации; существующий desktop breakpoint740 не пересмотрен |

Список всех ролей/описаний генерируется в [catalog](../../../design-system/catalog.md).
Минимум интерактивной области — target 44 web/iOS, 48 Android; меньшая видимая
высота search/иконки не разрешает уменьшить target. Высоты dock/sheet — ориентиры,
а не причина перекрыть Send/поле при IME, Dynamic Type или landscape.

## Нормы и платформы

[chat-composition](specs/chat-composition/spec.md) теперь различает keyboard-toggle
→ composer/selection и Escape/Back → opener; содержит repeat insertion,
grapheme deletion, one sheet, compact settings/task и полную multi-date форму.
[chat-reactions](specs/chat-reactions/spec.md) задаёт anchored quick/full выбор,
явный opener, context/bounds и отдельные people filters с выбранностью/фокусом.
[Контракт](../../../docs/design/components/chat-actions.md) и
[платформы](../../../docs/design/platforms.md) фиксируют перенос без демо-ограничений.

Web: 320×760,390×844,390×430, мобильный landscape 844×390, прежние desktop 768/1440.
iOS/Android: соответствующие телефонные размеры и landscape, реальные insets,
клавиатура и fontScale/Dynamic Type. Мобильные формы остаются sheet при повороте.
Native appearance системных sheet/switch/date-time picker/Share адаптируется явно;
новая навигация desktop не создаётся. IME/VoiceOver/TalkBack не доказаны HTML preview.

## Манифест и приёмка

Все 360 прежних screen/platform/state пар сохранены. Новый
[design-manifest.json](design-manifest.json) версии 1.3.0 содержит 94 screen ID и 982
пары: отдельные dock/reactions, mobile low-height/landscape и состояния панелей.
Inputs включают исходники/config/tests/fonts/resources/fixtures каждой платформы;
общие DS/contracts подключаются CLI автоматически. Registry содержит этот один
манифест; он синхронизирован, исключения других изменений не сокращены.
Новый путь отчёта — `design-review-2026-10-27-telegram-chat.json`; старые отчёты
с исходными hashes остаются на прежних путях. Отчёт не создаётся с фиктивным pass.

Phase=checkpoint. Задачи 0.1–0.3,4.5–4.6,5.3,6.3 остаются открытыми; новые task ID
не добавлены. Тестовый план обновляет отдельный агент. Публикация/генерация и
проверка структуры не являются live-приёмкой. После переноса требуются независимые
feature-test/design-review, актуальные qa:ready/design:ready для каждой платформы.

## Дополнение 1.4.0

При переносе обнаружены неэкспортированные роли шапки из того же принятого
chat.css: mark 40×40/radius13, narrow 30×34/radius10, цвета #2e3938/#dcece5.
Они опубликованы как component.mobileChat.{markWidth,markHeight,markRadius,
narrowMarkWidth,narrowMarkHeight,narrowMarkRadius} и color.meetingMark/
meetingMarkForeground. Нового дизайна нет; исходные hashes сохраняются.
Web data-модуль разделён генератором на foundations/components без изменения
API designTokens. Manifest обновлён до 1.4.0, phase=checkpoint; никакие UI pass
не переносятся.

`color.fieldBorder` сохраняет #ffffff14 из ранее согласованного assets/styles.css
для noncompact полей при миграции литералов. Новый mobileField продолжает
использовать color.borderStrong.

`typography.weight.mobileChatTitle` (650) сохраняет начертание принятого
заголовка `.meeting-heading > span:first-child` как отдельную смысловую роль.

## Адаптация 1.4.1

Роль `component.mobileChat.iconSize` 22 происходит из существующего `tokens.css .icon`;
`chatComposer.emojiIcon` 23 не заменяет общую иконку. Native получает 22 pt/dp
без изменения targets.

Прежнее утверждённое [mobile-scroll.md](../gathering-activity-feed/mobile-scroll.md),
строки 15–16 и 31–32, требует минимум 16 px для web-полей телефона. Нет позднего
решения отменить no-zoom адаптацию: в raw исправлены только размеры текста
composer, поиска и input/textarea/select/readonly Share через общую переменную 16.
Роль `typography.size.mobileWebInput` относится к mobile web; native body 15 остаётся.
Pinch zoom и системный IME не ограничиваются. Исправление не взято из actual.

Прежние3CSS и source-hashes сохранены в [history/1.4.0](assets/revisions/2026-10-27-telegram-chat/history/1.4.0/README.md);
все старые reports/evidence и их hashes неизменны. Текущий source aggregate:
`46b6aeb81f9462b550ac264668b90e0d45fddcb2d5099d700487ace9af85dd7a`. Индекс явно описывает алгоритм aggregate и ссылку
на предыдущую версию; остальные 27 входов, включая generated/chat.js, не изменены.

Манифест 1.4.1 сохраняет 94 screen ID и 982 прежние пары; добавляет 28 mobile-web
проверок `mobile-input-minimum-16` (итого 1010). Report для нового контекста —
`design-review-2026-10-27-telegram-chat-1.4.1.json`, phase checkpoint.
Публикационный проход ограничен лёгкими source/generate/check/test проверками;
новый browser/render по исправленному raw и реальная Safari-клавиатура остаются
для координатора/независимого review. Прежний pass в новый контекст не переносится.
