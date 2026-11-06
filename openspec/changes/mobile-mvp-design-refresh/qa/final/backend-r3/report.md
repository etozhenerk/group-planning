# Backend16.1/16.2: независимая приёмка R3

**Passed**: `TC-INVITE-PUBLIC-ORGANIZER`,1 применимый backend case. Direct `qa:ready` завершился exit0: ready=true, expected1/checked1, pending[]. Это только backend feature scope; не UI и не release gate. Tasks/acceptance manifest reviewer не менял.

Новый официальный план `mobile-refresh-final-backend-r3-2026-11-06` создан `2026-11-06T13:53:05.121Z` после наблюдаемого health200 своего HTTPS origin. Все новые действия кейса, overlay и обязательный suite выполнены после плана. Старые responses, результаты и pass не переносились; backend-r2 сохранён без изменений.

## Входы и окружение

- Backend source before=after: `c9c1e8df9e4a09ec64736f469345b1e68fb833067acc5d2f666e055cfa7351f9`.
- Новый catalog before=after: `13f9202784a7ce611aa00c9df611fe965f94487f92e7e3993f974be130c0636b`.
- Реально запущенный binary `/private/tmp/mobile-final-backend-r2.test`: SHA256 `aa57e56612e2b7adef5b8a1be7ddf7551fec47c1f4e126d990200beabce8fc81`. Повторно использована та же сборка неизменившегося backend; новый build не заявляется. Новый процесс получил свежий пустой memory.Store.
- Собственный loopback `https://127.0.0.1:9150`, test-only OAuth, nil support delivery, без DESIGN/MEETINGS seeds, БД/Docker и production recipients. TLS certificate тестовый, Python принимает его только в этом изолированном origin.
- Immutable webR2 dist нужен только для startup штатного TestBrowserFixture. Web UI не входит в этот backend-план.
- После действий сессии выведены; собственный PID/command проверен, процесс остановлен SIGTERM,9150 закрыт. Transient данные сброшены. Чужие процессы не затрагивались.

## Exact step mapping

1. `live-http.py` создаёт собственную встречу от profile-fields-full: приватные email/phone/first/last присутствуют в памяти HTTP клиента. Другой профиль misha читает preview после анонимного запроса и повторяет чтение. Organizer равен реальному session PublicUser, whitelist строго id/display_name/avatar_url. Нет контактов, приватного профиля, состава и сообщений. `my_rsvp=null`, revision0. Приватные meeting/feed/participants для гостя403; roster остаётся одним организатором, feed и сохранённые приглашения не изменились. Доказательства: `evidence/interaction.json`, public/signed preview и public-summary.
2. Invalid token вернул404 без identity. QA-only `TestPublicOrganizerIndependentQA` через настоящие TLS HTTP GET проверил отдельно missing real user и disabled identity service: organizer отсутствует, демонстрационная личность не подставлена; прежние обязательные поля и RSVPnull/revision0 сохранены. Оба новых ответа записаны. Historical web DTO из commit3e25d63c заново выполнил decode всех четырёх новых JSON responses; все прочитаны.

Historical schema/code/helpers переиспользованы только как инструменты. Их original/import-relocated SHA сохранены в source-index.json; никакого копирования старых JSON responses, verdict или logs нет. Overlay находится только в QA и подключается через `go test -overlay`, не добавляется в backend source tree.

## Команды и результаты

- `npm run qa:plan -- --purpose feature --component backend --id mobile-refresh-final-backend-r3-2026-11-06 --implementer codex-mobile-apply-2026-11-06 --environments <this>/environments.json --cases TC-INVITE-PUBLIC-ORGANIZER --out <this>`: exit0.
- `npm run qa:run-suite -- --plan <this>/plan.json --run <this>/run.json --suite backend-unit-integration`: exit0 после нового плана. Canonical command — `go test -race ./...`; Go сообщает cache. Дополнительный полный uncached race не повторялся по явному поручению root.
- `python3 <absolute this>/live-http.py`: exit0, реальные новые HTTP ответы.
- Из backend: `QA_EVIDENCE_DIR=<absolute this>/evidence go test -count=1 -overlay=<absolute this>/optional-identity-overlay.json -run '^TestPublicOrganizerIndependentQA$' -v ./internal/httpapi`: exit0, свежие TLS HTTP assertions.
- `npx tsx <this>/evidence/legacy-web-3e25d63c/check.ts`: exit0, четыре новых response decoded.
- `npm run qa:ready -- --plan <this>/plan.json --run <this>/run.json`: exit0, ready=true.

Один первоначальный сбой QA shell redirection из неверного cwd не запускал live HTTP скрипт; сохранён в tooling-path-failure.json. Повтор использовал абсолютные пути. Это tooling correction, не product failure и не прежний pass. Начало manual check берётся из фактического времени создания overlay log/старта live HTTP; timing-provenance.json подтверждает порядок после плана.

Реальный OAuth provider и постоянное PostgreSQL хранение этим кейсом не проверяются. Профили и avatar URL — из разрешённого изолированного fixture. Дефектов и blocked действий в заявленном кейсе не осталось. Source освобождён.
