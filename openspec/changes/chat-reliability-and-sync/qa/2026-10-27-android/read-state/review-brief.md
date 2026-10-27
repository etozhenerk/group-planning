# Brief независимой Android-проверки

Это кандидат реализации, без заявленной независимой приёмки. Источник и APK
зафиксированы receipts; implementation delta — от baseline 7a5fa1a.
Проверять текущий DS 2.5.1 / chat-read-state и current testing change; исходные
report/evidence не переписывать. Reviewer пишет только отчёт/evidence, executor
исправляет после координации. Автор реализации не является reviewer.

Фокус: saved UUID/экранный top offset при истории, late card/ACK/IME/rotation;
500 мс фактически видимого необрезанного конца, modal/background reset;
положительные/нулевые receipts, контекст своего сообщения, readers paging/error,
Back/focus/offset; personal badge без idle polling, revoke и смена сессии;
DS 2.3 motion/icons/longpress сохранены, но новая footer композиция требует
живого normal/reduced review. TalkBack/font scale/физический Android открыты.

Текущие обязательные build/JVM checks зелёные, final live один PASS. Ранние
anchor/core device passes привязаны к старым хешам. См. checkpoint.md: не
переносить их автоматически и не ставить общий pass по screenshots.
