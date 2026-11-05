# Native fixture для входа по приглашению

Стандартные native UI-fixture используют resolver, всегда возвращающий false;
вход с контекстом приглашения получает422 ещё до SDK. Этот QA-overlay подключает
тот же read-only `meetings.Preview`, который проверяет действительность ссылки.
Невалидная ссылка остаётся невалидной. Серверные обработчики, SDK exchange,
проверка PKCE и правила RSVP выполняются из текущих исходников без изменений.

Из корня вызвать `python3 <путь>/prepare.py /private/tmp/<новый-каталог>`, затем
из backend собрать `go test -overlay <каталог>/overlay.json -c -o <каталог>/httpapi.test ./internal/httpapi`.
Передать binary через `SOMEWHERE_IOS_FIXTURE_BINARY` либо запускать его с обычными
переменными native-fixture. JSON overlay и diff касаются только двух `_test.go`.
`provenance.json` содержит SHA оригиналов, overlay и всех production Go-файлов.
Оригинальные файлы репозитория не редактируются.

Используются memory.Store, тестовые личности и отдельный loopback TLS-сервер.
SDK fixture не подтверждает работу внешнего Яндекс OAuth или системную доставку
Universal Links; эти границы проверяются отдельно.
