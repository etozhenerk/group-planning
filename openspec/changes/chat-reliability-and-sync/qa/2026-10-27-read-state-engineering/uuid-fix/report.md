# Canonical UUID в batch receipts

Нативный iOS SDK-проход обнаружил uppercase UUID из Codable: read-receipts query возвращал404 для существующего сообщения. Root воспроизвёл это реальным HTTP regression до фикса (raw before). ParseUUID возвращал canonical spelling, но прежний batch проверял и затем отбрасывал результат.

Кандидат `c789772bce4e3af45e47ade9a68cd10b7d9dee0c` нормализует IDs внутри authorized read snapshot до dedupe и storage lookup; ответ сохраняет canonical UUID. Uppercase batch теперь200 с тем жеcount; lowercase+uppercase одногоID отклоняется422. Права на встречу проверяются до разбораIDs; входной массив не изменяется.

Targeted read/sync race, full Go race, vet/build/format и API80schemas/38fixtures/**484actual HTTP responses** PASS. Raw before остаётсяfailed, последующие логи не заменяют его. Новый native fixture r4 включает фикс; signing/TLS/session/wire формат не менялся. Независимый повтор точногоc789 ещё ожидается: предыдущий8d5 PASS не переносится на этот дополнительный фикс.

Позднее документация MAIN уточнила фактический fallback: readiness отвергает старый binary безмиграции007; откат функции делается конфигурацией на совместимомbinary, безdown-миграций. Это не выполненный production rollback.
