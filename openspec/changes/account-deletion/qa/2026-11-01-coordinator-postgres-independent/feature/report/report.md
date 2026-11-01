# Прогон account-cloud-sql-independent-20261101

Цель: feature. Каталог: 84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e.

| Кейс / окружение / способ | Результат | Наблюдение |
| --- | --- | --- |
| Атомарность и безопасный повтор: Ошибка во второй встрече (TC-ACCOUNT-1C58ABFB/cloud-sql-isolated/manual) | passed | Реальный HTTP DELETE /api/v1/me → accounts.New → PostgreSQL AccountUpdate. SQL trigger на второй встрече проверяет отсутствие первой внутри transaction, затем nextval и SQLexception; HTTP500 без privateSQLdetails. Новый независимый pool:25business tables byte fingerprints/counts исходные, обеmeetings/profile/provider/2sessions/handoff сохранены;нетreceipt/tombstone/revocation. Затем штатныйretrycommit204,старыеsessions401,anonymousreceipt204,new same-subject account/session survives,operationsecretBearer401,25hreceipt401. |
| Ограниченная загрузка и отображение истории: Границы страницы и пустой хвост (TC-CHAT-PAGE-BOUNDS/cloud-sql-isolated/manual) | passed | Memory: свежая матрица1k/10k/100k × limit1/50/100 ×6 directions; точные последовательности/ASC/hasMore, anchor и alias guards. SQL: та же матрица с20samples/config и tail bounds; stock SQL отдельно проверяет gaps/hasMore/around. Stock memory sparse positions >2^53/uint64 max, invalid limits/incompatible cursors, overflow rollback и cancellation; HTTPS extra probe:400 для0/101/overflow/negative/incompatible,404 missing own around,403 foreign initial/after/around. Bounded Store spy требует access до private чтения. Stock memory clone/snapshot/rollback/transaction-close/cancel и SQL snapshot/rollback+index/LIMIT/EXPLAIN на1k/10k/100k. Свежая облачная матрица54config ×20samples: p95 0.253–2.246ms, бюджет100ms. Оценка включает transaction+SQL+JSON decode, не network E2E. |
| backend-unit-integration (backend-unit-integration) | passed | Process exit: 0 |

## Обязательные автоматические наборы

- backend-unit-integration: passed

Наличие отчёта не означает готовности. Выполните qa:ready / qa:release-ready.
