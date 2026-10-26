# Независимый пилот design-review

Режим: **historical**. Итог: **3 needs-fixes, 15 blocked, 0 pass**, все 18 пар манифеста перечислены. Это предварительная проверка процесса на существующих материалах. Приложение остаётся на паузе; новая сборка и сценарии не запускались. Ревьюер пишет только этот Markdown и report.json в /tmp/somewhere-design-review-pilot.

Ревьюер: independent-subagent:/root/design_review_pilot. Время: 2026-10-26T18:24:39.908Z. Контекст: `6b38a86e30f4f966ca2a654524db3c8214b41e8a7296c82a5bff27437b48d050`. Hash получен командой design:context перед записью; он сохраняет контекст исходного пилота, но **не доказывает происхождение исторических снимков из этой сборки**; при уточнении метаданных hash не пересчитывался. JSON соответствует scripts/design/review-schema.mjs. Evidence хранит относительные пути и SHA-256 существующих файлов; новых interaction evidence нет.

## Источники и приоритет

Прочитаны AGENTS, README, продуктовый контекст, решения архитектуры, workflow, design-review и product-copy-editor, docs/design/review.md, authority.json, каталог токенов, [контракт карточки](../../../docs/design/components/meeting-card.md), [контракт действий](../../../docs/design/components/chat-actions.md), [платформенные правила](../../../docs/design/platforms.md), [UX и коррекции 26.10](../../../openspec/changes/meeting-experience-refresh/ux.md), delta-specs personal-meetings/chat-composition и исходный HTML/CSS. Отвергнутые list-avatars/list-names/participants не использовались.

Последняя коррекция имеет приоритет: mobile web/iOS/Android — bottom sheets поверх чата; футер только в desktop onboarding; нижняя навигация только в основных разделах. Старые reference с иным каркасом сохранены как исторические. Отсутствие старого футера и нижней панели в actual форм **не является дефектом**. Две даты в actual не сводятся к одному полю старого макета: актуальное правило требует минимум два варианта.

## Наблюдаемые расхождения

1. **P1 — мобильные формы web и iOS.** Все три actual-формы задачи, даты и места имеют собственную страницу с брендом и «Назад». Чат под формой отсутствует. Нарушен явный bottom sheet-контракт. Evidence — action-{task,date,place}-390-actual.png и action-{task,date,place}-ios.png; соответствующие reference показывают содержание, но их оболочка отменена коррекцией. Для Android такой вывод не сделан: отсутствует actual.
2. **P2 — размещение desktop-форм web.** При ширине 1440 px заголовок и панель всех трёх actual начинаются примерно у x=270, в reference у x=529. Ширина панели близка к 604 px: разница относится к центрированию узкой колонки в оставшейся после sidebar области. Демо-плашка объясняет 32 px вертикального сдвига, но не этот горизонтальный сдвиг. Правило — action-*.html с .main.narrow и опубликованным styles.css.
3. **P2 — строки меню web.** На menu-390-actual.png каждая пара иконка/текст центрируется независимо; в menu-390-reference.png и chat-menu.html строки имеют единую левую ось. Меню остаётся компактным и возле composer, но ритм строк расходится с утверждённой композицией. На просмотренном menu-ios.png этого расхождения нет.
4. **P2 — состояние времени на web 320 px.** На первой, второй и последней карточках list-320-actual.png видно «время уточн…». Смысловой статус по personal-meetings/spec.md должен читаться как «время уточняем». В reference есть полностью читаемый ярлык этого состояния на карточке без обложки. Фикстуры различаются; точный перенос с обложкой требует повторной проверки на одинаковых данных. На 390 px корона второй карточки отдельно переносится под название — дополнительное предварительное замечание по связи роли с названием.
5. **Текст формы задачи web.** Вопрос «Кому предложить» сопровождается значением «Любой участник»; reference/iOS используют «Любому участнику». Предлагаемая редактура — согласовать падеж без изменения операции. На кнопке места web «Создать опрос», в reference/iOS — «Предложить место»: обе формулировки описывают существующую операцию, поэтому это отмечено как вопрос последовательности, не отдельный доказанный сбой поведения.

