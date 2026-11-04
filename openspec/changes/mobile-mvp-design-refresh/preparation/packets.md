# Входы единой публикации

Исходные snapshots сохраняют hashes approved-designs.json. Производные файлы
и их hashes перечислены в [references.json](references.json); генератор —
reference-source/build.ts. UI клиентов, SDK и API им не подменяются.

| Подготовка | Матрица пакета | Дополнительный контракт |
| --- | --- | --- |
| 2.1 | [launch.json](launch.json) | 44/53/16, один smoothstep оборот, cold/resume/долгое восстановление/Reduce Motion/Android mask |
| 2.2 | [entry.json](entry.json) | [Состояния и тексты](onboarding.md), r5 принят отдельным решением |
| 2.4 | [Общая основа](mobile-foundation.md) | [Дополнения токенов](token-additions.json), существующие значения не заменяются |
| 2.5 | [meetings.json](meetings.json) | Список/календарь/«Возможно»: отдельные loading/empty/error/refresh-error, 20 встреч, дни/табы, unread footer, фото |
| 2.6 | [create-invite.json](create-invite.json) | Название/дата обязательны, ручное место без карты, обложка/dirty/unknown, роли/RSVP/закрытый приём |
| 2.7 | [conversation.json](conversation.json) | Чат/сведения/настройки: отдельные composer/emoji/reactions/people/readers, дата/время/обложка/conflict/dirty, роли и 30 ответов |
| 2.8 | [decisions.json](decisions.json) | Дата/ручное место/подготовка: формы/параметры/сроки/голоса/скрытые итоги/детали/подтверждения/ошибки, явное принятие |
| 2.9 | [vibe.json](vibe.json) | Стопка/сетка/viewer, drag/flick/rollback/cycle, vertical scroll/pointercancel, upload/export/cancel/partial/permission |
| 2.10 | [account-service.json](account-service.json) | Приватные данные/нет фото/ошибки, FAQ, section-sheet/клавиатура, файлы/unknown, честные метаданные/полный reader/TOC/возврат |

Каждый JSON отдельно перечисляет selector-состояния, состояния взаимодействия,
viewports и fixtures web/iOS/Android. Разные формы не объединяются в общий open.
Native размеры в матрице — логические условия макета, не выдуманное устройство
или измеренные insets. Live capture фиксирует фактические model/OS/шрифты/
масштаб/safe area/IME. Web desktop 740/1100/1440 сохраняет baseline.

Все реальные outbox/media/PDF/файловые/upload/export/OAuth/support операции
сохраняются по [baseline](baseline.md). Локальный успех fixture не переносится
в приложение как операция. Голосование/unknown и повтор опираются на
действующий серверный контракт. Дата и место сохраняют разные правила
большинства; приватность/hidden/anonymous не меняются вместе с карточкой.

Карты, их provider-content и предложенная ссылка условий About вынесены в
[meeting-place-picker](../../meeting-place-picker/proposal.md). Подготовка 2.11
и кодовые задачи 5.* не выполнены; они исключены из текущей публикации по
прямому решению пользователя. Сохранённые map-файлы рядом — история передачи.

Макетные проверки — reference-check/selector-check и raw logs в checks.
Они подтверждают подготовку входов; client design-review/feature-test/gates
выполняются отдельно после реализации и заморозки кандидата.
