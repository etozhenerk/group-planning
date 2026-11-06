# Backend16.1/16.2 — подготовка без нового прогона

Root отменил повтор до запуска: задачи уже[x], прежние gates были актуальны до изменения каталога. На этом этапе прочитаны backend/AGENTS.md, актуальный TC-INVITE-PUBLIC-ORGANIZER, raw requirement «Публичная личность приглашающего», testing-manifest16.1/16.2 и existingHTTP helpers/tests.

Новые runtime/Go tests/HTTP: **0**. Продукт/тесты/tasks/Git не менялись, новые процессы не создавались. Ни freshpass, ни formalready не заявлены; старыйpass не скопирован. Source released.

Текущий read-only backend sourceHash (backend+contracts поtesting/config.json): `c9c1e8df9e4a09ec64736f469345b1e68fb833067acc5d2f666e055cfa7351f9`. Это снимок подготовки, не hash принятого нового кандидата. После решения пользователя оlogout и возможного catalogchange нужен свежий formalplan; один будущий run должен начаться после его создания.

Canonical targeted command для будущего согласованного прогона изbackend: `go test -race -count=1 -v -run '^(TestMeetingOpenAPIResponses|TestInvitationPreviewWithoutOrganizerIdentity)$' ./internal/httpapi`. Первый использует настоящий TLShttptest/memory/OAuthfixture и проверяет публичныеname/avatar/denyprivate/nullRSVP; второй — отсутствующуюidentity/service иlegacyrequiredfields. Scope broader than onepreview, не запускался сейчас. Обязательный runner вconfig остаётся `go test -race ./...`; scoped note не заменяет его.

Existing QA tooling для будущего reuse: `qa/feature-public-organizer-r2/live-http.py` (origin8874 устарел, только после собственного новогоfixture), `qa/feature-public-organizer-r2/run/evidence/public_organizer_qa_test.go` (QA-only Gooverlay, не добавлять вapp). Никакой новойобвязки/БД/очереди/внешнихсообщений не создано.
