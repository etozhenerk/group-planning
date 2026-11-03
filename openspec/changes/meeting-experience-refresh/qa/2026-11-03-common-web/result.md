# Web 11.1 — загрузки, вкладки и общие страницы

03.11.2026, основной агент по прямому указанию пользователя, без субагента.
Закрывается функциональный 11.1; общий независимый gate 0.3 остаётся открытым.

Исправлены два воспроизведённых дефекта принятого поведения:
- Разворот индикатора начинался от прежней конечной позиции. Теперь cleanup
  сохраняет фактический transform/ширину до отмены WAAPI, новая анимация
  начинается от него. Motion-токены и дизайн не менялись.
- При ошибке нового дня исчезали прежние карточки: placeholderData не хранится
  в cache. Presentation snapshot сохраняется в том же user/period, не становится
  успешным ответом другого дня и очищается при отключении/401/403/404.

49-service-navigation: 8/8 Chromium + mobile WebKit PASS, 19.0 с. Реальная WAAPI
прервана в 40% времени; первая новая keyframe совпадает с видимой позицией.
Reduced motion переключает без анимации. Календарь держит карточки 2 с,
через 503/retry, затем показывает правильные две новые. Отдельно 9/9 PASS,
15.0 с: календарь320/390/1440, create placement, skeleton/reduced motion,
сохранённые приглашения, смена периода и 403 (последнее в обоих браузерах).
Свежие web:check (230 unit/типы/формат/FSD/CSS) и demo build PASS.

Первоначальные FAIL разворота и календаря сохранены. Тест reduced motion
уточнён: ждём React aria-current, поскольку URL меняется раньше commit.
CUA: заметная обложка перед названием, desktop1280×720/mobile390×844,
у формы нет нижнего бара. После замены локальных chunks открытая вкладка
потребовала штатного reload. Профиль/Back/About проверены также в
../2026-11-03-service-information: logout последний, удаления/версии в профиле
нет, About содержит один wordmark. Cover select/cancel/create с/без картинки —
существующий 24-meeting-covers PASS320/390/1440, код cover не менялся.

Raw: /tmp/somewhere-20261103-{tabs-before,common-web,common-final,calendar-scope}.log
и их output-каталоги, common-check.log/common-build.log. Физический Safari,
native, общий design:ready/qa:ready и релиз не объявлены PASS.
Семантика placeholder сверена по первичной документации:
https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data
