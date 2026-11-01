# Прогон account-cloud-sql-independent-20261101

Цель: feature. Каталог: 84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e.

| Кейс / окружение / способ | Результат | Наблюдение |
| --- | --- | --- |
| Атомарность и безопасный повтор: Ошибка во второй встрече (TC-ACCOUNT-1C58ABFB/cloud-sql-isolated/manual) | blocked | SQL rollback/commit и independent-pool persistence PASS в TestAccountDeletionAtomicityAndPersistence; stock fixture не выполняет ошибку во второй встрече полного coordinator и не проверяет все исходные состояния этого полного catalog expected. Task2.5 SQL criterion принят отдельно; full lifecycle case не объявлен passed. |
| Ограниченная загрузка и отображение истории: Границы страницы и пустой хвост (TC-CHAT-PAGE-BOUNDS/cloud-sql-isolated/manual) | blocked | SQL page/around/highuint64/clone/rollback/cancel и bounded EXPLAIN1k/10k/100k PASS. Не выполнен отдельный полный HTTP/access/limit0/101/cursor sweep и p95 страницы по всем expected; read-state p95 не подменяет p95 этого case. |
| backend-unit-integration (backend-unit-integration) | passed | Process exit: 0 |

## Обязательные автоматические наборы

- backend-unit-integration: passed

Наличие отчёта не означает готовности. Выполните qa:ready / qa:release-ready.
