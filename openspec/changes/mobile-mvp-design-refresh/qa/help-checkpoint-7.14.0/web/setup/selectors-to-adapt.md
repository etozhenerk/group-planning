# Legacy selectors — ожидаемая mobile-only адаптация после freeze

Это список для будущего canonical test patch, не изменение тестов и не утверждение о ещё не реализованном UI. Desktop≥740 сохраняет старые selectors. Не применять глобальную замену к chat/cover/support desktop.

| Точное место | Старое | Approved mobile help-r2 |
| --- | --- | --- |
| frontend/web/tests/49-service-navigation.spec.ts:26 | link «Задать вопрос ↗» | link «Написать в поддержку»; FAQ aria-expanded/aria-controls/hidden semantics14–25 сохранить. |
| frontend/web/tests/62-support-boundaries.spec.ts:22;32-refresh-resilience.spec.ts:120 | textarea «Ваше сообщение» | textarea «Сообщение» (+required marker скрыт из accessible name). |
| frontend/web/tests/62-support-boundaries.spec.ts:23;32-refresh-resilience.spec.ts:121,123 | «Отправить сообщение ↗» для initial/retry | initial «Отправить обращение»; known/unknown retry «Повторить отправку», pending «Отправляем…». API business checks62:59–73 и32:125–128 сохранить. |
| frontend/web/tests/62-support-boundaries.spec.ts:34 | combobox «Раздел» с valueprofile | trigger button «Раздел приложения: Профиль»; открывает dialog «Раздел приложения»/radiogroup «Выберите раздел приложения» с8radio. Desktop native select/valueprofile остаётся. |
| features/support-feedback/ui/FeedbackScreenshot old input aria | «Прикрепить скриншот» | Сама visible button остаётся «Прикрепить скриншот», hidden file input называется «Файл скриншота». Реальный filechooser button path тоже пригоден. Remove «Убрать скриншот» и img alt «Выбранный скриншот» сохраняются. |
| frontend/web/tests/32-refresh-resilience.spec.ts:128 | единый text «Номер <reference>» | mobile «Номер обращения» +strong точный **server**reference; не DEMO-01. Desktop старое представление сохраняется. |
| Старые heading/visible back assumptions | help «Нужна подсказка?», form «Что-то пошло не так?», текст «Назад» | mobile help «Помощь», form «Написать в поддержку», icon-only PageBack с contextual accessible name. Существующий49:8–9 role/link+contextual label перепроверить на frozen, не заменять проверку возврата произвольным кликом. |

Section keyboard: нельзя выбрать другой screen только Arrow. Arrow/Home/End focus, Enter/Space commit; cancel не commit и не POST. Сохранять message/file/type/scroll; activeElement после close — trigger. Native SupportBoundary helpers уже используют «Отправить обращение»; не копировать старую web submit copy в них.

Feedback footer `[data-pinned]`/`feedback-scroll` — prototype identifiers; после freeze сопоставить с фактическими testids/computed, не менять приложение ради удобства селектора. Сохранять `scrollHeight/clientHeight`, viewport иfooterrect в evidence; pass по одному screenshot недостаточен.