Это наблюдения старых материалов, а не утверждение, что перечисленные дефекты воспроизведены в текущей сборке. Исправления UI не выполнялись.

## Карточки, адаптации и ограничения

Видимая композиция карточек узнаваема: выступающая дата, название/место слева, наклонённая обложка справа сверху, аватары справа снизу; пятница сливовая, суббота серо-зелёная. iOS default использует те же названия/даты/изображения и несколько аватаров с +3, что HTML reference. Native SF и safe area оценивались как адаптации. По картинке нельзя удостоверить токены, доступные имена и дату в нужном часовом поясе.

Web actual списка содержит пять встреч 2099 года и по одному участнику, reference — три встречи 2026 года и по шесть участников. Это не доказательство потери аватаров или неверного цвета. Отсутствие футера в actual соответствует последним решениям. Полноразмерный screenshot с плавающей навигацией частично закрывает одну карточку; без прокрутки нельзя утверждать, что пользователь не может добраться до неё.

Web desktop no-cover и iOS refresh-meetings показывают отсутствие фотографии/крупной заглушки. Но короткие названия не проверяют использование всей ширины, а iOS reference обрезан до начала no-cover. Длинные название/место не заданы сопоставимой fixture. Просмотр двухстрочного короткого заголовка не заменяет проверку длинного текста или Dynamic Type.

Изолированный forward-test 26.10.2026; phase=paused. Просмотрены существующие изображения через view_image, без приложения, браузерного запуска, симулятора, эмулятора или новых screenshots. Web: выбранные ширины 320/390/1440 CSS px, runner задаёт height=1000, ru-RU, Europe/Moscow; фактическая версия ОС/Chromium, установленные шрифты, deviceScaleFactor, zoom и build commit на момент снимков не удостоверены. Web actual содержит 32 px Demo; fixture списка — 2099 и один участник, reference — октябрь/ноябрь 2026 и шесть; menu использует shared fixture. На reference дат web видны US-поля, поэтому фактическая locale этих исторических reference не доказана настройкой текущего runner. iOS: по сохранённой gallery index.html iPhone 18 Pro Simulator, 402×874 pt, PNG 1206×2622, 3 px/pt, safe area 62/34 pt, reference HTML в JPEG 402×778 (файлы с расширением .png); runtime/build/фактические SF метрики/Dynamic Type/locale/timezone не удостоверены. iOS refresh-meetings отличается fixture. Android: только HTML reference JPEG 360×708 (файлы с расширением .png), native actual/build/device/runtime отсутствуют. Анимации/reduced motion/hover/фокус/экранные дикторы не проверялись. Изображения больше 2048 px инструмент отображал уменьшенными; точное измерение native пикселей не заявляется. Новых interaction evidence нет. Уточнение метаданных: sips определил фактический формат и размер всех 35 evidence: 26 PNG и 9 JPEG. Девять JPEG имеют расширение .png: пять Android reference — 360×708 и четыре iOS reference — 402×778. Первоначальная таблица ошибочно читала их как PNG; исправлена по результатам sips. Файлы evidence, их SHA-256, замечания UI, reviewedAt и исходный inputHash пилота сохранены; это уточнение метаданных, не новое ревью.

## Покрытие

| Screen | Platform | State | Status |
| --- | --- | --- | --- |
| list | web | default | needs-fixes |
| list | web | long-title | blocked |
| list | web | no-cover | blocked |
| list | ios | default | blocked |
| list | ios | long-title | blocked |
| list | ios | no-cover | blocked |
| list | android | default | blocked |
| list | android | long-title | blocked |
| list | android | no-cover | blocked |
| chat-actions | web | open | needs-fixes |
| chat-actions | web | error | blocked |
| chat-actions | web | reopen | blocked |
| chat-actions | ios | open | needs-fixes |
| chat-actions | ios | error | blocked |
| chat-actions | ios | reopen | blocked |
| chat-actions | android | open | blocked |
| chat-actions | android | error | blocked |
| chat-actions | android | reopen | blocked |

