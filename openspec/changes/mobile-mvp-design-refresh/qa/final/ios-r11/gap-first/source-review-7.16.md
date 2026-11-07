# Read-only review Info/Roster7.16 до freeze

Runtime не запускался, исходники ревьюер не менял. Два блокирующих замечания перед authorbuild:

1. **Пустая footerchrome.** MeetingInfoScreen скрывает actions ifready, но не передаёт ActionFormSheet.footerVisible. Generic Footer — ConditionalContent, не EmptyView; ActionFormSheet.footerView всё равно добавляет padding/shadow/footerHeight. Передать existing footerVisible:ready. Опубликованная InfoState footer скрывает целиком, не только кнопку.
2. **Неподключённые точные error bindings.** MeetingInfoFailure body/button используют typographySizeSmall13 вместо raw14; новые title28/body22lineheight не применены (designFont только font). Raw InfoState.module.css: h2 21/28, p14/22, CTAfont14/padding13×16, statepadding28×20. Текущий stateInsetBlock30 не совпадает28. Использовать published14/новые lineheight с DynamicType и existingspacing.

Resource/state audit: loading→error→ready precedence теперь корректно исключает stale facts/рольдействия. InformationReturn skipreload сохранён, expanded/scroll хранятся в owner. current guards скрывают приватное при revoke; MeetingRepository использует lease/requestID и ResourceState игнорирует cancelled error. Roster retry .task на внешнем VStack не отменяется лишь из-за смены children на loading. Очевидных compiler blockers не найдено, реальная authorcompile всё равно нужна.

Неподтверждённый runtime-risk: при свёртывании длинного содержимого в skeleton/error SheetScrollPosition может записать clamp0 вместо прежнего offset. Нужен один targeted retry/child-return с scroll+expanded; source-read не доказывает регрессию и не является требованием менять этот helper.

Shared DetailsLoadingView заменяет удалённый InvitationLoadingView с сохранённым invitation-loading identifier; второй версии runtime не появилось. Pixel/large/reduced state review и первичный/повторный InfoGET остаются actual-проверками после нового candidate.
