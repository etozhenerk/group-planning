# Токены somewhere · 1.1.0

Генерируется из [tokens.json](tokens.json); ручные правки будут перезаписаны.
В коде используйте смысловые роли. px → CSS px / iOS pt / Android dp;
типографические размеры Android → sp. Длительность Swift → секунды.

| Роль | Тип | Значение | Назначение |
| --- | --- | --- | --- |
| breakpoint.mobile | dimension | 740px | Web: ниже этого значения мобильная композиция; native не использует breakpoint |
| breakpoint.tablet | dimension | 1100px | Верхняя граница планшетной компоновки web из styles.css:1271 |
| color.accent | color | #d6cce9 | Смысловая роль accent |
| color.action | color | #ebe7df | Смысловая роль action |
| color.actionText | color | #252429 | Смысловая роль actionText |
| color.background | color | #24252a | Смысловая роль background |
| color.borderStrong | color | #414249 | Смысловая роль borderStrong |
| color.error | color | #ffb8b2 | Смысловая роль error |
| color.focus | color | #d6d1f5 | Смысловая роль focus |
| color.legacyIosAccent | color | #c5bbd6 | Legacy iOS; не использовать в новых компонентах |
| color.legacyIosSelectedSegment | color | #46414e | Legacy iOS; не использовать в новых компонентах |
| color.line | color | #ffffff12 | Смысловая роль line |
| color.message | color | #33343a | Смысловая роль message |
| color.muted | color | #b9b9c2 | Смысловая роль muted |
| color.navigation | color | #1d1e22 | Смысловая роль navigation |
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
| component.icon.focusOffset | dimension | 5px | Отступ outline при фокусе по клавиатуре из styles.css :focus-visible; для иконки закрытия панели |
| component.icon.strokeWidth | number | 1.7 | Толщина SVG-штриха из утверждённого styles.css svg.icon; для пиктограмм нового варианта панели |
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
| component.sheet.backdropBlur | dimension | 5px | Размытие фона web-панели из утверждённого date-poll-v1/date-poll.css .poll-overlay |
| motion.duration.card | duration | 220ms | Длительность card |
| motion.duration.cover | duration | 280ms | Длительность cover |
| motion.duration.fast | duration | 150ms | Длительность fast |
| motion.duration.navigation | duration | 260ms | Длительность navigation |
| motion.duration.photo | duration | 290ms | Длительность photo |
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
| typography.family.web | fontFamily | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif | Системный fallback без сетевой подмены шрифта |
| typography.lineHeight.body | number | 1.5 | Множитель высоты строки body |
| typography.lineHeight.cardTitle | number | 1.25 | Множитель высоты строки cardTitle |
| typography.lineHeight.label | number | 1.4 | Множитель высоты строки label |
| typography.size.body | dimension | 15px | Размер текста body |
| typography.size.button | dimension | 14px | Размер подписи .button из утверждённого styles.css:222; Android использует sp |
| typography.size.caption | dimension | 12px | Размер текста caption |
| typography.size.cardTitle | dimension | 21px | Размер текста cardTitle |
| typography.size.cardTitleMobile | dimension | 19px | Размер текста cardTitleMobile |
| typography.size.desktopHeading | dimension | 34px | Заголовок desktop h1 из styles.css:66 |
| typography.size.heading | dimension | 27px | Размер текста heading |
| typography.size.label | dimension | 11px | Размер текста label |
| typography.size.mobileActionHeading | dimension | 28px | Заголовок мобильной формы из h1 утверждённого styles.css |
| typography.size.participantChip | dimension | 11px | Размер имени из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantChipAvatar | dimension | 9px | Размер буквы инициала из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.participantChipMore | dimension | 10px | Размер подписи счётчика из общих .people/.person/.people-more styles.css:339–365,582–585,1348–1387; масштабируемый текст Android — sp |
| typography.size.sectionHeading | dimension | 16px | Заголовок раздела h3 исходного styles.css:75, в том числе compact-состав в сведениях встречи |
| typography.size.small | dimension | 13px | Размер текста small |
| typography.weight.bold | fontWeight | 700 | Начертание bold |
| typography.weight.brand | fontWeight | 850 | Начертание brand |
| typography.weight.medium | fontWeight | 500 | Начертание medium |
| typography.weight.participantChipAvatar | fontWeight | 650 | Начертание инициала компактного участника из унаследованного .avatar styles.css:171 |
| typography.weight.regular | fontWeight | 400 | Начертание regular |
| typography.weight.semibold | fontWeight | 600 | Начертание semibold |
