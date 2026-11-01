# Прогон chat-15-independent-20261101

Цель: feature. Каталог: 84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e.

| Кейс / окружение / способ | Результат | Наблюдение |
| --- | --- | --- |
| Ограниченная загрузка и отображение истории: Границы страницы и пустой хвост (TC-CHAT-PAGE-BOUNDS/backend-page-retry-independent/manual) | passed | Fresh memory+SQL54page configurations each x20 across1k/10k/100k,limits1/50/100,6directions; memory exact order/hasMore/anchor/empty and bounded rows;SQL p95 .304–2.794ms,stock21indexed physical-bound plan checks. Quantitative supplement to unchanged current412-input functional PAGE/LOOKUP case evidence; original functional action times retained in prior-functional-case-results.json, not copied as newly executed. Required backend-unit-integration freshly executed after this plan,count1. No client/HTTP/OAuth/capacity/production SLA claim; own markedDB and binary removed. |
| Устойчивое намерение отправить: Адресный повтор text и media после потерянного ответа (TC-CHAT-IDEMPOTENCY-LOOKUP/backend-page-retry-independent/manual) | passed | Fresh real Service retries720:memory+SQL,3histories,text/photo/file,before/after31d,x20;one feed lookup and one returned row,stable identity/attachments,no fullFeed;18raw SQL physical-budget1 plans. Quantitative supplement to unchanged current412-input functional PAGE/LOOKUP case evidence; original functional action times retained in prior-functional-case-results.json, not copied as newly executed. Required backend-unit-integration freshly executed after this plan,count1. No client/HTTP/OAuth/capacity/production SLA claim; own markedDB and binary removed. |
| backend-unit-integration (backend-unit-integration) | passed | Process exit: 0 |

## Обязательные автоматические наборы

- backend-unit-integration: passed

Наличие отчёта не означает готовности. Выполните qa:ready / qa:release-ready.