Все error/reopen заблокированы: нет живого сценария и относящегося к нему журнала. Не проверены потерянный ответ, повтор с тем же ключом, Back/свайп, сохранение и очистка черновика, системная клавиатура, VoiceOver/TalkBack, масштаб текста, фокус и reduced motion. Screenshots загрузки файла или формы поддержки не подставлялись вместо ошибок действия чата.

## Практическая применимость навыка

Навык применим как независимый фильтр: он заставляет прочитать приоритет коррекций, реально посмотреть actual/reference, разделить дефект и платформенную адаптацию, выдать blocked при нехватке данных. Схема допускает честный historical-отчёт; правило запрещает historical pass. design:check перед пилотом вернул ok и явно сообщил, что paused/checkpoint не являются приёмкой. Это правильное различие между проверкой обвязки и UI.

Обнаруженные недостатки материалов/контракта/инструментов:

- **Нет воспроизводимой пары данных.** Android-каталог содержит только reference-изображения даже с поиском скрытых/ignored файлов. Web list использует другую fixture, native no-cover неполон, long-title/error/reopen отсутствуют. Для полноценного ревью нужны фиксированные значения, актуальные actual и журналы каждого перехода. Сейчас это причина blocked, а не повод запускать поставленное на паузу приложение.
- **Манифест не перечисляет все влияющие входы.** Его inputs ограничены тремя каталогами клиентских исходников. Не включены frontend/web/tests/30-design-review.spec.ts и playwright.visual.config.ts, package.json/package-lock.json и платформенные build-конфигурации. Это расходится с инструкцией review.md включать fixture, конфигурацию сборки и ресурсы. Ссылки на list.html/styles.css не включают автоматически dinner.png/boardgame.png/friends.png; текущая authority перечисляет HTML/CSS/JS, но не эти изображения. Такой источник может поменяться без UI-hash. Исправлять перечень следует отдельной публикацией процесса, без выдачи pass этому пилоту.
- **Слишком крупная единица проверки.** chat-actions/open объединяет меню и три разных формы, web объединяет mobile/desktop, а list/default не кодирует 1/много участников и weekday/weekend. Машинное покрытие 18 пар само по себе не доказывает покрытие вариантов из контрактов. Нужны стабильные варианты/сценарии в manifest либо формальный список обязательных подслучаев; в этом пилоте они разобраны текстом.
- **Неполная provenance исторических материалов.** environment — свободная строка; схема не проверяет build commit, fixture hash, точную ОС/runtime, шрифты, zoom, дату, locale и timezone. Текущая конфигурация runner задаёт ru-RU/Europe/Moscow, но в web reference даты отрисованы в US-формате. Нельзя выдавать текущую настройку за подтверждённую среду старого снимка. Для live-приёмки желательно сохранять эти поля рядом с evidence при получении, особенно фактический font stack.
- **Внешний пилот проверяется вручную.** CLI берёт report из фиксированного manifest.report и не имеет отдельной команды валидации указанного /tmp отчёта. Изолированный JSON проверен Ajv по экспортированной схеме, затем отдельно проверены все 18 ключей и hashes. Это полезный будущий режим validate-report/--report, чтобы не менять paused manifest ради испытания.
- **Нужны точные product-spec ссылки.** chat-actions.md говорит, что поля/валидацию задаёт продуктовая спецификация, но не даёт прямого пути. Для подтверждения bottom sheet и необязательного «Почему здесь» пришлось найти chat-composition delta. Прямые ссылки сократят риск прочитать устаревшие правила; прежний минимальный состав HTML уже отличается от актуального требования двух дат.

Независимость не доказывается одной строкой reviewer: в этом пилоте оценку выполнил отдельный субагент, получивший raw-источники без готового списка дефектов. Дочерние агенты не создавались. Код, токены, макеты, manifest и tasks не менялись.

## Просмотренные evidence

Все перечисленные ниже изображения действительно просмотрены; SHA-256 находятся в report.json. Фактические форматы и размеры заново определены через sips, независимо от расширения. Исправлены девять ошибочных размеров JPEG, ранее прочитанных как PNG; сами evidence не изменялись. Изображения без отдельного сценария помечены в observations как ограниченный композиционный ориентир, а не доказательство пройденного состояния.

