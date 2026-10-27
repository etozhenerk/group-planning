# Публикация коррекции чата · 2.0.0

27.10.2026 пользователь ответил «давай» на конкретный план исправлений. Последнее
решение заменяет прежние desktop-страницы действий и постоянные кнопки реакций.
Это major: меняется действующий поведенческий контракт, не только геометрия.

## Источники и область

[Raw-прототип](assets/revisions/2026-10-27-telegram-chat/chat.html),
[SVG smile](assets/revisions/2026-10-27-telegram-chat/composer-smile.svg),
[прежние hashes](assets/revisions/2026-10-27-telegram-chat/history/1.4.1/hashes.json),
[актуальные hashes](assets/revisions/2026-10-27-telegram-chat/source-hashes.json),
[UX](ux.md), [контракт](../../../docs/design/components/chat-actions.md).
Web, iOS, Android остаются в общей матрице; несвязанные состояния не исключаются.

- «+»: desktop-модалка над чатом, mobile bottom sheet; закрытие сохраняет draft/scroll.
- Native long press bubble → picker; chip → люди с исходным emoji filter;
  короткий tap chip → своё участие. Scroll/cancel отменяет pending hold, hold поглощает tap.
- Нет постоянных smile/add-reaction/people возле сообщений. AX actions на самих
  элементах; web keyboard/context menu. Фокус возвращается bubble/chip.
- Picker enter 180 ms / exit 150 ms / feedback 150 ms; easing (.2,.7,.3,1),
  scale .92 и offset 8, pressed scale .97, selected outline 2. Цвет accent
  и existing selectedSegment применяются вместе с checkmark. Reduce Motion без перемещения.
- Smile: viewport 24×24, stroke1.7; circle(12,12,r9), глаза (8.5,9.5,r.9) и
  (15.5,9.5,r.9), дуга M8 14Q12 18 16 14. Видимый размер 23, target 44/48.
- Caret/placeholder: одна метрика и отступы. Deadline дата «28 октября» без weekday,
  одинаковая высота date/time; layout по содержимому/доступной ширине, stacked
  на узком экране/крупном тексте.

## Публикуемые роли

`motion.duration.reactionEnter/reactionExit/reactionFeedback`,
`component.reactionPicker.enterScale/enterOffset/pressedScale/selectedOutlineWidth`,
`component.chatActionDialog.maximumWidth/viewportInset/radius` (560/24/24).
`motion.easing.standard`, `color.accent/selectedSegment` и composer insets повторно
используются. Legacy literal inventory не расширяется; outputs только генератором.

## Проверка и статус

[Design manifest](design-manifest.json) и [testing manifest](testing-manifest.json)
возвращены в checkpoint после продолжения пользователем. Report/plan/run имеют
новые пути 2.0.0; старые отчёты и evidence не изменяются и не переносят pass.
Новая live-проверка прототипа и клиентов в рамках этой публикации не заявлена:
браузер, пользовательский 8445 и тяжёлые сборки не запускались. Исправлены raw
исходники, скомпилирован TypeScript/bundle, выполнены структурные проверки.
Полный список фактически выполненных проверок — в checks JSON рядом с публикацией.
Независимые design-review/feature-test и gates после реализации обязательны.
