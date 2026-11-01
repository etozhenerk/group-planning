# TC-CHAT-SYNC-2D68FE69 · 390 CSS px

Независимый проверяющий: /root/sdd_clients_audit; исполнитель продукта: /root.
Это интеграционная проверка HTTP/state в работающем клиенте, не native UI/design PASS.
Фактическое окружение — observed-environment.json; план сохранён без переписывания.

1. В собственной встрече A/Саша и B/Лена реальный Go API создал хвост100. Клиент загрузил100; startup verification GET после100 завершился до controlled gate.
2. Лена сохранила101 через реальный HTTP. Саша ввёл own102 и отправил Enter. ACK201 с sequence102 получен до incremental GET; собственная запись accepted видна ровно один раз, foreign101 ещё отсутствует.
3. Следующий GET удержан. Сетевой baseline 390-network.json показывает after_sequence100, не102. После выпуска двух страниц клиент запросил101, затем102; 101/102 отображены один раз в серверном порядке. PNG до/после и raw runner log сохранены.
4. Повторы страницы, before=100, пустой incremental, empty initial after0, uint64 выше2^53 и ошибка второй страницы проверены текущими production-model integration tests loadConversation.test.ts/loadChat.test.ts в реальном обязательном web-check217/217. Именованные assertions сохранены в controlled-harness.zip; они подтверждают cursor/data atomicity, а не всю security/transport фичу.
5. Исторический RED гонки и GREEN сохранены неизменными в openspec/changes/chat-reliability-and-sync/qa/2026-10-27-web-cursor-baseline и green-candidate-15bf46c. Текущий positive regression не выдан за новый RED дефекта.

История данного frozen checkpoint: первоначально1440 FAIL /390 PASS. На1440 fake-clock кадры продвигались ДО прихода реального ACK, затем замороженный renderer не показал accepted row. Ровно один адресный повтор1440 после продвижения кадров ПОСЛЕ await ACK дал PASS. Контракт, timeout и продукт не менялись. Исходный FAIL сохранён, чистый2/2 запуск не заявлен.

Собственные контексты закрыты finally, clock/routes не применялись к native Chrome. Изолированный memory fixture очищается штатной остановкой после отчёта.
