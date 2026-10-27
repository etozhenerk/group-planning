# SQL read-state · run01

Кандидат389ebe7, точный Linux binary и времена — в receipt.json.
Изолированная somewhere_integration создана только для этого запуска;
production данные/конфигурация не менялись. После проверки nonce база и
собственный временный каталог удалены, cleanup подтверждён.

11/12 верхнеуровневых tests PASS,1 FAIL. Общий результат FAILED.
TestChatReadState100kPlanIntegration обнаружил полный Index Only Scan100000
feed_entries для receipts-100 при бюджете100. Query elapsed37.123ms и p9532.620ms
не отменяют нарушение объёма работы. Исполнитель получил воспроизведение,
бюджет не ослабляется; нужен новый кандидат и отдельный SQL run.

Прочие измерения: activation100000/3 участника2.405ms, unread-count36.725ms,
first-unread0.039ms; p95 unread31.903ms. Atomic read-state/rollback/no-op test PASS.
Миграции, journal/outbox/retry/retention/window regression tests также PASS.
Raw EXPLAIN и все результаты находятся в sql-live.log. Этот запуск не является
независимой функциональной или релизной приёмкой.