| Файл относительно assets/verification | Фактический формат | Размер изображения | Роль |
| --- | --- | --- | --- |
| web/list-320-actual.png | PNG | 320×1394 | actual |
| web/list-320-reference.png | PNG | 320×1544 | reference |
| web/list-390-actual.png | PNG | 390×1376 | actual |
| web/list-390-reference.png | PNG | 390×1524 | reference |
| web/list-1440-actual.png | PNG | 1440×1000 | actual |
| web/list-1440-reference.png | PNG | 1440×1030 | reference |
| ios/list-ios.png | PNG | 1206×2622 | actual |
| ios/list-reference.png | JPEG | 402×778 | reference |
| ios/refresh-meetings.png | PNG | 1206×2622 | actual |
| android/reference/list.png | JPEG | 360×708 | reference |
| web/action-task-390-actual.png | PNG | 390×1000 | actual |
| web/action-task-390-reference.png | PNG | 390×1085 | reference |
| web/action-task-1440-actual.png | PNG | 1440×1000 | actual |
| web/action-task-1440-reference.png | PNG | 1440×1000 | reference |
| web/action-date-390-actual.png | PNG | 390×1000 | actual |
| web/action-date-390-reference.png | PNG | 390×1293 | reference |
| web/action-date-1440-actual.png | PNG | 1440×1000 | actual |
| web/action-date-1440-reference.png | PNG | 1440×1045 | reference |
| web/action-place-390-actual.png | PNG | 390×1000 | actual |
| web/action-place-390-reference.png | PNG | 390×1234 | reference |
| web/action-place-1440-actual.png | PNG | 1440×1000 | actual |
| web/action-place-1440-reference.png | PNG | 1440×1000 | reference |
| web/menu-390-actual.png | PNG | 390×1000 | actual |
| web/menu-390-reference.png | PNG | 390×1000 | reference |
| ios/action-task-ios.png | PNG | 1206×2622 | actual |
| ios/action-task-reference.png | JPEG | 402×778 | reference |
| ios/action-date-ios.png | PNG | 1206×2622 | actual |
| ios/action-date-reference.png | JPEG | 402×778 | reference |
| ios/action-place-ios.png | PNG | 1206×2622 | actual |
| ios/action-place-reference.png | JPEG | 402×778 | reference |
| ios/menu-ios.png | PNG | 1206×2622 | actual |
| android/reference/chat-menu.png | JPEG | 360×708 | reference |
| android/reference/action-task.png | JPEG | 360×708 | reference |
| android/reference/action-date.png | JPEG | 360×708 | reference |
| android/reference/action-place.png | JPEG | 360×708 | reference |

## Проверки отчёта

- design:check — прошёл перед пилотом; после параллельного изменения процесса родитель должен повторить его.
- design:context — пересчитан непосредственно перед записью.
- JSON Schema (Ajv, strict), 18 уникальных ожидаемых checks, SHA-256 всех evidence — проверены при записи.
- design:ready не использовался для объявления готовности: отчёт historical, приложение paused, pass отсутствует, а отчёт намеренно сохранён вне manifest.report.
- Новые скриншоты, pixel regression и live-взаимодействия не выполнялись.
- При уточнении метаданных sips проверил все 35 изображений; hashes evidence повторно совпали. Сохранены исторические замечания, reviewedAt и исходный inputHash пилота, без пересчёта по последующим изменениям manifest.


## Доработки процесса по результатам пилота

После независимого отчёта исполнитель добавил fixture/build-конфигурацию и
связанные картинки в hash, обязательные платформенные входы и capture provenance
для pass, отдельную команду inspect-report, прямые ссылки на продуктовые specs
и правило отдельных состояний форм/viewport. Исходный JSON сохранён без
подмены hash: это исторический результат, а не приёмка изменённого процесса/UI.
Укрупнённая пилотная матрица остаётся paused; перед live-проверкой её требуется
развернуть согласно новым инструкциям публикации. Обнаруженные UI-расхождения
не исправлялись этим инфраструктурным изменением.
