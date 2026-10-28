# iOS 16.2 — авторская проверка

Реализация текущих требований завершена, исходники зафиксированы hash.
Независимые feature-test/design-review этим отчётом не заменены, задача 16.2
не закрыта. Проверка экранной клавиатуры заблокирована состоянием симулятора.
Физический iPhone не подключался и не обновлялся; commit/push не выполнялись.

## Изменения

- ActionFormSheet и date/time MeetingPickerSheet больше не показывают dismiss X.
  Сохранены native swipe, accessibility escape, контекст вложенной панели и busy
  guard. Крестики удаления фото/варианта, anchored reaction popup и fullscreen
  viewer остаются отдельными действиями.
- EmojiPicker использует семь опубликованных SVG из sheet-controls 4.0.0:
  glyph 23, target 44, общий центр. Подчёркивание selected не участвует в layout.
- Readers получает фиксированный viewport: три строки roster и два gap 12,
  рассчитанный до первого показа. Loading/empty/error/list не меняют detent.
- Queued/sending больше не добавляют текстовую строку. Metadata сохраняет слот 12;
  после двух секунд появляется круговой индикатор. Задержка ограничена [0, 2]
  при смене часов, queued→sending не начинает её заново. ACK сразу скрывает
  индикатор; SwiftUI message/avatar subtree и timeline intent key сохраняются.
  Ошибки, повторная отправка и сетевой outbox не менялись.
- Dismiss/возврат к родителю не делают reload. Успешная мутация обновляет данные
  отдельно. Реальный лишний refresh наследовался из InvitationScreen: теперь
  refresh принадлежит только обычному preview, а оба sheet callers явно
  запрещают pull-to-refresh. No-op refreshable и private introspection не добавлены.

## Проверки

| Проверка | Результат |
| --- | --- |
| Swift-format, git diff --check, agent:check | PASS |
| Чистая generic simulator build + analyze | PASS |
| Unit | 179 тестов, 46 suites, PASS |
| Семь целевых sheet-stability UI cases | PASS до timer clamp; исторический manifest в iteration-5 |
| Финальный pending/ACK/readers UI | PASS; появление/исчезновение самого индикатора, стабильная высота строки и viewport |
| Финальный native SDK chat-sync UI | PASS; отправка, читатели, realtime и draft restart |
| Дополнительный sheet-gestures | date/place PASS; task keyboard — BLOCKED по окружению |
| Физический iPhone, CUA/raw/VoiceOver/Reduce Motion | Не проверены в этом запуске |

Основные финальные логи и снимки находятся в `final/`; описание keyboard-наблюдений
и контрольных запусков — в `findings.md`. `author-receipt.json` содержит hash
исходников, каталога и двух собранных бинарников. Это авторская запись, не receipt
qa:ready/design:ready/release-ready. Все три gate остаются непройденными.

## Окружение и клавиатура

Xcode 27.1 / Swift 6.4; существующий iPhone 18 Pro, iOS 27.0,
UDID `31262733-50DC-46A5-938E-4C462D70F109`, viewport 402×874. Запускались только
SomewhereUITestHost и отдельный unit bundle. API — временный Go TLS fixture
на loopback с синтетическими данными.

Task form возвращает offscreen Keyboard frame y918. Ожидание видимого frame,
повтор до typeText и временный `.large` при focus не помогли. Контрольная
полноэкранная SupportForm также не получила видимую клавиатуру. Прежний receipt
восстановления настроек фиксирует Software Keyboard=off на этом UDID, а Mac
сейчас заблокирован. Это не доказанный дефект продукта и не успешный keyboard-case.
Диагностический large patch полностью возвращён; новые detents в продукт
не добавлялись. Глобальные настройки не менялись. Для повтора нужно штатно
включить клавиатуру только тестового iPhone по уже данному разрешению.

## Диагностическая история

- iteration-1: неверно измерялся дочерний AX-текст pending вместо всей строки;
  измерение переведено на постоянный row container. Tear Down завис, собственный
  xcodebuild остановлен. Старые evidence сохранены.
- iteration-2: три UI cases прошли, но shell завершился 127 после изменения
  исполняемого скрипта. Whole-command PASS для него не заявлен.
- iteration-3: body swipe нашёл настоящий inherited refresh; исправлено владение.
- iteration-4: ordinary preview case ожидал недопустимый private GET после RSVP;
  тест теперь проверяет privacy fence и rejoin. Public preview вне sheet не имеет
  доступного UI entry point и не отмечен pass.
- iteration-5: семь cases прошли; дополнительные date/place gesture cases прошли,
  task обнаружил недоступную экранную клавиатуру.
- iteration-6–9 и keyboard-large-diagnostic: отдельные keyboard counterfactuals;
  изменений их размеров/композиции в финальном продукте нет.
- iteration-10–11: уточнён AX locator индикатора: identifier перенесён с постоянного
  пустого slot на условный ProgressView. Тип элемента SwiftUI отличается от
  ProgressIndicator в объединённой message accessibility-иерархии; финальный
  тест проверяет идентификатор настоящего условного view и прошёл.

## Что ещё требуется

Независимые проверки текущего кандидата и raw-макета, VoiceOver escape,
Reduce Motion, readers error/pagination/large text и клавиатура после восстановления
scoped-настройки. Ровно 2000 ms первого кадра отдельной timestamped motion-записью
не измерено: границы подтверждены unit, slow-send/ACK — настоящим UI. Наличие
снимков или зелёной сборки не объявляется полной визуальной приёмкой.
