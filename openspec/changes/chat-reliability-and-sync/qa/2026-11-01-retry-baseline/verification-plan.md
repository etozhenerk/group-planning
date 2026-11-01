# План quantitative retry baseline · 01.11.2026

Scope: только недостающие замеры chat1.5 по существующим PAGE/LOOKUP cases;
никаких production writes, релизов, Telegram, изменений backend/runtime/каталога.
Ранее current bounded pages уже измерены независимо в backend-independent.
Здесь дополнительно измеряются настоящий Service.SendMessage и
Service.PublishMediaWithCaption на memory и изолированной облачной PostgreSQL.

Для каждой истории1k/10k/100k: один text, один photo и один file intent; по20
повторов до и после31-дневного истечения receipt. Проверяются неизменные ID,
sequence у текста, attachment у медиа; full Feed запрещён wrapper-ом. Каждый
повтор должен использовать ровно один FeedEntry/MessageByRequest lookup и
получить ровно одну запись. Фиксируются p50/p95/max полного service+transaction
пути; measurement не объявляется универсальным production SLA.

SQL дополнительно снимает EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON) точных production
feedRequestSQL/feedEntrySQL. Существующий boundedFeedIndexScan требует индекс,
не больше одной физической строки за цикл, без отброшенных/перепроверенных строк.
DB создаётся только при отсутствии somewhere_integration, помечается уникальным
marker, проверяются имя/owner/marker до действия и DROP. После удаляется только
своя БД и загруженный собственный binary по SHA guard; рабочая БД не используется.

QA test исходник находится вне backend и добавляется go -overlay. Требуется
сверка immutable backend/contracts hash до/после, собственные author controls,
затем независимая проверка/исполнение перед checkbox. Авторский PASS сам по
себе не закрывает задачу. Старые failed попытки сохраняются.
