# Токены somewhere · 1.0.0

Генерируется из [tokens.json](tokens.json); ручные правки будут перезаписаны.
В коде используйте смысловые роли. px → CSS px / iOS pt / Android dp;
типографические размеры Android → sp. Длительность Swift → секунды.

| Роль | Тип | Значение | Назначение |
| --- | --- | --- | --- |
| breakpoint.mobile | dimension | 740px | Web: ниже этого значения мобильная композиция; native не использует breakpoint |
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
| color.photoBackdrop | color | #141518 | Смысловая роль photoBackdrop |
| color.photoFrame | color | #e4ded4 | Смысловая роль photoFrame |
| color.raised | color | #393a42 | Смысловая роль raised |
| color.selectedSegment | color | #45414e | Смысловая роль selectedSegment |
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
| component.card.avatar | dimension | 35px | Карточка avatar |
| component.card.avatarMobile | dimension | 32px | Карточка avatarMobile |
| component.card.avatarOverlap | dimension | 9px | Карточка avatarOverlap |
| component.card.cover.height | dimension | 112px | Обложка карточки height |
| component.card.cover.mobileHeight | dimension | 101px | Обложка карточки mobileHeight |
| component.card.cover.mobileWidth | dimension | 102px | Обложка карточки mobileWidth |
| component.card.cover.width | dimension | 118px | Обложка карточки width |
| component.card.coverLift | dimension | 4px | Карточка coverLift |
| component.card.hoverLift | dimension | 3px | Карточка hoverLift |
| component.card.minimumHeight | dimension | 146px | Карточка minimumHeight |
| component.card.minimumHeightMobile | dimension | 145px | Карточка minimumHeightMobile |
| component.navigation.height | dimension | 62px | Основная нижняя навигация height |
| component.navigation.icon | dimension | 19px | Основная нижняя навигация icon |
| component.navigation.inset | dimension | 16px | Основная нижняя навигация inset |
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
| typography.size.caption | dimension | 12px | Размер текста caption |
| typography.size.cardTitle | dimension | 21px | Размер текста cardTitle |
| typography.size.cardTitleMobile | dimension | 19px | Размер текста cardTitleMobile |
| typography.size.heading | dimension | 27px | Размер текста heading |
| typography.size.label | dimension | 11px | Размер текста label |
| typography.size.small | dimension | 13px | Размер текста small |
| typography.weight.bold | fontWeight | 700 | Начертание bold |
| typography.weight.brand | fontWeight | 850 | Начертание brand |
| typography.weight.medium | fontWeight | 500 | Начертание medium |
| typography.weight.regular | fontWeight | 400 | Начертание regular |
| typography.weight.semibold | fontWeight | 600 | Начертание semibold |
