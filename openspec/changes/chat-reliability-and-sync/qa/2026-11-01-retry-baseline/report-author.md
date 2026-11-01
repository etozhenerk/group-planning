# Авторский baseline повторов · 01.11.2026

Автор /root. **Это ещё не независимая приёмка и не основание checkbox.**
Проба дополняет quantitative gap chat1.5 без изменения runtime/каталога.

| Адаптер | Конфигураций ×20 | p95 полного service/transaction, мс |
| --- | --- | --- |
| Memory | 18 ×20 | 0.213–9.544 |
| Изолированный PostgreSQL16 | 18 ×20 | 0.825–1.517 |

Всего720 повторов: text/photo/file на1k/10k/100k до/после31-дневного receipt.
Проверены идентичность ответа и ровно один lookup/одна возвращённая запись;
полный Feed запрещён wrapper-ом. Все18 SQL EXPLAIN проходят существующий
boundedFeedIndexScan с физическим бюджетом1 и без filtered/rechecked rows.
Это synthetic single-request baseline без искусственной сетевой задержки;
он не является capacity/горячей встречей/commit→visible из7.2/7.9.

[Raw memory](memory-author.log), [raw SQL](author-sql.log),
[summary](author-summary.json), [source](retry_baseline_test.go),
[resource plan](author-resource-plan.json). Backend/contracts412/412 совпали
с исходным текущим inventory. Ни новых миграций, ни новых приложений нет.
Все тестовые данные синтетические; production не читается кроме health/ready
и состояния сервисов. Уникально помеченная somewhere_integration удалена,
remaining0; загруженный собственный executable удалён с проверкой SHA.
Обычные сервисы не перезапускались, health/ready200.

Первый cross-compile был отклонён sandbox при записи внешнего стандартного
Go cache. Повтор выполнен в разрешённый существующий /tmp cache, PASS. Других
ожиданий/критериев не меняли. До независимой проверки/исполнения и qa:ready
пункт1.5 остаётся открытым.
