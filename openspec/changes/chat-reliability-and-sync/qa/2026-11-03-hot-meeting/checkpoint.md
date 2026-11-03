# Chat7.2 — текущий checkpoint

03.11.2026, основной агент. Полный профиль ещё выполняется;7.2 не закрыт.
Production, его данные, CI и релизы не менялись. Все cloud-проверки используют
новую marker-guarded БД и собственные процессы на существующей ВМ.

Исправлены два конкретных недостатка:

- Контекст, отменённый перед SQL lookup, превращался в `no valid session`:
  Session возвращает bool, а callback-error проверялся до context-error.
  Старый порядок вынесен без изменения в классификатор; оба cancelled/deadline
  регрессионных варианта упали. После исправления сохраняется ошибка контекста,
  настоящий auth denial при живом контексте остаётся terminal, отдельная
  storage-error не маскируется. [До](context-before.txt), [после](context-after.txt).
- Authenticate/Users выполняли SELECT через общий identity writer-lock.
  Добавлена необязательная ReadStore-capability: PostgreSQL даёт repeatable-read
  read-only snapshot без advisory writer-lock; прежние Store продолжают Update.
  Reader не предоставляет методов записи. Unit проверяет чтения, transient
  failure и настоящий logout с последующим auth denial: [результат](readonly-unit.txt).

Текущие Go/race/vet/build/dependencies/strict-format/gofmt и API-contract прошли;
560 реальных ответов соответствуют OpenAPI. Opt-in SQL-наборы без DSN не выдаются
за пройденные: реальная БД проверяется отдельно. [Команды и source SHA](checkpoint.json).
Исправленный QA-binary299da928… не установлен в production.

SQL на живом fixture:120 EXPLAIN для6 текущих production queries и ещё20 для
empty-after. p95 planning+execution0.097–0.151мс; просмотрено максимум51/1/0
feed-строк, Seq Scan нет. История100020/100450 записей, role=somewhere.
[Планы](sql-plans.json), [пустой after](empty-plan.json). Это SQL-компонент,
не полная Go/API latency и не commit→visible7.9. Исторический baseline1.5
сохраняет собственный метод и времена; сравнение разных методов не названо ускорением.

Исходные ошибки harness сохранены: начальная sequence уже содержит API-события,
HTTPConnection не является context manager. Затем оригинальный rc.6 действительно
отключал отдельные WS с3503; контекстный регрессионный тест подтвердил один путь
такой неверной классификации. Это не доказательство единственной причины всех3503.
У исправленного кандидата были500 из-за lock timeout. Снимки pg_stat_activity
показали advisory19372002, blocker COMMIT/WALSync до4с; I/O после массовой загрузки
fixture загрязняло измерение. Исходные неудачные прогоны не переименованы в PASS.
Все их receipts подтверждают удаление собственной БД и неизменный production PID.

Текущий полный повтор явно ждёт60с окончания записи fixture, затем сохраняет
прежние100 WS/20профилей,5 сообщений/с15мин и20/с60с. Fsync, таймауты и ресурсы
не ослаблялись. Прохождение этого профиля, хвост очереди и итоговая сверка бюджета
ещё не заявлены. Independent/qa:ready/release-ready PASS этим checkpoint не создаётся.
