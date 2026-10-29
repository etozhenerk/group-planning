# Токены somewhere · 4.1.1

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
| color.error | color | #ffb8b2 | Смысловая роль error |
| color.fieldBorder | color | #ffffff14 | Ранее согласованный assets/styles.css .field input/.field textarea/.search (строки 432–441) и .field select (2804–2811), border #ffffff14. Сохраняет desktop/noncompact поле; новая mobile-ревизия использует color.borderStrong. |
| color.focus | color | #d6d1f5 | Смысловая роль focus |
| color.legacyIosAccent | color | #c5bbd6 | Legacy iOS; не использовать в новых компонентах |
| color.legacyIosSelectedSegment | color | #46414e | Legacy iOS; не использовать в новых компонентах |
| color.line | color | #ffffff12 | Смысловая роль line |
| color.meetingMark | color | #2e3938 | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| color.meetingMarkForeground | color | #dcece5 | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-mark |
| color.message | color | #33343a | Смысловая роль message |
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
| component.button.iconGap | dimension | 9px | Интервал между иконкой и подписью .button из styles.css:216 |
| component.button.iconSize | dimension | 21px | Иконка .button из общего svg.icon утверждённого styles.css:81–89 |
| component.button.minimumHeight | dimension | 46px | Минимальная высота .button из styles.css:218; область нажатия не меньше target платформы |
| component.button.paddingBlock | dimension | 12px | Вертикальный отступ содержимого .button из styles.css:217 |
| component.button.paddingInline | dimension | 18px | Горизонтальный отступ содержимого .button из styles.css:217 |
| component.button.radius | dimension | 13px | Радиус .button из утверждённого styles.css:219 |
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
| component.meetingSettings.coverGap | dimension | 12px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .cover-row |
| component.meetingSettings.coverRadius | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .cover-preview |
| component.meetingSettings.coverSize | dimension | 52px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .cover-preview |
| component.messageDelivery.indicatorSize | dimension | 12px | Постоянный слот спиннера отправки в строке metadata без изменения высоты сообщения. |
| component.messageDelivery.pendingDelay | duration | 2000ms | Прямое решение пользователя: индикатор только после двух секунд отправки. |
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
| component.sheet.backdropBlur | dimension | 5px | Размытие фона web-панели из утверждённого date-poll-v1/date-poll.css .poll-overlay |
| component.taskDetails.actionsGap | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-detail-actions |
| component.taskDetails.actionsInsetTop | dimension | 22px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-detail-actions |
| component.taskDetails.factInsetBlock | dimension | 8px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-facts > div |
| component.taskDetails.factsGap | dimension | 18px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-facts > div |
| component.taskDetails.factsInsetTop | dimension | 7px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .task-facts |
| motion.duration.card | duration | 220ms | Длительность card |
| motion.duration.cover | duration | 280ms | Длительность cover |
| motion.duration.emojiPanelEnter | duration | 180ms | 2.2.0: вход панели эмодзи; Reduce Motion переключает сразу |
| motion.duration.emojiPanelExit | duration | 150ms | 2.2.0: выход панели эмодзи; Reduce Motion переключает сразу |
| motion.duration.fast | duration | 150ms | Длительность fast |
| motion.duration.mobileSheet | duration | 180ms | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet; native системное движение, reduced motion отключает сдвиг |
| motion.duration.navigation | duration | 260ms | Длительность navigation |
| motion.duration.photo | duration | 290ms | Длительность photo |
| motion.duration.reactionEnter | duration | 180ms | Коррекция 2.0.0: reactionEnter контекстных реакций; Reduce Motion без scale/translation |
| motion.duration.reactionExit | duration | 150ms | Коррекция 2.0.0: reactionExit контекстных реакций; Reduce Motion без scale/translation |
| motion.duration.reactionFeedback | duration | 150ms | Коррекция 2.0.0: reactionFeedback контекстных реакций; Reduce Motion без scale/translation |
| motion.duration.reactionLongPress | duration | 450ms | Web-порог удержания 450 ms; native системный long press, доступные действия на самом сообщении/чипе без постоянных кнопок |
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
| typography.lineHeight.mobileSheetTitle | number | 1.25 | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header h1 |
| typography.size.body | dimension | 15px | Размер текста body |
| typography.size.button | dimension | 14px | Размер подписи .button из утверждённого styles.css:222; Android использует sp |
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
| typography.size.mobileChatNarrowTitle | dimension | 14px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css narrow header |
| typography.size.mobileChatTitle | dimension | 16px | Принятая mobile-ревизия 2026-10-27-telegram-chat, chat.css .meeting-heading |
| typography.size.mobilePeopleInitial | dimension | 10px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .people-chip i/.tiny-avatar |
| typography.size.mobileSheetTitle | dimension | 19px | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header h1 |
| typography.size.mobileWebInput | dimension | 16px | Только mobile web: минимум текста input/textarea/select по ранее принятому gathering-activity-feed/mobile-scroll.md, строки 15–16,31–32; предотвращает Safari auto-zoom без запрета user zoom. Native сохраняет body 15 и платформенное масштабирование. |
| typography.size.participantChip | dimension | 11px | Размер имени из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantChipAvatar | dimension | 9px | Размер буквы инициала из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantChipMore | dimension | 10px | Размер подписи счётчика из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantRosterAvatar | dimension | 12px | Инициал .avatar исходного styles.css,12px; масштабируемый текст |
| typography.size.sectionHeading | dimension | 16px | Заголовок раздела h3 исходного styles.css:75, в том числе compact-состав в сведениях встречи |
| typography.size.small | dimension | 13px | Размер текста small |
| typography.weight.bold | fontWeight | 700 | Начертание bold |
| typography.weight.brand | fontWeight | 850 | Начертание brand |
| typography.weight.helpQuestion | fontWeight | 550 | FAQ заголовок 28.10.2026 |
| typography.weight.medium | fontWeight | 500 | Начертание medium |
| typography.weight.mobileChatTitle | fontWeight | 650 | Принятый chat.css .meeting-heading > span:first-child, начертание заголовка чата |
| typography.weight.mobileSheetTitle | fontWeight | 650 | Принятая mobile-ревизия 2026-10-27-telegram-chat, panels.css .sheet-header h1 |
| typography.weight.participantChipAvatar | fontWeight | 650 | Начертание инициала компактного участника из унаследованного .avatar styles.css:171 |
| typography.weight.participantRosterAvatar | fontWeight | 650 | Вес инициала .avatar исходного styles.css,650 |
| typography.weight.regular | fontWeight | 400 | Начертание regular |
| typography.weight.semibold | fontWeight | 600 | Начертание semibold |
