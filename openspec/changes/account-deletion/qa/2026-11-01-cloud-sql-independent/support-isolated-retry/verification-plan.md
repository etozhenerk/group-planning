# Изолированный повтор support process persistence

План до запуска. Root разрешил новую пустую somewhere_integration с новым marker после завершённого cleanup первого прогона. Старые full/seed/verify и FAIL не переписываются.

Причина отдельного окружения: полный suite оставляет собственные pending feedback с реальным CreatedAt01.11. В retention шаге opt-in fixture время28.10 перемещается на30дней; прежние более новые записи ещё допустимы к доставке. Adapter второго worker имеет безусловный error при любой доставке, включая этот поздний cleanup вызов. Это не доказывает двойное приобретение исходного lease: ранний assert217 в первом FAIL не сработал.

Новый marker: somewhere_sdd_support_20261101_503f28ba5481a27d. Проверяется отсутствие БД до создания; sudo postgres используется только для createdb с owner somewhere_migrator, который не получает CREATEDB/SUPERUSER. Все миграции и test producer работают от somewhere_migrator. До tests должны быть0user tables/0feedback; metadata/health/PID/restarts фиксируются.

Без изменений binary/source/assertions выполнить только TestSupportMigration, затем TestSupportProcessPersistence с phase=seed и phase=verify в разных процессах. Ожидаемые product preconditions прежние: один synthetic feedback, частично подтверждённая доставка, после нового процесса тот же screenshot/diagnostics/progress; второй worker не берёт активный lease; retention удаляет именно эту запись. Нет реального Telegram и проверки backup7days.

Наблюдаемый результат отдельный от первого FAIL; нельзя объявлять общий полный suite повторённым или скрыть прежний skip. После тестов — guard нового marker/owner, DROP только этой DB, отсутствие DB, health/ready200 и PID/restarts. Formal feature plan первого прогона сохраняется; общий support durability case с API/backup остаётся неполным.
