# Web composer menu 2.3.0 и итоговый r11 · 27.10.2026

Исполнитель `/root/web_cursor_motion`. Реализована явно запрошенная анимация
меню по плюсу. Кандидат также содержит исправления cursor/cache/session и
emoji motion 2.2.0. Здесь сохранены результаты исполнителя; независимые
feature-test/design-review, qa:ready/design:ready и закрытие задач не заявляются.

## Итоговый кандидат

- `.cache/qa/chat-correction-2.3.0/web-r11-demo`, index.html SHA256
  `1460bde6b2460ef03559241733b61145a16ecd7aa1f01c038ac700f8983a8ea2`.
- [build-files.json](build-files.json): SHA256
  `77687c271daba5305ad86c07083a4032b06132b7563973fa2b29f9fbab1dc9ac`.
- [source-files.json](source-files.json): 26 изменённых исполнителем web-файлов,
  SHA256 manifest `b9f7b089b1e46d2e28355829083dabfcf73997243546fe8c3b6912581e48a222`.
  Список не означает авторство предшествующих незакоммиченных правок этих файлов.
- [Окружение](environment.json): macOS 27.0.1, Node 22.22.3, Playwright 1.64.1;
  Chromium Desktop Chrome и WebKit с профилем iPhone 13 Pro, ru-RU/Europe/Moscow.
  Один worker, без retries/trace/HAR, синтетические профили.
- Отдельный совместимый Go memory fixture на 8444; SHA binary записан в environment.
  После прогона fixture завершён, listener 8444 отсутствует. Пользовательский
  8445, native 52531/61441, `.cache/web-demo` и immutable r9/r10 не менялись.

## Изменения

`ActionMenu` теперь получает open и удерживает DOM при выходе. Движение —
opacity и translateY из опубликованного space.s8 в 0 за mobileSheet=180 ms;
обратный выход fast=150 ms, standard easing. Scale и раскладка не менялись.
Отмена снимает текущую opacity/transform, прежний completion блокируется.
Закрывающаяся поверхность сразу inert/aria-hidden/pointer-events:none.
Reduce Motion не создаёт анимацию. Escape и browser Back возвращают фокус
на плюс; выбор пункта открывает прежний dialog/sheet, не ожидая выхода меню.

Emoji motion 2.2 сохранён. Геометрические нули в WAAPI записаны без единиц,
без расширения literal-инвентаря. Браузерный regression проверяет нормализацию
нулевого keyframe и реальную высоту 0. Общий тестовый helper переименован
в surface-motion для обеих поверхностей; product motion helpers раздельные.

Исправления двух независимых model findings описаны в
[cursor report](../../../chat-reliability-and-sync/qa/2026-10-27-cursor-fixes/report.md).
Предыдущие motion-прогоны и их неуспешные assertions сохранены в
[r10 report](../2026-10-27-emoji-motion-web/report.md).

## Проверки

| Проверка | Результат | Evidence |
| --- | --- | --- |
| Полный web:check | 119/119 tests; TypeScript, ESLint, CSS, FSD, Prettier passed | [log](web-check.log) |
| Изолированный demo build r11 | passed | [log](build-demo.log) |
| `npm run web:build` | passed; обычное предупреждение о крупном chunk | [log](build-production.log) |
| `npm run design:check` | passed, структурная проверка | [log](design-check.log) |
| Целевой Playwright, 12 сценариев × 2 браузера | 24/24 passed, 0 retry | [JSON](playwright-run01.json), [log](playwright-run01.log), [results](results-run01), [config](playwright.config.ts) |

Новые постоянные тесты: `35-emoji-motion.spec.ts`, `36-action-menu-motion.spec.ts`;
оба включены в регулярный Chromium/WebKit runner. 34-telegram-chat ожидает
стабильную геометрию в прежних layout assertions и проверяет anchor после
закрытия и у хвоста. Это не меняет ожидаемое продуктовое поведение.

Покрыты intermediate enter/exit 180/150, отсутствие scale у меню и height у
 desktop popup, retained exit/inert/AX, rapid reopen от текущего кадра, отмена
старого завершения, normal/reduced, focus/selection/draft, меню с клавиатуры,
Escape/Back, немедленная форма при ещё удерживаемом выходе, прежние desktop
modal actions. Emoji-пути также проверяют 320×760, 390×430, 844×390 и anchor
истории/хвоста. Движение 390/1440 проверено обоими браузерами.

Покадровый harness останавливает только анимации выбранной поверхности через
MutationObserver и задаёт currentTime; screenshots показывают промежуточную
композицию, JSON attachments — измерения. Это deterministic browser-проверка,
не измерение физического frame rate. Реальные UI screenshot просмотрены
исполнителем. Fixture TLS unknown-certificate probe messages присутствуют
в log; requests/assertions прошли с ignoreHTTPSErrors.

## Границы

Физические Safari/iPhone/IME, VoiceOver/TalkBack, native-сборки, полный каталог
релиза и независимая визуальная приёмка не относятся к этому отчёту. Новые
sync journal/realtime/read-state/outbox здесь не реализовывались. Task checkbox,
manifest pass и deployment не менялись. Commit/push не выполнялись.
