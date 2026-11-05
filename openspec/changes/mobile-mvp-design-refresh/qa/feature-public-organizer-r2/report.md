# Независимый feature-test: публичная личность приглашающего · r2

05.11.2026, проверяющий `codex-independent-public-organizer-feature-r2`.
Задачи16.1/16.2, `TC-INVITE-PUBLIC-ORGANIZER`. Область — backend/API, без UI-приёмки.

Вердикт: **passed**. Expected1/1passed; отдельный обязательный `backend-unit-integration` passed. Scoped `qa:ready --tasks16.1,16.2` — `ready=true`. Это не готовность всей mobile-фичи и не release receipt.

Проверен новый loopback TLS API8874, Go1.27.2, отдельный memory fixture, test-only OAuth. SourceHash `c9c1e8df9e4a09ec64736f469345b1e68fb833067acc5d2f666e055cfa7351f9`, catalogHash `cc54c16ab0ff50fd365c84646b6fb3ef431f05331c3eb97cd5671a3944bb8b2c` совпали с планом после прохода. Ревьюер менял только QA evidence/report/run.

## Фактически повторённые проверки

- Реальная авторизация организатора `profile-fields-full` и второго профиля. `/me/profile` подтвердил приватные контакты и аватар организатора; значения контактов/CSRF/cookies не сохранялись.
- Создана собственная встреча. Анонимное, авторизованное и повторное превью вернули одинаковую реальную публичную личность с точным набором `id/display_name/avatar_url`; id/имя/фото совпадают с организатором. Приватных полей/контактов/состава/переписки нет.
- RSVP во всех чтениях null/revision0. Гостю закрыты meeting/feed/participants —403. Feed организатора и список приглашений гостя остались прежними, состав содержит только организатора.
- Недействующий token —404 без личности.
- Независимый QA-only overlay с `go test -count=1` выполнил настоящие HTTP-запросы через production handler: включённый identity с отсутствующим пользователем и выключенный identity **оба опускают organizer**, сохраняют прежние обязательные поля и null/revision0. Оба subtests passed. R1-F1 больше не воспроизводится.
- Исторический web `previewSchema` из3e25d63c заново исполнен на всех четырёх свежих ответах — декодирование прошло, включая обе формы без organizer. Сохранены оригинальные bytes/SHA; для исполнения перенесены только импорты на соседние исторические модули.
- Отдельный mandatory Go race suite выполнен через `qa:run-suite`; exit0, raw log/receipt в run. Части Go suite используют штатный Go test cache, а независимый overlay принудительно выполнен с count1.

Сценарии и pass из R1 не переносились: повторно исполнялись сохранённые QA-драйверы с новым origin, новым backend и новыми данными. R1 сохранён целиком как история.

## Evidence и очистка

`run/evidence/interaction.json` — HTTP действия и статусы без секретов; `public-preview.json`, `signed-preview.json`, `invalid-preview.json` — публичные ответы. `optional-identity-http.log` и два JSON preview — независимые HTTP края. `legacy-decoder.log` и `legacy-web-3e25d63c/source-index.json` — совместимость. `freeze-after.json`, `run/run.json`, `qa-ready.log`, `checksums.json` — идентичность и gates.

Одна собственная QA-встреча остаётся в transient memory fixture владельца: API удаления встречи отсутствует. Две созданные сессии выведены, чужие данные/процесс не сбрасывались; родитель владеет teardown. Настоящие старые iOS/Android приложения, production OAuth, постоянное хранилище и клиентский UI этим backend-кейсом не проверялись. Checkbox ревьюер не менял.
