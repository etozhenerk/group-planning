# Независимый baseline chat1.5

01.11.2026. Reviewer/executor sdd_server_audit не писал проверяемый backend.
До исполнения прочитаны task1.5, PAGE/LOOKUP, validation-plan, текущий код
storage и внешний авторский probe. Product/backend/catalog остаются frozen.

Объём: текущий bounded page baseline плюс настоящий text/photo/file retry.
Для новых результатов создать feature plan PAGE/LOOKUP до actions. Изолированная
БД only somewhere_integration с новым уникальным marker, owner nonsuper
somewhere_migrator. До создания проверить отсутствие; до тестов и DROP проверить
name/owner/marker. Только свои synthetic записи; после DROP remaining0 и удаление
собственного executable по SHA guard. Production только health/ready/status.

1. Авторский retry probe review: Service SendMessage/PublishMediaWithCaption,
   1k/10k/100k × text/photo/file × до/после31d ×20; ID/one lookup/one returned row,
   SQL EXPLAIN с physical budget1. Не объявлять это HTTP/OAuth/capacity приёмкой.
2. Отдельно исполнить memory retries; добавить memory page timings с теми же
   54 bounded configurations по20 наблюдений, сохраняя assertions границ/порядка.
3. В одном новом guarded DB выполнить только retry probe, прежний узкий page
   latency probe и stock FeedBoundedQueryPlansIntegration. Полный stockPG не
   повторять. Сохранить реальные p95, rows, планы и exit/cleanup.
4. Сверить frozen backend/contracts до/после, сохранить независимые raw и точную
   карту к PAGE/LOOKUP/task1.5; необходимые suites выполнить после formal plan.
   Ожидания кейсов не сокращать; недостающий шаг обозначить gap.

Android full87 продолжает работать независимо; Android source/device ему не
мешать. Серверные измерения не объявлять доказательством клиентских budget7.9.
