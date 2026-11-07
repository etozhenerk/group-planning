# Web R9 — отрицательная итоговая проверка

Два P2: ACCESS-1 и CHAT-ENTER-1. Общий pass 305 кейсов/1265 состояний не заявляется.

- ACCESS-1: настоящий Chrome Default zoom 200%, CSS zoom 1, CSS viewport 180×326. Pager имеет высоту 0 на всех восьми страницах. Прокрутка внутренней секции не раскрывает текст из-за clipping ancestor. Header 92.49 + footer 194.49 + padding 32 превышают surface 294. Доказательства: manual/real-chrome-os/observations.json и OS screenshots; настройка 200% и восстановление 100% записаны XML.
- CHAT-ENTER-1: быстрый fill→Enter при 390 приводит к ACK 201, accepted bubble и одной authoritative entry, но оставляет исходный текст в textarea через 700 ms, Tab blur/focus и reload. Кнопка отправки очищает поле. IDB recorder показывает typing draft→enqueue clear→поздний stale selection save→ACK с оставшимся draft. Доказательства: manual/composer-enter-control3 и manual/composer-enter-idb.

Все шесть обязательных suites завершились до изменения source: web-check 274 unit; main 340 passed/2 skipped; chat 38; read 14; RSVP 32; window 4. Это не общий функциональный или визуальный pass. После передачи дефектов исполнитель изменил source; immutable R9 artifact сохранён.

Свежие выполненные матрицы: entry 52, RSVP 144, invitation 64, Create 40, profile 37, Help 70, Meetings 123 (99 initial + 24 QA selector repair), About 33 действия. Не все эти состояния получили окончательный verdict/schema-report. Оставшиеся conversation/decisions/vibe/journeys/foundation, кейсы и физическая доступность требуют полного нового кандидата. Старые pass не переносились.

Первоначальный composer=false был ранним isVisible без ожидания mount. Дополнительные отправки по шести ширинам подтвердили доступность поля и server-entry=1. Settled ACK выявил сохранение текста. QA ошибки DTO e.text вместо e.payload.text и blur через heading→Info сохранены отдельно и не объявлены дефектами продукта.

Chrome loans завершены: масштаб 100% восстановлен, собственные mappings удалены, owned tabs закрыты. Native QA/data/install не тронуты. Новый device доступ требует exclusive окна через root.

Оригиналы raw logs, Playwright outputs, before-report bytes и tooling failures сохранены локально. Публикуются только проверенные безопасные файлы; полный прежний positive пакет не требуется для этого отрицательного результата.
