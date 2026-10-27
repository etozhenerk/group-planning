# Нейтральный бриф независимому reviewer

Проверь frozen web candidate в этой worktree по raw specs/cases; продукт/кейсы/
токены/source hashes не меняй. Только отчёт/evidence в отдельном подкаталоге qa.
Прочитай feature-test и design-review; applicable web cases из chat-sync.yaml,
chat-security.yaml и same-row states design-manifest.json. Полный feature scope
4.4/read-state ещё открыт; различай результаты конкретных выполненных действий.

Окружение: candidate.json, environments.json; compiled demo `.cache/web-demo`.
Backend exact d32deaa, binary `/tmp/chat-realtime-browser-fix.test`.
Для своего app fixture используй свободный8459:

```sh
SOMEWHERE_BROWSER_FIXTURE=1 SOMEWHERE_BROWSER_CHAT_REALTIME=1 SOMEWHERE_BROWSER_DIST=/Users/misha/.codex/worktrees/chat-web-sync/group-planning/.cache/web-demo SOMEWHERE_BROWSER_ADDR=127.0.0.1:8459 /tmp/chat-realtime-browser-fix.test -test.run '^TestBrowserFixture$' -test.timeout 0
```

TLS loopback; fake OAuth Саша/Лена. Стенд только memory, собственные встречи.
Не трогай main или8445/61441/52531. Raw reference file:// ранее заблокирован политикой;
не обходи эту конкретную блокировку через HTTP. Actual работающий app по обычному
HTTP/TLS fixture разрешён. Если reference нельзя просмотреть — сохрани blocked
design state, не выдавай просмотр исходника за visual acceptance.

Обычный source runner `web-chat-e2e` требует sync/realtime=true; для внешнего binary
передай SOMEWHERE_CHAT_FIXTURE_BIN. Результаты исполнителя лежат в raw, но независимый
вердикт выноси по собственным действиям. Расхождения и недоступные проверки сохраняй
отдельно, со сборкой/hash. Source-only suites не подтверждают acceptance.
