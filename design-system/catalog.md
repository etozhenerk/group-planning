# Токены somewhere · 7.8.0

Генерируется из [tokens.json](tokens.json); ручные правки будут перезаписаны.
В коде используйте смысловые роли. px → CSS px / iOS pt / Android dp;
типографические размеры Android → sp. Длительность Swift → секунды.

| Роль | Тип | Значение | Назначение |
| --- | --- | --- | --- |
| breakpoint.chatCompactHeight | dimension | 500px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css/panels.css max-height; только компактная мобильная композиция, не изменение desktop routes |
| breakpoint.chatNarrowWidth | dimension | 350px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css/panels.css max-width; узкий мобильный header/формы |
| breakpoint.mobile | dimension | 740px | Web: ниже этого значения мобильная композиция; native не использует breakpoint |
| breakpoint.tablet | dimension | 1100px | Верхняя граница планшетной компоновки web из styles.css:1271 |
| color.accent | color | #d6cce9 | Смысловая роль accent |
| color.action | color | #ebe7df | Смысловая роль action |
| color.actionText | color | #252429 | Смысловая роль actionText |
| color.background | color | #24252a | Смысловая роль background |
| color.borderStrong | color | #414249 | Смысловая роль borderStrong |
| color.calendar.border | color | #ffffff0a | Неизменённый baseline календаря #ffffff0a; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.day | color | #dad7df | Неизменённый baseline календаря #dad7df; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.event | color | #46394d | Неизменённый baseline календаря #46394d; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.hover | color | #ffffff08 | Неизменённый baseline календаря #ffffff08; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.outsideDay | color | #72727d | Неизменённый baseline календаря #72727d; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.selected | color | #695573 | Неизменённый baseline календаря #695573; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.selectedBorder | color | #d5c0e475 | Неизменённый baseline календаря #d5c0e475; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.selectedText | color | #ffffff | Неизменённый baseline календаря #ffffff; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.surface | color | #2b2c32 | Неизменённый baseline календаря #2b2c32; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.todayOutline | color | #b7a6c6 | Неизменённый baseline календаря #b7a6c6; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.todayText | color | #e1dce8 | Неизменённый baseline календаря #e1dce8; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.weekday | color | #a2a1af | Неизменённый baseline календаря #a2a1af; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.weekendDay | color | #b6d0c3 | Неизменённый baseline календаря #b6d0c3; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.weekendEvent | color | #354e46 | Неизменённый baseline календаря #354e46; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.weekendSelected | color | #567464 | Неизменённый baseline календаря #567464; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.weekendSelectedBorder | color | #bdd7c795 | Неизменённый baseline календаря #bdd7c795; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.calendar.weekendWeekday | color | #b0c7bd | Неизменённый baseline календаря #b0c7bd; общий компонент списка и знакомства. См. calendar-token-bindings-6.2.json, sourceCommit/источники. |
| color.error | color | #ffb8b2 | Смысловая роль error |
| color.fieldBorder | color | #ffffff14 | Ранее согласованный assets/styles.css .field input/.field textarea/.search (строки 432–441) и .field select (2804–2811), border #ffffff14. Сохраняет desktop/noncompact поле; новая mobile-ревизия использует color.borderStrong. |
| color.focus | color | #d6d1f5 | Смысловая роль focus |
| color.invitationNoticeBackground | color | #ffb8b21a | Принятый notice: color-mix(error10%,transparent) из raw invite-r3. |
| color.legacyIosAccent | color | #c5bbd6 | Legacy iOS; не использовать в новых компонентах |
| color.legacyIosSelectedSegment | color | #46414e | Legacy iOS; не использовать в новых компонентах |
| color.line | color | #ffffff12 | Смысловая роль line |
| color.meetingMark | color | #2e3938 | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| color.meetingMarkForeground | color | #dcece5 | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| color.message | color | #33343a | Смысловая роль message |
| color.mobileInvitationFooterLine | color | #ffffff08 | Внутренняя верхняя линия footer invite-r3: #ffffff08; роль не меняет calendarHover. |
| color.mobileMessageOwnMetadata | color | #685f75 | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| color.mobileMessageShadow | color | #00000011 | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| color.mobileNavigationAndroidBackground | color | #27282efa | Привязка неизменённого Android baseline фона; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| color.mobileNavigationAndroidBorder | color | #ffffff15 | Привязка неизменённой Android baseline рамки; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| color.mobileNavigationIOSBackground | color | #27282eeb | Привязка неизменённого iOS baseline фона поверх ultraThinMaterial; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| color.mobileNavigationIOSBorder | color | #ffffff15 | Привязка неизменённой iOS baseline рамки; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| color.mobileOnboardingInactive | color | #414249 | onboarding-r4/r5: фон невыбранной точки#414249, alias опубликованной neutral-роли. |
| color.mobileOnboardingNext | color | #393a42 | onboarding-r4/r5: фон Далее#393a42, computed style действующего эталона. |
| color.mobileStickyShadow | color | #00000055 | create-r4/r5: #0005, тень закреплённой мобильной панели |
| color.muted | color | #b9b9c2 | Смысловая роль muted |
| color.navigation | color | #1d1e22 | Смысловая роль navigation |
| color.navigationInactiveText | color | #92939f | Неактивная нижняя вкладка, утверждённый assets/styles.css mobile navigation |
| color.navigationSelected | color | #4a4554 | Подложка выбранной нижней вкладки, утверждённый assets/styles.css:2330 |
| color.navigationSelectedBorder | color | #ddd3ed16 | Рамка выбранной нижней вкладки, утверждённый assets/styles.css:2328 |
| color.navigationSelectedText | color | #eee5f7 | Подпись выбранной нижней вкладки, утверждённый mobile nav |
| color.ownMessage | color | #e0dce8 | Смысловая роль ownMessage |
| color.ownText | color | #27252d | Смысловая роль ownText |
| color.participantChipAvatar | color | #00000010 | Подложка инициала компактного участника; список встреч использует отдельные роли аватаров карточки |
| color.participantChipFirst | color | #c6b4a5 | Фон первого компактного участника; список встреч использует отдельные роли аватаров карточки |
| color.participantChipMore | color | #42434b | Фон счётчика остальных участников; список встреч использует отдельные роли аватаров карточки |
| color.participantChipSecond | color | #c9bfd9 | Фон второго компактного участника; список встреч использует отдельные роли аватаров карточки |
| color.participantChipText | color | #302c2b | Текст компактного участника; список встреч использует отдельные роли аватаров карточки |
| color.participantChipThird | color | #b5c9bf | Фон третьего компактного участника; список встреч использует отдельные роли аватаров карточки |
| color.photoBackdrop | color | #141518 | Смысловая роль photoBackdrop |
| color.photoFrame | color | #e4ded4 | Смысловая роль photoFrame |
| color.raised | color | #393a42 | Смысловая роль raised |
| color.rosterBlue | color | #b6c1d1 | Аватар раскрытого состава: rosterBlue |
| color.rosterLilac | color | #c3b5d1 | Аватар раскрытого состава: rosterLilac |
| color.rosterMint | color | #b2c4bc | Аватар раскрытого состава: rosterMint |
| color.rosterSand | color | #c2af9f | Аватар раскрытого состава: rosterSand |
| color.rosterText | color | #30292a | Аватар раскрытого состава: rosterText |
| color.selectedSegment | color | #45414e | Смысловая роль selectedSegment |
| color.sheetBackdrop | color | #0b0b10a8 | Затемнение чата за мобильной нижней панелью; native использует системный scrim по платформенному контракту |
| color.subtleBorder | color | #ffffff20 | Рамка вторичного действия на поверхности, в том числе приглашения из сведений встречи |
| color.surface | color | #303138 | Смысловая роль surface |
| color.text | color | #f5f4f1 | Смысловая роль text |
| color.weekday | color | #38313d | Смысловая роль weekday |
| color.weekdayBadge | color | #57475e | Смысловая роль weekdayBadge |
| color.weekdayFrame | color | #5e4f63 | Смысловая роль weekdayFrame |
| color.weekdayHover | color | #403649 | Смысловая роль weekdayHover |
| color.weekdayText | color | #ede0f1 | Смысловая роль weekdayText |
| color.weekend | color | #2e3938 | Смысловая роль weekend |
| color.weekendBadge | color | #425653 | Смысловая роль weekendBadge |
| color.weekendFrame | color | #4b615b | Смысловая роль weekendFrame |
| color.weekendHover | color | #344440 | Смысловая роль weekendHover |
| color.weekendText | color | #dcece5 | Смысловая роль weekendText |
| component.action.columnWidth | dimension | 700px | Максимальная ширина страницы действия на desktop из .narrow |
| component.action.fieldGap | dimension | 18px | Интервал между полями формы из .stack утверждённого styles.css |
| component.action.headingGap | dimension | 30px | Интервал после заголовка desktop-формы из styles.css:199 |
| component.action.headingLineHeight | number | 1.15 | Множитель строки desktop h1 из утверждённого styles.css |
| component.action.headingTracking | dimension | 1.2px | Величина отрицательного трекинга desktop h1; применяется со знаком минус |
| component.action.headingTrackingMobile | dimension | 0.9px | Величина отрицательного трекинга мобильного h1 из styles.css |
| component.action.panelInset | dimension | 26px | Внутренний отступ панели действия на desktop из .panel |
| component.action.tabletInset | dimension | 30px | Отступ планшетной формы из styles.css:1276 |
| component.action.topInset | dimension | 44px | Верхний отступ desktop-формы из styles.css:189 |
| component.button.borderWidth | dimension | 1px | 4.1.0: граница существующей .button.subtle из styles.css:224–227. В соседней primary резервируется прозрачная граница той же ширины, чтобы перенос текста и смена состояния не меняли высоту ряда. |
| component.button.disabledOpacity | number | 0.65 | Неизменённый принятый response-routing-r1/source/fixture-source/app/styles/base.css: button:disabled:not(.g-button), opacity0.65. |
| component.button.iconGap | dimension | 9px | Интервал между иконкой и подписью .button из styles.css:216 |
| component.button.iconSize | dimension | 21px | Иконка .button из общего svg.icon утверждённого styles.css:81–89 |
| component.button.minimumHeight | dimension | 46px | Минимальная высота .button из styles.css:218; область нажатия не меньше target платформы |
| component.button.paddingBlock | dimension | 12px | Вертикальный отступ содержимого .button из styles.css:217 |
| component.button.paddingInline | dimension | 18px | Горизонтальный отступ содержимого .button из styles.css:217 |
| component.button.radius | dimension | 13px | Радиус .button из утверждённого styles.css:219 |
| component.calendar.controlRadius | dimension | 9px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.dayNumberRadius | dimension | 9px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.dayNumberSize | dimension | 26px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.dayRadius | dimension | 13px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.dotsInset | dimension | 5px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.enterOffset | dimension | 5px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.enterOpacity | number | 0.5 | Неизменённый baseline CalendarGrid: размер стрелки месяца и начальная opacity перехода до переноса общего компонента. |
| component.calendar.headingGap | dimension | 22px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.mobileHeadingGap | dimension | 17px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.mobileInsetBlock | dimension | 17px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.mobileInsetInline | dimension | 14px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.mobileRadius | dimension | 20px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.monthIconSize | dimension | 17px | Неизменённый baseline CalendarGrid: размер стрелки месяца и начальная opacity перехода до переноса общего компонента. |
| component.calendar.narrowInsetBlock | dimension | 15px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.radius | dimension | 23px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.todayInsetBlock | dimension | 7px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.todayInsetInline | dimension | 9px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.calendar.weekGap | dimension | 9px | Привязка неизменённого baseline CalendarGrid/CalendarDay перед переносом в общий entity-компонент; desktop сохраняется. Новое mobile-выделение36/radius9 опубликовано отдельно в6.0. |
| component.card.avatar | dimension | 35px | Карточка avatar |
| component.card.avatarMobile | dimension | 32px | Карточка avatarMobile |
| component.card.avatarOverlap | dimension | 9px | Карточка avatarOverlap |
| component.card.cover.height | dimension | 112px | Обложка карточки height |
| component.card.cover.mobileHeight | dimension | 101px | Обложка карточки mobileHeight |
| component.card.cover.mobileWidth | dimension | 102px | Обложка карточки mobileWidth |
| component.card.cover.width | dimension | 118px | Обложка карточки width |
| component.card.coverBorder | dimension | 3px | Толщина рамки обложки из утверждённого styles.css:1909 |
| component.card.coverLift | dimension | 4px | Карточка coverLift |
| component.card.hoverLift | dimension | 3px | Карточка hoverLift |
| component.card.minimumHeight | dimension | 146px | Карточка minimumHeight |
| component.card.minimumHeightMobile | dimension | 145px | Карточка minimumHeightMobile |
| component.chatActionDialog.maximumWidth | dimension | 560px | Desktop-модалка действий + в 2.0.0 |
| component.chatActionDialog.radius | dimension | 24px | Скругление desktop-модалки действий |
| component.chatActionDialog.viewportInset | dimension | 24px | Минимальный внешний отступ desktop-модалки |
| component.chatAddMenu.inset | dimension | 6px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .add-menu |
| component.chatAddMenu.offset | dimension | 6px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .add-menu bottom |
| component.chatAddMenu.radius | dimension | 16px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .add-menu |
| component.chatAddMenu.rowHeight | dimension | 46px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .add-menu button |
| component.chatAddMenu.width | dimension | 244px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .add-menu |
| component.chatComposer.compactPaddingBlock | dimension | 5px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-height500 .composer |
| component.chatComposer.emojiIcon | dimension | 23px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #emoji-button .icon |
| component.chatComposer.gap | dimension | 6px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .composer gap |
| component.chatComposer.inputInsetBottom | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #message-input |
| component.chatComposer.inputInsetStart | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #message-input |
| component.chatComposer.inputInsetTop | dimension | 11px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #message-input |
| component.chatComposer.inputLineHeight | dimension | 22px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #message-input line-height; масштабируется с текстом |
| component.chatComposer.inputMaxHeight | dimension | 108px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #message-input |
| component.chatComposer.inputMinHeight | dimension | 44px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css #message-input; max с target платформы |
| component.chatComposer.paddingBottom | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .composer padding; минимум до safe area |
| component.chatComposer.paddingInline | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .composer padding |
| component.chatComposer.paddingTop | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .composer padding |
| component.chatComposer.radius | dimension | 22px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .text-entry |
| component.desktopMessage.cornerRadius | dimension | 5px | Неизменённый approved chat-r6/source/MessageReceipt и baseline desktop FeedRecord до мобильного переноса. |
| component.desktopMessage.lineHeight | number | 1.6 | Неизменённый approved chat-r6/source/MessageReceipt и baseline desktop FeedRecord до мобильного переноса. |
| component.desktopMessage.radius | dimension | 18px | Неизменённый approved chat-r6/source/MessageReceipt и baseline desktop FeedRecord до мобильного переноса. |
| component.emojiDock.categoryIconSize | dimension | 23px | Единый SVG viewBox категорий эмодзи iOS; прежний видимый размер23, центр target44. |
| component.emojiDock.categoryIndicator | dimension | 2px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-categories .active::after |
| component.emojiDock.choiceInset | dimension | 3px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-choice |
| component.emojiDock.choiceRadius | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-choice |
| component.emojiDock.compactHeight | dimension | 174px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-height500 .emoji-dock |
| component.emojiDock.compactMinimumHeight | dimension | 148px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-height500; ограничивается доступным пространством |
| component.emojiDock.maximumViewportRatio | number | 0.45 | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-dock 45vh; ограничение по реально видимому пространству, не под IME |
| component.emojiDock.minimumHeight | dimension | 160px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-dock; ориентир, не перекрывает composer при IME |
| component.emojiDock.preferredHeight | dimension | 284px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css tokens.css --draft-dock-height; ограничивается доступным viewport |
| component.emojiDock.resultInsetBottom | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-results |
| component.emojiDock.resultInsetInline | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-results |
| component.emojiDock.resultInsetTop | dimension | 5px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-results |
| component.emojiDock.searchHeight | dimension | 36px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-search; видимая высота, интерактивная область не меньше target |
| component.emojiDock.searchIcon | dimension | 17px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-search .icon |
| component.emojiDock.searchInset | dimension | 11px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-search |
| component.emojiDock.searchRadius | dimension | 9px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-search |
| component.emojiDock.toolbarInsetInline | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-toolbar |
| component.emojiDock.toolbarInsetTop | dimension | 5px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-toolbar |
| component.helpDisclosure.maximumWidth | dimension | 780px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.mobileInset | dimension | 20px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.paddingBlock | dimension | 22px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.paddingInline | dimension | 24px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.radius | dimension | 16px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.symbolLineLength | dimension | 14px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.symbolSize | dimension | 20px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.helpDisclosure.symbolStroke | dimension | 2px | FAQ плюс/минус, одобренный макет 28.10.2026 |
| component.icon.focusOffset | dimension | 5px | Отступ outline при фокусе по клавиатуре из styles.css :focus-visible; для иконки закрытия панели |
| component.icon.strokeWidth | number | 1.7 | Толщина SVG-штриха из утверждённого styles.css svg.icon; для пиктограмм нового варианта панели |
| component.invitationDesktop.authSkeletonWidth | dimension | 220px | Прежний InvitationPage3e25d63c: Skeletonwidth220 до проверки входа; desktop сохраняется. |
| component.invitationDesktop.bottomSpace | dimension | 70px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.cardPadding | dimension | 32px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.cardRadius | dimension | 28px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.columnWidth | dimension | 490px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.insetInline | dimension | 28px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.maximumWidth | dimension | 1120px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.returnInsetBlock | dimension | 11px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.returnInsetInline | dimension | 18px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.returnRadius | dimension | 14px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.returnWeight | number | 650 | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationDesktop.titleSize | dimension | 38px | Сохранение desktop-композиции InvitationPage до изменения3e25d63c; совпадает с исходным baseline ea4cad9b, кроме отдельно принятого результата RSVP. |
| component.invitationNotice.bottomSpace | dimension | 14px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.copyGap | dimension | 5px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.copyTop | dimension | 1px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.gap | dimension | 11px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.glyphSize | dimension | 18px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.iconRadius | dimension | 11px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.iconSize | dimension | 34px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.outerInset | dimension | 2px | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationNotice.titleLineHeight | number | 1.4 | Привязка неизменённого принятого invite-r3/source/InvitationNotice.module.css; не значение из actual. |
| component.invitationState.loadingActionHeight | dimension | 44px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingActionWidth | dimension | 190px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingBrightOpacity | number | 0.85 | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingDimOpacity | number | 0.45 | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingGap | dimension | 28px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingLineHeight | dimension | 16px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingLineOneWidth | number | 0.65 | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingLineTwoWidth | number | 0.85 | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingPulse | duration | 1600ms | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingRadius | dimension | 7px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingTitleHeight | dimension | 28px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.loadingTitleWidth | number | 0.72 | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.unavailableActionIcon | dimension | 16px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.unavailableInsetBlock | dimension | 32px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.unavailableInsetInline | dimension | 22px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.unavailableTitleSize | dimension | 24px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.invitationState.unavailableTopGap | dimension | 32px | Привязка неизменённых invite-r3/source/InvitationPreview.module.css и SkeletonDetails/Skeleton из исходного web bundle для mobile web/iOS/Android. |
| component.meetingSettings.coverGap | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .cover-row |
| component.meetingSettings.coverRadius | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .cover-preview |
| component.meetingSettings.coverSize | dimension | 52px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .cover-preview |
| component.messageDelivery.indicatorSize | dimension | 12px | Постоянный слот спиннера отправки в строке metadata без изменения высоты сообщения. |
| component.messageDelivery.pendingDelay | duration | 2000ms | Прямое решение пользователя: индикатор только после двух секунд отправки. |
| component.mobileAvatar.fallbackOpacity | number | 0.7 | Публикационная привязка уже нормализованного нейтрального силуэта по позднему общему решению; normalize.css [data-mobile-silhouette], source/hash в identity-token-bindings-6.2.json. |
| component.mobileAvatar.fallbackRatio | number | 0.72 | Публикационная привязка уже нормализованного нейтрального силуэта по позднему общему решению; normalize.css [data-mobile-silhouette], source/hash в identity-token-bindings-6.2.json. |
| component.mobileAvatar.normalSize | dimension | 40px | сохранённая геометрия Avatar, новый fallback по info-r2 |
| component.mobileAvatar.profileSize | dimension | 86px | сохранённая геометрия Avatar.large; фото/fallback по profile-r2 |
| component.mobileAvatar.smallSize | dimension | 32px | сохранённая геометрия Avatar.small |
| component.mobileBack.disabledOpacity | number | 0.45 | navigation-r2/PageBack.module.css |
| component.mobileBack.focusRadius | dimension | 12px | navigation-r2/PageBack.module.css |
| component.mobileBack.iconSize | dimension | 24px | navigation-r2/PageBack.tsx |
| component.mobileBack.pressedOpacity | number | 0.55 | navigation-r2/PageBack.module.css |
| component.mobileBack.strokeWidth | number | 1.7 | navigation-r2/PageBack.tsx |
| component.mobileBrand.gap | dimension | 7px | Header onboarding-r4/r5 из неизменённого эталона:29px/7px/tracking-1px; существующие header/desktop-варианты не меняются. |
| component.mobileBrand.markSize | dimension | 29px | Header onboarding-r4/r5 из неизменённого эталона:29px/7px/tracking-1px; существующие header/desktop-варианты не меняются. |
| component.mobileBrand.tracking | dimension | 1px | Header onboarding-r4/r5 из неизменённого эталона:29px/7px/tracking-1px; существующие header/desktop-варианты не меняются. |
| component.mobileCalendar.dotsInset | dimension | 7px | Принятый calendar-r7/source/CalendarGrid.module.css и CalendarDay.module.css; мобильная композиция без изменений desktop. |
| component.mobileCalendar.selectionRadius | dimension | 9px | calendar-r7: скругление квадрата |
| component.mobileCalendar.selectionSize | dimension | 36px | calendar-r7: квадрат внутри target |
| component.mobileCalendar.titleSize | dimension | 20px | Принятый calendar-r7/source/CalendarGrid.module.css и CalendarDay.module.css; мобильная композиция без изменений desktop. |
| component.mobileCalendar.titleTracking | dimension | 0.5px | Принятый calendar-r7/source/CalendarGrid.module.css и CalendarDay.module.css; мобильная композиция без изменений desktop. |
| component.mobileChat.bubbleCornerRadius | dimension | 6px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .bubble |
| component.mobileChat.bubbleFocusOffset | dimension | 3px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .bubble |
| component.mobileChat.bubbleInsetBlock | dimension | 11px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .bubble |
| component.mobileChat.bubbleInsetInline | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .bubble |
| component.mobileChat.bubbleRadius | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .bubble |
| component.mobileChat.compactHeaderHeight | dimension | 56px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-height500 |
| component.mobileChat.headerHeight | dimension | 66px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css tokens.css --draft-header-height; минимальная базовая высота |
| component.mobileChat.headerInset | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .chat-header |
| component.mobileChat.iconSize | dimension | 22px | Принятая ревизия 2026-10-27-telegram-chat, tokens.css .icon; общий видимый размер иконки чата. Emoji toggle остаётся отдельной ролью chatComposer.emojiIcon 23. Target платформы не меняется. |
| component.mobileChat.inlineActionInsetBlock | dimension | 9px | Принятый raw 2026-10-27-telegram-chat, chat.css .small-action; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineActionInsetInline | dimension | 15px | Принятый raw 2026-10-27-telegram-chat, chat.css .small-action; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineActionRadius | dimension | 10px | Принятый raw 2026-10-27-telegram-chat, chat.css .small-action; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineBadgeInsetBlock | dimension | 1px | Принятый raw 2026-10-27-telegram-chat, chat.css .status-label; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineBadgeInsetInline | dimension | 5px | Принятый raw 2026-10-27-telegram-chat, chat.css .status-label; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineBadgeRadius | dimension | 5px | Принятый raw 2026-10-27-telegram-chat, chat.css .status-label; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineEyebrowGap | dimension | 7px | Принятый raw 2026-10-27-telegram-chat, chat.css .card-eyebrow; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineEyebrowIcon | dimension | 15px | Принятый raw 2026-10-27-telegram-chat, chat.css .card-eyebrow .icon; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineFootGap | dimension | 9px | Принятый raw 2026-10-27-telegram-chat, chat.css .card-foot; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineIndent | dimension | 36px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .inline-card |
| component.mobileChat.inlineInset | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .inline-card |
| component.mobileChat.inlineMaximumWidth | dimension | 440px | Принятый raw 2026-10-27-telegram-chat, chat.css .inline-card; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineRadius | dimension | 17px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .inline-card |
| component.mobileChat.inlineTaskChevron | dimension | 18px | Raw 2026-10-27-telegram-chat, chat.css .task-title .icon |
| component.mobileChat.inlineTitleAfterGap | dimension | 5px | Raw 2026-10-27-telegram-chat, chat.css .inline-card h2 |
| component.mobileChat.inlineVoteInsetBlock | dimension | 9px | Принятый raw 2026-10-27-telegram-chat, chat.css .vote-option; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineVoteInsetInline | dimension | 12px | Принятый raw 2026-10-27-telegram-chat, chat.css .vote-option; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.inlineVoteRadius | dimension | 10px | Принятый raw 2026-10-27-telegram-chat, chat.css .vote-option; общая роль карточки опроса/задачи в чате. |
| component.mobileChat.markHeight | dimension | 40px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| component.mobileChat.markRadius | dimension | 13px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| component.mobileChat.markWidth | dimension | 40px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| component.mobileChat.messageAvatar | dimension | 28px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .avatar |
| component.mobileChat.messageGap | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .message |
| component.mobileChat.narrowMarkHeight | dimension | 34px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-width350 .meeting-mark |
| component.mobileChat.narrowMarkRadius | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-width350 .meeting-mark |
| component.mobileChat.narrowMarkWidth | dimension | 30px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css @media max-width350 .meeting-mark |
| component.mobileChatSend.circleSize | dimension | 38px | chat-r6: круг внутри target44 |
| component.mobileChatSend.iconSize | dimension | 20px | chat-r6: вертикальная стрелка |
| component.mobileCreation.coverIconSize | dimension | 28px | Неизменённый create-r5: media svg28. |
| component.mobileCreation.coverSize | dimension | 86px | Утверждённый create-r5/source/CoverEditor.module.css: квадрат86, не settingscompact52. |
| component.mobileCreation.fieldHeight | dimension | 48px | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.fieldRadius | dimension | 13px | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.hintIconSize | dimension | 14px | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.invalidBackgroundMix | number | 0.03 | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.invalidBorderMix | number | 0.65 | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.invalidRingOpacity | number | 0.07 | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.invalidRingWidth | dimension | 3px | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.labelSize | dimension | 14px | Неизменённый approved create-r5/source/MeetingFields.module.css и FieldHint: принятые поля/подсказки create-r4; карта исключена. |
| component.mobileCreation.titleLineHeight | number | 1.2 | Неизменённый create-r5/source/CreatePreview.module.css: header h1 line-height1.2. |
| component.mobileField.gap | dimension | 7px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field |
| component.mobileField.iconSize | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .date-field/.input-with-icon |
| component.mobileField.insetBlock | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field |
| component.mobileField.insetInline | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field |
| component.mobileField.minimumHeight | dimension | 46px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field; max с target платформы |
| component.mobileField.radius | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field > input/textarea/select |
| component.mobileField.textAreaMinimumHeight | dimension | 72px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field > textarea |
| component.mobileForm.dateDeleteGap | dimension | 6px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .date-option |
| component.mobileForm.dateOptionGap | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .date-options |
| component.mobileForm.groupGap | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-form > .sheet-scroll |
| component.mobileForm.sectionGap | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .form-section |
| component.mobileForm.switchHeight | dimension | 24px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .switch; native использует системный Switch |
| component.mobileForm.switchRowHeight | dimension | 48px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .switch-row |
| component.mobileForm.switchThumbInset | dimension | 3px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .switch::after; web |
| component.mobileForm.switchThumbSize | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .switch::after; web |
| component.mobileForm.switchWidth | dimension | 38px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .switch; native использует системный Switch |
| component.mobileForm.twoFieldGap | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .two-fields |
| component.mobileInfo.companyAllInsetTop | dimension | 2px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyAllMinimumHeight | dimension | 32px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipGap | dimension | 6px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipHeight | dimension | 36px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipInsetBlock | dimension | 6px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipInsetEnd | dimension | 10px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipInsetStart | dimension | 6px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipOverlap | dimension | 4px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyChipRadius | dimension | 12px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.companyMoreMinimumWidth | dimension | 40px | Неизменённый approved-designs info: assets/navigation-r2/nav-info/frame.html, Компания/состав. Основа info-r2 + общая коррекция навигации. |
| component.mobileInfo.coverHeight | dimension | 156px | Неизменённый approved info-r2/source/ui/InfoBody и InfoFooter. |
| component.mobileInfo.organizerAvatarSize | dimension | 32px | Неизменённый approved info-r2/source/ui/InfoBody и InfoFooter. |
| component.mobileInfo.responseIconSize | dimension | 36px | Неизменённый approved info-r2/source/ui/InfoBody и InfoFooter. |
| component.mobileInfo.titleLineHeight | dimension | 31px | Неизменённый approved info-r2/source/ui/InfoBody и InfoFooter. |
| component.mobileInfo.titleSize | dimension | 25px | Неизменённый approved info-r2/source/ui/InfoBody и InfoFooter. |
| component.mobileInfo.titleTracking | number | -0.5 | Неизменённый approved info-r2/source/ui/InfoBody и InfoFooter. |
| component.mobileInvitation.closedCopyGap | dimension | 5px | Неизменённый invite-r3/source/InvitationClosed и InvitationPreview: icon18, gap5, return ArrowLeft15. |
| component.mobileInvitation.closedGap | dimension | 22px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.closedGlyph | dimension | 18px | Неизменённый invite-r3/source/InvitationClosed и InvitationPreview: icon18, gap5, return ArrowLeft15. |
| component.mobileInvitation.closedIconRadius | dimension | 11px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.coverHeight | dimension | 180px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.descriptionFontSize | dimension | 14px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.factsInsetBlock | dimension | 18px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.footerInsetBottom | dimension | 34px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.footerInsetTop | dimension | 18px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.headerHeight | dimension | 56px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.returnIconSize | dimension | 15px | Неизменённый invite-r3/source/InvitationClosed и InvitationPreview: icon18, gap5, return ArrowLeft15. |
| component.mobileInvitation.titleGap | dimension | 18px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.titleSize | dimension | 30px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.titleWeight | number | 720 | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitation.topInset | dimension | 62px | Утверждённый invite-r3/source/InvitationPreview, InvitationActions и InvitationClosed; прежние raw не меняются. |
| component.mobileInvitationCard.answerGap | dimension | 7px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.answerInsetBottom | dimension | 15px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.answerInsetStart | dimension | 17px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.coverDateReserve | dimension | 95px | Привязка принятых иконок/отступов списка и InvitationCard перед удалением прежних mobile-overrides; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.dateInset | dimension | 14px | Принятые CalendarScreen.errorIcon и InvitationCard.date: отступы22/14; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.footerReserve | dimension | 44px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.insetInline | dimension | 17px | Привязка принятых иконок/отступов списка и InvitationCard перед удалением прежних mobile-overrides; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.insetTop | dimension | 26px | Привязка принятых иконок/отступов списка и InvitationCard перед удалением прежних mobile-overrides; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationCard.minimumHeight | dimension | 176px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitationResponse.actionsGap | dimension | 22px | Привязка invitations-r2 .response margin-top22; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| component.mobileInvitations.counterRadius | dimension | 9px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitations.counterSize | dimension | 28px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitations.explanationLineHeight | number | 1.6 | Принятые заголовок и пояснение мобильных состояний; источник/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitations.explanationMaxWidth | dimension | 360px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileInvitations.scrollBottom | dimension | 26px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileLaunch.gap | dimension | 16px | launch-r1 / ux.md |
| component.mobileLaunch.markSize | dimension | 53px | launch-r1 / ux.md |
| component.mobileLaunch.trackingRatio | number | 0.052 | launch-r1: letter-spacing -2.288px при font-size44; отрицательный коэффициент применяется адаптером к размеру текста |
| component.mobileMeetings.agendaTracking | dimension | 0.25px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.createIconSize | dimension | 17px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.createInsetInline | dimension | 13px | Привязка принятых иконок/отступов списка и InvitationCard перед удалением прежних mobile-overrides; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyActionInline | dimension | 13px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyDayGap | dimension | 13px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyDayIcon | dimension | 24px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyDayInsetBlock | dimension | 25px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyGlyph | dimension | 40px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyInset | dimension | 18px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.emptyTop | dimension | 70px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.headingInsetBottom | dimension | 12px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.headingInsetTop | dimension | 17px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.headingMinimumHeight | dimension | 73px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.monthTracking | dimension | 1px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.narrowAgendaWidth | dimension | 180px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.periodInsetBottom | dimension | 14px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.periodInsetTop | dimension | 13px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.periodMinimumHeight | dimension | 48px | Принятый header calendar-r7:48px область периода и адаптивный размер заголовка7vw между24/28px. |
| component.mobileMeetings.titleLineHeight | number | 1.2 | Принятый мобильный header/unread, source/hash в meetings-token-bindings-6.2.json. |
| component.mobileMeetings.titleMaximum | dimension | 28px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.titleMinimum | dimension | 24px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.titleTracking | dimension | 0.9px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMeetings.titleWeight | fontWeight | 720 | Принятый мобильный header/unread, source/hash в meetings-token-bindings-6.2.json. |
| component.mobileMeetings.titleWidthRatio | number | 0.07 | Принятый header calendar-r7:48px область периода и адаптивный размер заголовка7vw между24/28px. |
| component.mobileMeetings.undatedCountRadius | dimension | 7px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.undatedInset | dimension | 14px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.undatedMargin | dimension | 14px | Принятый calendar-r7: CalendarScreen.undated/CalendarList.month/CalendarAgenda.empty; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileMeetings.viewIconSize | dimension | 20px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileMessage.composerActionRadius | dimension | 14px | Неизменённый chat-r6: add-control44 и radius14, внутри общей sticky-панели. |
| component.mobileMessage.composerInputRadius | dimension | 14px | Неизменённый chat-r6/source/build.mjs: overrides ReactionChip и SendMessage; visual reaction28/radius14, transparent44/48 hit target. |
| component.mobileMessage.cornerRadius | dimension | 4px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.errorOffset | dimension | 38px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.errorSize | dimension | 32px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.footerGap | dimension | 12px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.footerInsetTop | dimension | 3px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.insetBottom | dimension | 7px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.insetInline | dimension | 13px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.insetTop | dimension | 10px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.maximumWidthRatio | number | 0.94 | Неизменённый approved chat-r6/source/MessageReceipt и baseline desktop FeedRecord до мобильного переноса. |
| component.mobileMessage.menuCardRadius | dimension | 16px | Неизменённый chat-r6/source/MessageMenu.module.css: quickpill30, card16, width316 и interval8. |
| component.mobileMessage.menuQuickRadius | dimension | 30px | Неизменённый chat-r6/source/MessageMenu.module.css: quickpill30, card16, width316 и interval8. |
| component.mobileMessage.menuReadHeight | dimension | 52px | Неизменённый chat-r6/source/MessageMenu.module.css: quickpill30, card16, width316 и interval8. |
| component.mobileMessage.menuWidth | dimension | 316px | Неизменённый chat-r6/source/MessageMenu.module.css: quickpill30, card16, width316 и interval8. |
| component.mobileMessage.metadataGap | dimension | 7px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.metadataLineHeight | dimension | 14px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.metadataSize | dimension | 10px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.minimumWidth | dimension | 120px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.reactionGap | dimension | 5px | Неизменённый chat-r6/source/build.mjs: overrides ReactionChip и SendMessage; visual reaction28/radius14, transparent44/48 hit target. |
| component.mobileMessage.reactionHeight | dimension | 28px | Неизменённый chat-r6/source/build.mjs: overrides ReactionChip и SendMessage; visual reaction28/radius14, transparent44/48 hit target. |
| component.mobileMessage.reactionInsetBlock | dimension | 3px | Неизменённый chat-r6/source/build.mjs: overrides ReactionChip и SendMessage; visual reaction28/radius14, transparent44/48 hit target. |
| component.mobileMessage.reactionInsetInline | dimension | 9px | Неизменённый chat-r6/source/build.mjs: overrides ReactionChip и SendMessage; visual reaction28/radius14, transparent44/48 hit target. |
| component.mobileMessage.reactionRadius | dimension | 14px | Неизменённый chat-r6/source/build.mjs: overrides ReactionChip и SendMessage; visual reaction28/radius14, transparent44/48 hit target. |
| component.mobileMessage.receiptHeight | dimension | 18px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.receiptMutedOpacity | number | 0.48 | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.receiptReadStroke | number | 1.9 | Неизменённый approved chat-r6/source/MessageReceipt и baseline desktop FeedRecord до мобильного переноса. |
| component.mobileMessage.receiptSentStroke | number | 1.5 | Неизменённый approved chat-r6/source/MessageReceipt и baseline desktop FeedRecord до мобильного переноса. |
| component.mobileMessage.receiptWidth | dimension | 22px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.shadowBlur | dimension | 1px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.shadowOffset | dimension | 2px | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileMessage.smileStroke | number | 1.45 | Неизменённый approved chat-r6/source/PrototypeMessage.module.css, MessageReceipt и ErrorIndicator; общая поздняя sticky-коррекция. |
| component.mobileNavigation.androidLabelLineHeight | dimension | 13.5px | Привязка Android baseline lineHeight13.5; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| component.mobileNavigation.iconGap | dimension | 3px | Привязка iOS/Android baseline gap3; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| component.mobileNavigation.iconStroke | number | 1.7 | Привязка iOS baseline обычного navigation icon; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| component.mobileNavigation.padding | dimension | 7px | Привязка вертикального inset (navigation.height62 − target48) / 2, iOS baseline7; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| component.mobileNavigation.selectedIconStroke | number | 1.8 | Привязка iOS baseline выбранного navigation icon; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| component.mobileOnboarding.artworkGap | dimension | 30px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.artworkHeight | dimension | 360px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.copyGap | dimension | 18px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.copyMinimumHeight | dimension | 180px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.footerMinimumHeight | dimension | 110px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.insetInline | dimension | 27px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.nextHeight | dimension | 52px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.nextInsetInline | dimension | 23px | onboarding-r4/r5, .next padding-inline23px из computed style. |
| component.mobileOnboarding.nextMinimumWidth | dimension | 135px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.progressDotSize | dimension | 6px | onboarding-r4/r5: невыбранная точка6×6. |
| component.mobileOnboarding.progressSelectedWidth | dimension | 19px | onboarding-r4/r5: выбранная капсула19×6, radius.pill. |
| component.mobileOnboarding.progressSlotWidth | dimension | 27px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.progressVisualHeight | dimension | 34px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.tallArtworkHeight | dimension | 390px | onboarding-r4/r5, сохранённая композиция; computed style preparation/onboarding-layout-audit.json и onboarding-style-audit.json. Системные fake-frame insets не переносятся в приложения. |
| component.mobileOnboarding.titleTracking | dimension | 1px | onboarding-r4/r5 title: tracking-1px; размер/вес/lineHeight уже опубликованы6.0.0. |
| component.mobilePage.insetTop | dimension | 28px | Вертикальный отступ мобильной страницы из действующих app-форм и принятых create/help/profile; desktop не меняется. |
| component.mobilePeopleChip.avatarSize | dimension | 21px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip i |
| component.mobilePeopleChip.borderWidth | dimension | 2px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip |
| component.mobilePeopleChip.gap | dimension | 4px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip |
| component.mobilePeopleChip.insetBlock | dimension | 3px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip |
| component.mobilePeopleChip.insetEnd | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip |
| component.mobilePeopleChip.insetStart | dimension | 3px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip |
| component.mobilePeopleChip.moreInsetBlock | dimension | 4px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-more |
| component.mobilePeopleChip.moreInsetInline | dimension | 7px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-more |
| component.mobilePeopleChip.moreWidth | dimension | 32px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-more |
| component.mobilePeopleChip.openerHeight | dimension | 48px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-summary |
| component.mobilePeopleChip.overlap | dimension | 4px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip margin-right negative |
| component.mobileRequired.fontSize | dimension | 18px | Заметная звёздочка обязательного поля: settings-r3/source/ui/SettingsForm и help-r2/src/pages/help/ui/FeedbackFields, .required/.legend span. |
| component.mobileRequired.fontWeight | fontWeight | 650 | Вес звёздочки в согласованных settings-r3/help-r2:650. |
| component.mobileRoster.actionHeight | dimension | 52px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .list-action |
| component.mobileRoster.actionIcon | dimension | 20px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .list-action > .icon |
| component.mobileRoster.avatarSize | dimension | 32px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .person-row .avatar |
| component.mobileRoster.rowGap | dimension | 11px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .person-row |
| component.mobileRoster.rowHeight | dimension | 55px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .person-row |
| component.mobileSheet.backdropBlur | dimension | 0px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-backdrop; эта ревизия без blur |
| component.mobileSheet.buttonHeight | dimension | 46px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .primary-button/.secondary-button; max с target платформы |
| component.mobileSheet.buttonInsetBlock | dimension | 11px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .primary-button/.secondary-button |
| component.mobileSheet.buttonInsetInline | dimension | 16px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .primary-button/.secondary-button |
| component.mobileSheet.buttonRadius | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .primary-button/.secondary-button |
| component.mobileSheet.compactTopReserve | dimension | 20px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css @media max-height500 .sheet |
| component.mobileSheet.contentInsetBottom | dimension | 24px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-scroll |
| component.mobileSheet.contentInsetInline | dimension | 20px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-scroll |
| component.mobileSheet.contentInsetTop | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-scroll |
| component.mobileSheet.footerInsetBlock | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-actions |
| component.mobileSheet.footerInsetBottom | dimension | 16px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-actions; max с safe area |
| component.mobileSheet.grabInsetInline | dimension | 16px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-grab-area |
| component.mobileSheet.grabInsetTop | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-grab-area |
| component.mobileSheet.handleGap | dimension | 6px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-handle |
| component.mobileSheet.handleHeight | dimension | 4px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-handle |
| component.mobileSheet.handleWidth | dimension | 32px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-handle |
| component.mobileSheet.headerHeight | dimension | 48px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header; минимум |
| component.mobileSheet.minimumHeight | dimension | 150px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet; адаптируется к доступному viewport |
| component.mobileSheet.radius | dimension | 24px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet |
| component.mobileSheet.topReserve | dimension | 50px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet max-height; адаптируется к safe area/IME |
| component.mobileState.actionIconSize | dimension | 17px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.actionMinimumHeight | dimension | 48px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.compactTitleLineHeight | number | 1.3 | Принятые заголовок и пояснение мобильных состояний; источник/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.compactTitleSize | dimension | 22px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.glyphSize | dimension | 32px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.glyphStroke | number | 1.5 | Привязка принятых иконок/отступов списка и InvitationCard перед удалением прежних mobile-overrides; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.iconRadius | dimension | 20px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.iconSize | dimension | 64px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.largeGlyphSize | dimension | 34px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.largeIconGap | dimension | 22px | Принятые CalendarScreen.errorIcon и InvitationCard.date: отступы22/14; source/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.largeIconRadius | dimension | 24px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.largeIconSize | dimension | 72px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.largeTitleWidth | dimension | 250px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.panelInsetBlock | dimension | 30px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.panelInsetInline | dimension | 22px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.refreshActionGlyphSize | dimension | 18px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.refreshActionRadius | dimension | 10px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.refreshGlyphSize | dimension | 19px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.refreshInsetStart | dimension | 14px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.refreshRadius | dimension | 14px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.titleSize | dimension | 23px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.titleTracking | dimension | 0.5px | Привязка принятого list-r3/calendar-r7/invitations-r2, без изменения desktop; источники/hash в meetings-state-bindings-6.2.json. |
| component.mobileState.titleWeight | fontWeight | 650 | Принятые заголовок и пояснение мобильных состояний; источник/hash в meetings-state-bindings-6.2.json. |
| component.mobileSticky.insetInline | dimension | 20px | create-r5/source/CreateMeetingForm.module.css |
| component.mobileSticky.insetTop | dimension | 16px | create-r5/source/CreateMeetingForm.module.css |
| component.mobileSticky.radius | dimension | 24px | create-r4/r5: только верхние углы |
| component.mobileSticky.shadowBlur | dimension | 28px | create-r5/source/CreateMeetingForm.module.css |
| component.mobileSticky.shadowOpacity | number | 0.3333333333333333 | create-r5: #0005, чёрный с alpha 5/15 |
| component.mobileSticky.shadowUpOffset | dimension | 8px | create-r5: отрицательное направление Y в адаптере |
| component.mobileUnread.gap | dimension | 5px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileUnread.iconSize | dimension | 14px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileUnread.iconStrokeWidth | number | 1.6 | Принятый мобильный header/unread, source/hash в meetings-token-bindings-6.2.json. |
| component.mobileUnread.insetBottom | dimension | 12px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileUnread.insetStart | dimension | 17px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.mobileUnread.reserveEnd | dimension | 138px | Принятые list-r3/calendar-r7: общий мобильный список/календарь; source/hash в meetings-token-bindings-6.2.json. Desktop без изменений. |
| component.navigation.detailsSidebarWidth | dimension | 280px | Ширина боковой панели сведений встречи из styles.css:646 |
| component.navigation.height | dimension | 62px | Основная нижняя навигация height |
| component.navigation.icon | dimension | 19px | Основная нижняя навигация icon |
| component.navigation.inset | dimension | 16px | Основная нижняя навигация inset |
| component.navigation.sidebarWidth | dimension | 222px | Ширина боковой навигации desktop и tablet из styles.css:1273 |
| component.participantChip.avatarSize | dimension | 20px | Размер инициала из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.contentGap | dimension | 5px | Промежуток между инициалом и именем из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.groupTopInset | dimension | 22px | Отступ группы от предыдущего блока desktop из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.groupTopInsetMobile | dimension | 18px | Отступ группы от предыдущего блока mobile из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.height | dimension | 29px | Высота видимой плашки из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.morePaddingBlock | dimension | 3px | Вертикальный отступ счётчика из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.morePaddingInline | dimension | 9px | Горизонтальный отступ счётчика из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.overlap | dimension | 10px | Величина перекрытия соседних плашек из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.paddingBlock | dimension | 2px | Вертикальный отступ плашки из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.paddingEnd | dimension | 16px | Конечный отступ плашки из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.paddingStart | dimension | 3px | Начальный отступ плашки из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantChip.radius | dimension | 30px | Радиус плашки из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; Android текст — sp |
| component.participantRoster.avatarSize | dimension | 30px | Аватар строки полного состава из .avatar исходного styles.css |
| component.participantRoster.rowGap | dimension | 14px | Промежуток аватара и текста из .row исходного styles.css |
| component.participantRoster.stackGap | dimension | 18px | Интервал строк из .stack исходного styles.css,18px |
| component.photoPreview.height | dimension | 132px | Компактный iOS preview по прямой коррекции пользователя 28.10.2026 |
| component.photoPreview.removeOutset | dimension | 6px | Компактный iOS preview по прямой коррекции пользователя 28.10.2026 |
| component.photoPreview.removeSize | dimension | 24px | Компактный iOS preview по прямой коррекции пользователя 28.10.2026 |
| component.photoPreview.width | dimension | 176px | Компактный iOS preview по прямой коррекции пользователя 28.10.2026 |
| component.reactionChip.borderWidth | dimension | 1px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-chip |
| component.reactionChip.gap | dimension | 5px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-chip |
| component.reactionChip.openerIcon | dimension | 18px | Исторический размер 1.3.0; отдельные постоянные opener-кнопки отменены в 2.0.0. Не использовать для сообщений. |
| component.reactionChip.paddingBlock | dimension | 4px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-chip |
| component.reactionChip.paddingInline | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-chip |
| component.reactionPeople.filterInsetBlock | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .reactor-filters button |
| component.reactionPeople.filterInsetInline | dimension | 13px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .reactor-filters button |
| component.reactionPeople.filterRadius | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .reactor-filters button |
| component.reactionPicker.anchorGap | dimension | 8px | Принятая ревизия 2026-10-27-telegram-chat, src/pages/chat/lib/reactions.ts; промежуток между bubble и picker |
| component.reactionPicker.contextGap | dimension | 24px | Принятая ревизия 2026-10-27-telegram-chat, src/pages/chat/lib/reactions.ts; резерв контекста при расчёте full height |
| component.reactionPicker.contextInsetBottom | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-context |
| component.reactionPicker.contextInsetInline | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-context |
| component.reactionPicker.contextInsetTop | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-context |
| component.reactionPicker.edgeInset | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-host calc100vw-16 |
| component.reactionPicker.enterOffset | dimension | 8px | Коррекция 2.0.0: enterOffset выбранного сообщения/реакционной поверхности |
| component.reactionPicker.enterScale | number | 0.92 | Коррекция 2.0.0: масштаб enterScale; Reduce Motion отключает |
| component.reactionPicker.fullInsetInline | dimension | 2px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .expanded |
| component.reactionPicker.fullRadius | dimension | 20px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-picker.expanded |
| component.reactionPicker.longPressMovementTolerance | dimension | 12px | Принятая ревизия 2026-10-27-telegram-chat, src/pages/chat/lib/reactions.ts; порог отмены удержания при движении; native системный gesture recognizer |
| component.reactionPicker.maximumWidth | dimension | 316px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-host |
| component.reactionPicker.messageContextReserve | dimension | 80px | Принятая ревизия 2026-10-27-telegram-chat, src/pages/chat/lib/reactions.ts; максимальный резерв видимой части bubble |
| component.reactionPicker.minimumFullHeight | dimension | 160px | Принятая ревизия 2026-10-27-telegram-chat, src/pages/chat/lib/reactions.ts; ориентир минимальной сетки, ограничивается доступной областью |
| component.reactionPicker.preferredFullHeight | dimension | 352px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .expanded; фактический максимум равен свободной области разговора |
| component.reactionPicker.pressedScale | number | 0.97 | Коррекция 2.0.0: масштаб pressedScale; Reduce Motion отключает |
| component.reactionPicker.quickInset | dimension | 4px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-picker |
| component.reactionPicker.quickRadius | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .reaction-picker |
| component.reactionPicker.selectedOutlineWidth | dimension | 2px | Коррекция 2.0.0: selectedOutlineWidth выбранного сообщения/реакционной поверхности |
| component.reactionPicker.topInset | dimension | 4px | Принятая ревизия 2026-10-27-telegram-chat, src/pages/chat/lib/reactions.ts; резерв верхней границы conversation |
| component.rsvpResult.brandMarkSize | dimension | 30px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.brandTracking | dimension | 0.8px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.brandWeight | number | 750 | Одобренный мобильный заголовок Declined: font-weight750 |
| component.rsvpResult.cardPaddingBlock | dimension | 28px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.cardPaddingInline | dimension | 20px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.copyLineHeight | dimension | 23px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.desktopHeadingTracking | dimension | 0.7px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.desktopIconGlyph | dimension | 30px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.desktopWidth | dimension | 480px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.headerBrandGap | dimension | 10px | Явно принятая шапка нового результата отказа, desktop-mvp/invite-r2/src/shared/ui/Brand и widgets/public-header; остальные desktop-страницы сохраняются. |
| component.rsvpResult.headerBrandLineHeight | dimension | 36px | Явно принятая шапка нового результата отказа, desktop-mvp/invite-r2/src/shared/ui/Brand и widgets/public-header; остальные desktop-страницы сохраняются. |
| component.rsvpResult.headerBrandSize | dimension | 25px | Явно принятая шапка нового результата отказа, desktop-mvp/invite-r2/src/shared/ui/Brand и widgets/public-header; остальные desktop-страницы сохраняются. |
| component.rsvpResult.headerBrandTracking | dimension | 1.1px | Явно принятая шапка нового результата отказа, desktop-mvp/invite-r2/src/shared/ui/Brand и widgets/public-header; остальные desktop-страницы сохраняются. |
| component.rsvpResult.headerCompactHeight | dimension | 780px | Границы принятой шапки нового результата из неизменённого desktop-mvp/invite-r2/PublicHeader.module.css. Старые desktop экраны не меняются. |
| component.rsvpResult.headerInsetBlock | dimension | 28px | Неизменённый desktop invite-r2/PublicHeader: padding28px; исправление отсутствовавшей роли. |
| component.rsvpResult.headerMarkSize | dimension | 36px | Явно принятая шапка нового результата отказа, desktop-mvp/invite-r2/src/shared/ui/Brand и widgets/public-header; остальные desktop-страницы сохраняются. |
| component.rsvpResult.headerMaximumWidth | dimension | 1200px | Существующая шапка одобренного desktop invite-r2/PublicHeader; используется в результате отказа. |
| component.rsvpResult.headerMediumBreakpoint | dimension | 1000px | Границы принятой шапки нового результата из неизменённого desktop-mvp/invite-r2/PublicHeader.module.css. Старые desktop экраны не меняются. |
| component.rsvpResult.headerMenuWidth | dimension | 180px | Явно принятая шапка нового результата отказа, desktop-mvp/invite-r2/src/shared/ui/Brand и widgets/public-header; остальные desktop-страницы сохраняются. |
| component.rsvpResult.headerNarrowBreakpoint | dimension | 850px | Границы принятой шапки нового результата из неизменённого desktop-mvp/invite-r2/PublicHeader.module.css. Старые desktop экраны не меняются. |
| component.rsvpResult.meetingLineHeight | dimension | 23px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.mobileCardGap | dimension | 44px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.mobileCopyLineHeight | dimension | 21px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.mobileHeadingSize | dimension | 25px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.mobileHeadingTracking | dimension | 0.6px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.mobileIconGlyph | dimension | 26px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.mobileIconSize | dimension | 56px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpResult.topInset | dimension | 60px | Привязка утверждённого response-routing-r1/source/mobile/Declined и desktop-mvp/invite-r2/DeclinedScreen; эталоны не менялись. |
| component.rsvpSystem.gap | dimension | 3px | Привязка неизменённого response-routing-r1/mobile/chat/frame.html: system-event p13/18, time11/14, gap3, opacity.85; системная строка RSVP. |
| component.rsvpSystem.textLineHeight | dimension | 18px | Привязка неизменённого response-routing-r1/mobile/chat/frame.html: system-event p13/18, time11/14, gap3, opacity.85; системная строка RSVP. |
| component.rsvpSystem.textSize | dimension | 13px | Привязка неизменённого response-routing-r1/mobile/chat/frame.html: system-event p13/18, time11/14, gap3, opacity.85; системная строка RSVP. |
| component.rsvpSystem.timeLineHeight | dimension | 14px | Привязка неизменённого response-routing-r1/mobile/chat/frame.html: system-event p13/18, time11/14, gap3, opacity.85; системная строка RSVP. |
| component.rsvpSystem.timeOpacity | number | 0.85 | Привязка неизменённого response-routing-r1/mobile/chat/frame.html: system-event p13/18, time11/14, gap3, opacity.85; системная строка RSVP. |
| component.rsvpSystem.timeSize | dimension | 11px | Привязка неизменённого response-routing-r1/mobile/chat/frame.html: system-event p13/18, time11/14, gap3, opacity.85; системная строка RSVP. |
| component.sheet.backdropBlur | dimension | 5px | Размытие фона web-панели из утверждённого date-poll-v1/date-poll.css .poll-overlay |
| component.taskDetails.actionsGap | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-detail-actions |
| component.taskDetails.actionsInsetTop | dimension | 22px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-detail-actions |
| component.taskDetails.factInsetBlock | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-facts > div |
| component.taskDetails.factsGap | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-facts > div |
| component.taskDetails.factsInsetTop | dimension | 7px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-facts |
| motion.duration.calendarMonth | duration | 180ms | CalendarGrid month-enter baseline180ms. |
| motion.duration.card | duration | 220ms | Длительность card |
| motion.duration.cover | duration | 280ms | Длительность cover |
| motion.duration.emojiPanelEnter | duration | 180ms | 2.2.0: вход панели эмодзи; Reduce Motion переключает сразу |
| motion.duration.emojiPanelExit | duration | 150ms | 2.2.0: выход панели эмодзи; Reduce Motion переключает сразу |
| motion.duration.fast | duration | 150ms | Длительность fast |
| motion.duration.mobileLaunch | duration | 1200ms | launch-r1: один quintic smoothstep оборот, без повторения при resume |
| motion.duration.mobileSheet | duration | 180ms | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet; native системное движение, reduced motion отключает сдвиг |
| motion.duration.navigation | duration | 260ms | Длительность navigation |
| motion.duration.photo | duration | 290ms | Длительность photo |
| motion.duration.reactionEnter | duration | 180ms | Коррекция 2.0.0: reactionEnter контекстных реакций; Reduce Motion без scale/translation |
| motion.duration.reactionExit | duration | 150ms | Коррекция 2.0.0: reactionExit контекстных реакций; Reduce Motion без scale/translation |
| motion.duration.reactionFeedback | duration | 150ms | Коррекция 2.0.0: reactionFeedback контекстных реакций; Reduce Motion без scale/translation |
| motion.duration.reactionLongPress | duration | 450ms | Web-порог удержания 450 ms; native системный long press, доступные действия на самом сообщении/чипе без постоянных кнопок |
| motion.easing.calendarMonth | cubicBezier | cubic-bezier(0, 0, 0.58, 1) | CalendarGrid month-enter baseline CSS ease-out. |
| motion.easing.standard | cubicBezier | cubic-bezier(0.2, 0.7, 0.3, 1) | Плавное завершение движения |
| radius.badge | dimension | 8px | Радиус badge |
| radius.card | dimension | 22px | Радиус card |
| radius.control | dimension | 12px | Радиус control |
| radius.cover | dimension | 16px | Радиус cover |
| radius.pill | dimension | 999px | Радиус pill |
| radius.sheet | dimension | 24px | Радиус sheet |
| space.s0 | dimension | 0px | Шаг интервала 0 |
| space.s1 | dimension | 1px | Шаг интервала 1 |
| space.s10 | dimension | 10px | Шаг интервала 10 |
| space.s12 | dimension | 12px | Шаг интервала 12 |
| space.s16 | dimension | 16px | Шаг интервала 16 |
| space.s2 | dimension | 2px | Шаг интервала 2 |
| space.s20 | dimension | 20px | Шаг интервала 20 |
| space.s24 | dimension | 24px | Шаг интервала 24 |
| space.s3 | dimension | 3px | Шаг интервала 3 |
| space.s32 | dimension | 32px | Шаг интервала 32 |
| space.s4 | dimension | 4px | Шаг интервала 4 |
| space.s40 | dimension | 40px | Шаг интервала 40 |
| space.s48 | dimension | 48px | Шаг интервала 48 |
| space.s6 | dimension | 6px | Шаг интервала 6 |
| space.s64 | dimension | 64px | Шаг интервала 64 |
| space.s8 | dimension | 8px | Шаг интервала 8 |
| target.android | dimension | 48px | Минимальная область нажатия android |
| target.ios | dimension | 44px | Минимальная область нажатия ios |
| target.web | dimension | 44px | Минимальная область нажатия web |
| typography.family.android | fontFamily | sans-serif | Системный sans-serif; масштабирование sp |
| typography.family.ios | fontFamily | system | SF; Dynamic Type, см. платформенный контракт |
| typography.family.mobileChat | fontFamily | -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif | Принятая mobile-ревизия 2026-10-27-telegram-chat, tokens.css; системный web stack принятой мобильной композиции, native сохраняет system/sans-serif |
| typography.family.web | fontFamily | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif | Системный fallback без сетевой подмены шрифта |
| typography.lineHeight.body | number | 1.5 | Множитель высоты строки body |
| typography.lineHeight.cardTitle | number | 1.25 | Множитель высоты строки cardTitle |
| typography.lineHeight.helpAnswer | number | 1.7 | FAQ межстрочный множитель 28.10.2026 |
| typography.lineHeight.helpQuestion | number | 1.5 | FAQ межстрочный множитель 28.10.2026 |
| typography.lineHeight.label | number | 1.4 | Множитель высоты строки label |
| typography.lineHeight.meetingDescription | number | 1.6 | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .meeting-description |
| typography.lineHeight.mobileFieldDescription | number | 1.45 | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .field > textarea |
| typography.lineHeight.mobileOnboardingBody | number | 1.55 | onboarding-r4/r5 copy |
| typography.lineHeight.mobileOnboardingTitle | number | 1.08 | onboarding-r4/r5 title |
| typography.lineHeight.mobileSheetTitle | number | 1.25 | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header h1 |
| typography.size.body | dimension | 15px | Размер текста body |
| typography.size.button | dimension | 14px | Размер подписи .button из утверждённого styles.css:222; Android использует sp |
| typography.size.calendarTitle | dimension | 19px | Размер CalendarGrid baseline, без смены desktop/mobile значений; источник в calendar-token-bindings-6.2.json. |
| typography.size.calendarTitleMobile | dimension | 18px | Размер CalendarGrid baseline, без смены desktop/mobile значений; источник в calendar-token-bindings-6.2.json. |
| typography.size.calendarTitleNarrow | dimension | 16px | Размер CalendarGrid baseline, без смены desktop/mobile значений; источник в calendar-token-bindings-6.2.json. |
| typography.size.calendarTodayNarrow | dimension | 10px | Размер CalendarGrid baseline, без смены desktop/mobile значений; источник в calendar-token-bindings-6.2.json. |
| typography.size.caption | dimension | 12px | Размер текста caption |
| typography.size.cardTitle | dimension | 21px | Размер текста cardTitle |
| typography.size.cardTitleMobile | dimension | 19px | Размер текста cardTitleMobile |
| typography.size.chatMessage | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .bubble p |
| typography.size.desktopHeading | dimension | 34px | Заголовок desktop h1 из styles.css:66 |
| typography.size.emojiCategory | dimension | 23px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-categories button |
| typography.size.emojiChoice | dimension | 27px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-choice |
| typography.size.emojiGroupLabel | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .emoji-category-label |
| typography.size.emojiQuick | dimension | 28px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .quick-reactions .emoji-choice |
| typography.size.heading | dimension | 27px | Размер текста heading |
| typography.size.helpAnswer | dimension | 14px | FAQ 28.10.2026 |
| typography.size.helpQuestion | dimension | 14px | FAQ 28.10.2026 |
| typography.size.label | dimension | 11px | Размер текста label |
| typography.size.mobileActionHeading | dimension | 28px | Заголовок мобильной формы из h1 утверждённого styles.css; историческая полностраничная mobile-композиция, новые панели чата используют mobileSheetTitle |
| typography.size.mobileBrandWord | dimension | 21px | Header onboarding-r4/r5: system21/brand850. На native используется тот же смысловой размер с системными метриками. |
| typography.size.mobileChatNarrowTitle | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css narrow header |
| typography.size.mobileChatTitle | dimension | 16px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-heading |
| typography.size.mobileLaunchWord | dimension | 44px | launch-r1 / ux.md: название на native-заставке; не шапка |
| typography.size.mobileOnboardingNarrowTitle | dimension | 28px | onboarding-r5: title при узкой ширине |
| typography.size.mobileOnboardingTitle | dimension | 32px | onboarding-r5: title, композиция r4 принята |
| typography.size.mobilePeopleInitial | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip i/.tiny-avatar |
| typography.size.mobileSheetTitle | dimension | 19px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header h1 |
| typography.size.mobileWebInput | dimension | 16px | Только mobile web: минимум текста input/textarea/select по ранее принятому gathering-activity-feed/mobile-scroll.md, строки 15–16,31–32; предотвращает Safari auto-zoom без запрета user zoom. Native сохраняет body 15 и платформенное масштабирование. |
| typography.size.navigationLabel | dimension | 9px | Привязка iOS/Android baseline label9; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| typography.size.participantChip | dimension | 11px | Размер имени из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantChipAvatar | dimension | 9px | Размер буквы инициала из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantChipMore | dimension | 10px | Размер подписи счётчика из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantRosterAvatar | dimension | 12px | Инициал .avatar исходного styles.css,12px; масштабируемый текст |
| typography.size.sectionHeading | dimension | 16px | Заголовок раздела h3 исходного styles.css:75, в том числе compact-состав в сведениях встречи |
| typography.size.small | dimension | 13px | Размер текста small |
| typography.tracking.navigationLabel | dimension | 0.05px | Привязка iOS/Android baseline label tracking0.05; без изменения принятого дизайна. Источники/hash: mobile-response-navigation-bindings-6.3.json. |
| typography.weight.bold | fontWeight | 700 | Начертание bold |
| typography.weight.brand | fontWeight | 850 | Начертание brand |
| typography.weight.helpQuestion | fontWeight | 550 | FAQ заголовок 28.10.2026 |
| typography.weight.medium | fontWeight | 500 | Начертание medium |
| typography.weight.mobileChatTitle | fontWeight | 650 | Принятый chat.css .meeting-heading > span:first-child, начертание заголовка чата |
| typography.weight.mobileOnboardingTitle | fontWeight | 740 | onboarding-r4/r5 title |
| typography.weight.mobileSheetTitle | fontWeight | 650 | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header h1 |
| typography.weight.participantChipAvatar | fontWeight | 650 | Начертание инициала компактного участника из унаследованного .avatar styles.css:171 |
| typography.weight.participantRosterAvatar | fontWeight | 650 | Вес инициала .avatar исходного styles.css,650 |
| typography.weight.regular | fontWeight | 400 | Начертание regular |
| typography.weight.semibold | fontWeight | 600 | Начертание semibold |
