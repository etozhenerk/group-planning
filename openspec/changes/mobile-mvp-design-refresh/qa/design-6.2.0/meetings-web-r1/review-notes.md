# Независимое дизайн-ревью web · meetings6.2.0 · R1

Вердикт: **needs-fixes**. Из123 обязательных пар:60 pass,51 needs-fixes,12 blocked.
Готовность задач7.1/7.4 не подтверждена. Код, эталоны, токены, manifest и tasks
ревьюер не менял.

## Подтверждённые расхождения

### F1 · Календарные дни со встречами слипаются

Принятый calendar-r7 и текущий контракт требуют отдельную подложку36×36/radius9,
центрированную в target не менее44×44. У обычного дня со встречей сохраняется
фон всей кнопки, дополнительно к правильному `::before`. На320 дни7/8 слипаются,
на739 образуют широкие полосы. Выбранный будний6 имеет прозрачную кнопку и
правильную36×36 подложку; выбранный выходной наследует полный фон.

Доказательства: `actual/calendar-ready-w320.png`,
`reference/calendar-ready-w320.png`, `actual/calendar-twenty-w739.png`,
`interactions/calendar-selected-day-w390.json`,
`interactions/calendar-list-switch-return-w739.json`.

Чтение реализации подтверждает источник: более специфичные правила
`.day[data-weekend='true'][data-event='true']`/event/selected задают background
самой кнопке; mobile reset не перекрывает все комбинации. Это расхождение
с опубликованным r7, а не предложение нового дизайна.

### F2 · Экран изменения ответа не перенесён

Нажатие maybe-карточки открывает прежний публичный `/i/…`: PublicHeader,
большая обложка, крупная карточка и вертикальные полноширинные ответы.
Принятый invitations-r2 задаёт компактный экран «Ваш ответ», карточку и группу
действий; поздняя общая коррекция требует контекстный тонкий Back.
На320/390 часть действий/возврат ниже первого viewport; на739 остаётся узкая
публичная колонка вместо мобильной композиции. Все15 response-* пар требуют
исправления.

Доказательства: `actual/invitations-response-open-w390.png` и соответствующий
`reference`, а также busy/retry/going/declined на320/390/739.
Функционально реальные PUT, busy-disabled, сохранение maybe после ошибки,
повтор и удаление карточки после going/not_going пройдены. Этот успех не
заменяет визуальную приёмку.

## Ограничения без условного pass

- B1: крупный текст200% не воспроизведён. Chromium принимает
  `Emulation.setEmulatedOSTextScale(scale2)`, но fontSize/glyph/box не меняются.
  Все3 large-text пары blocked; фактический capture textScale=1.
- B2: в предоставленных memory fixtures нет populated legacy-undated.
  Реальный PATCH с обоими null возвращает422 `starts_on: invalid`.
  Пустой undated URL не выдаётся за populated состояние:3 blocked.
- B3: настоящий read-marker на8858 подтвердил127→0 и скрытие notice.
  Raw list-r3 не содержит `unread-zero` selector/handler; неизвестный postMessage
  оставляет2 у первой карточки. Эти3 точные пары blocked, несмотря на корректный
  текущий zero UI. Статическая нулевая карточка не заменяет переход чтения.
- B4: длинные title/place созданы через API, но доступные OAuth-профили не
  создают длинное display_name из long-эталона.3 invitations/long blocked.
- Reference useRespond мгновенно успешен; pending/error в нём не воспроизводятся.
  Для response-busy/retry сохранён open-reference и явно указан этот предел;
  статус needs-fixes обусловлен подтверждённым F2.
- Отдельный сценарий30 участников не выполнен; реальные наборы2/3/6.
- VoiceOver не включался по прямому указанию пользователя. Browser AX, Tab,
  focus-visible, календарная клавиатура и touch-swipe проверены.

## Что проверено

Все123 manifest screen/platform/state пары имеют actual/reference и журнал.
Просмотрены все9 контактных листов с отдельными снимками спорных мест.
Проверены live loading/error/refresh-error и повторы без подмены успешного API,
периоды, выбор дня, соседние месяцы, Сегодня, ArrowRight, переключение вида,
настоящий чат и browser Back. Нормальная анимация измерена по кадрам,
повторные переключения не оставили лишних групп; Reduce Motion убирает движение.
Short390×430, coarse844×390, touch-scroll и возврат portrait не дали
горизонтального overflow; последние карточки доступны над nav.

20 встреч созданы настоящим API. Последняя карточка/аватары доступны над nav;
после возврата из реального чата scroll delta=0 на всех3 ширинах. Для photo
публичный avatar_url получен из profile-fields-full и доходит до participant
preview; только транспорт JPEG отвечает approved asset. При реальном image
error появляется силуэт той же геометрии. Ни один бизнес-ответ API не подменён.

Desktop740/1100/1440: current8856 и baseline8851 в отдельных contexts,
одинаковый API setup. Итоговые9 PNG попиксельно идентичны; baseline source/dist
не изменены. Ранние фоновые кадры Chromium не использованы в итоговом сравнении.

## Привязка и воспроизводимость

- inputHash: `bdb9446abec8dbe89fc9d4b5bfe50a86a9656b0b9a33407a75ce2296db6f7da0`.
- dist artifactHash: `68761801e41e2e1abf2936d893bcf56fa237de2fd079f30953f87bd24e05b8dd`.
-257 файлов immutable dist проверены по SHA256/size, расхождений0.
- macOS27.0.1 arm64, Chromium156.0.8078.4, Playwright1.64.1, ru-RU,
  Europe/Moscow, DPR1, системный `.SF NS` подтверждён CDP.
- Основной живой API8856; read/realtime/identity8858; raw references8846.
  Все процессы принадлежат родителю и ревьюером не останавливались.
- `fixtureHash` — SHA256 JSON конкретного наблюдённого состояния в interactions;
  seed/операции и их различия сохранены отдельно. Это не production данные.
- Session storage/auth файлы удалены; invitation paths редактированы до
  `/i/<fixture-token>`. Для нового запуска сначала нужны новые изолированные
  fixtures/auth; сохранённые отчёты не являются скриптом повторного входа.
- `context-before/during/after.txt` совпали. `design:check` прошёл.
  Итоговый JSON проверяется через `design:inspect-report`; pass gate не заявлен.

Итоговые проверки: `agent:check` и `git diff --check` прошли;
`design:inspect-report` вернул `structure=valid`, `currentAcceptance=false`.
`design:ready` выполнен и ожидаемо завершился с кодом1: отчёт неpassed.
Контекст до/во время/после/в конце совпал; поправки приложения следует принимать
отдельным R2 с новым context, не перезаписывая этот R1.
