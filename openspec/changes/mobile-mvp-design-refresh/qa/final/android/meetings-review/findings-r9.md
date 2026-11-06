# Android: список / календарь / «Возможно», текущие findings R9

Кандидат: plan `mobile-refresh-final-android-r9-2026-11-06`, source `7f4f7abb9edff2c89b179dd4c6ac48de0c104fdf3fe47b17e91c86b00fade9fe`, APK `a0dd600cd4cc48d69b85cb9e5b4a2c41985ceed7104eecb46466953305376c4e`. Это промежуточная запись, не pass пакета.

## F1 — название периода распадается на строки на 320dp

На реальном MainActivity при 320×640dp, fontScale1, счетчиках Предстоящие77 / Прошедшие1 второй период отображается как «Прошедши» и отдельная «е»; число1 также находится на другой строке. Это не увеличенный шрифт. Предусловие получено настоящими API create/update собственных записей для 20/51-case, а не подменой счетчиков.

Actual: `visual-actual/calendar--twenty-small-phone.png`, рядом capture Configuration и unmerged semantics. Reference: `reference/calendar--ready-small-phone.png` и опубликованный calendar-r7. Контракт: `docs/design/components/mobile-mvp.md`, мобильная шапка списка/календаря и отдельный переключатель; полные подписи сохраняются в эталоне на320. Источник: `MeetingToolbar.kt` обычный Row и `MeetingPeriodButton.kt` weighted Text без адаптации при нехватке места. Нужна исправленная компоновка в пределах принятого дизайна; не уменьшать/терять точное число и не обрезать подпись. Узкий live pass этого состояния не заявлен.

## Доказанные независимые действия

- `clock-actual`: server clock переходит локальную полночь Asia/Dubai; настоящий ClaimTransition/CompleteTransition сдвигает upcoming1→0/past1; SDK обновляет UI, выбранный день/месяц/период сохранены. Устройство/identity/TTL не переводились. Supplemental fixture остановлен и clock восстановлен.
- `dense-actual`: все20 карточек выбранного дня доступны прокруткой; API первая страница50 при полном day-count51; после реального owner PATCH во время догрузки клиент загружает заново и получает51 уникальный ID с сохраненным selection. Исходный cursor отдельно возвращает409 (без подмены ответа).
- `common-navigation.log`: текущий точечный канонический motion/ReducedMotion/Back проход OK1test10.158s. Не заменяет незавершенные остальные состояния/кейсы.

## QA setup negatives

Сохранены отдельно: собственный неверный helper endpoint, whole-minute OffsetDateTime без секунд, неверный GETme envelope, пересечение выбранного дня с baseline (21 вместо20), поиск нематериализованного lazy row, scrollTo для sticky кнопки, PATCH не своей baseline-встречи (403), попытка API создания legacy undated без требуемой даты и поиск текста у иконки retry. Это не объявляется продуктовым дефектом.

Изменение wm size во время RSVP HTTP вызывает настоящий lifecycle STOP и `InvitationViewModel.suspend()`: состояние pending сохраняется, запрос отменяется. Поэтому новый busy capture выполняется на фиксированном размере; второй размер проверяется explicit retry. Не выдаём эти отменённые попытки за original HTTP error или завершенный ответ.

Accepted14 checks и обе mandatory suites не изменены. Весь пакет57cases/86states еще не завершен.
