# Публичные web-маршруты deployment4.1

01.11.2026, независимый reviewer `/root/sdd_chat_audit`. Проверен живой `https://smwhere.ru` только чтением:43 HTTP GET основного прохода, финальный GET build-info и browser navigation/reload через CUA. Чистое incognito окно Chrome; login/создание/RSVP/сообщения/изменение production не выполнялись. Применены границы независимого feature-test; это standalone qualification существующей deployment-задачи, не qa:ready/release-ready всего приложения. Checkbox не менялся.

## Кандидат

Public `build-info.json`: web `0.1.0-rc.15`, tag `web/v0.1.0-rc.15`, commit `dd9ab2863439e872e716bc1ba811578e5c8cbf07`, build13. Полный номер виден на главной и `/about`. После прохода JSON побайтно тот же (`candidate-after.json`). Tag commit подтверждён локальным Git. Это наблюдаемая public identity, не новая аттестация всего release archive.

Нынешний MAIN с backend metrics patch не выпущен и не является кандидатом этого результата. Прочитанные route-файлы сопоставлены именно с rc15: `backend/internal/webui/{handler,metadata}.go`, `frontend/web/src/app/config/router.ts`; их bytes совпали с tagged versions (`route-provenance.json`). Свежие local backend checks и прежние v2 composer checks не включались в этот public PASS.

## Матрица expected / actual

| Часть 4.1 | Проверка | Результат |
| --- | --- | --- |
| Production dist и same-originAPI/web | GET `/`, `/build-info.json`,32referenced JS/CSS assets из полученного HTML и `/api/v1/me`; browser landing | PASS:HTML/assets200 с одногоHTTPSorigin, настоящий module dist; anonymous API401 с того жеorigin, не redirect к чужомуAPI. Не проверяет авторизованные бизнес-операции. |
| Deep-link reload | Непосредственный ввод `/about`, Cmd+R; `/meetings`, Cmd+R | PASS для публичной справки и анонимного guard списка: маршруты остаются доступны, rc15/build13 в справке, список предлагает вход без раскрытия встреч. |
| Новый invitation path | Разрешённая пользователем ссылка `/i/[redacted]`, затем Cmd+R | PASS:анонимный preview, canonical `/i/`, CTA «Войти и ответить», нет composer/ошибкиnotfound. HTTP200; после reload те же безопасныеassertions и AXhash. Никакое действие ответа/входа не нажималось. |
| Legacy invitation path | GET `/invitations/[redacted]?auth_error=cancelled` без автоматическогоfollow, затем прямой browserlegacyURL | PASS:HTTP308 на `/i/[redacted]` с сохранениемquery; browser оказывается на canonical preview с теми жеanonymousassertions. |
| OpenGraph безJS | Обычный HTTPGET invitation безbrowserJS/cookies | PASS:сразу вHTML присутствуют непустые `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, title иtwitter metadata; canonicalURL соответствует разрешённойссылке. OGimage на том жеorigin, GET200/imagePNG. Значения title/description и самtoken не сохранены, толькоhashes/assertions. |
|404 | GET missing `/assets/qa-missing-20261101.js`, GET `/i/invalid`, browserinvalidinvite иunknownroute | PASS для HTTP404missingasset/invalidinvite; browserinvalidinvite показывает «Приглашение недоступно». Неизвестный extensionlessSPAroute показывает «Страница не найдена», но HTTPshell имеет 200 — это явно сохранённое различие, см.ниже. |
| Отсутствиеprivatechat/session в публичномHTML | HTML `/`, `/about`, `/meetings`, unknownroute, invalidinvite, giveninvite; anonymous APIguard и route-source mapping | PASS для проверенных ответов:Reactrootempty, inlineScriptCount0, нет serialized state/private-message/read-marker/session/access/refresh/CSRF indicators иemail-like значений; толькоexternalmodule и разрешённые публичныеmeta. `no-store`, `no-referrer`, `nosniff`; наinvitation `noindex,nofollow`. Не утверждается исчерпывающийpentest всейсистемы. |

**Итог: проверенная публичная часть 4.1 проходит.** Полный authenticated private-route reload остаётся **blocked для этого прохода**:нет разрешённой production QAсессии/приватного meetingfixture; создание/логин запрещеныscope. Нельзя выдавать anonymousguard за открытие авторизованнойвстречи. Проверка cookies/CSRF подlogin и реальныйOAuth4.2 сюда не входят.

НеизвестныйSPAroute:HTTP200 соответствует текущему serverfallback и client`*`NotFoundPage; подтверждённый HTTP404 есть для invalidinvite/assets. В 4.1 не уточнён обязательный transport404 для каждого extensionlessroute, поэтому не объявляю неоговорённую семантику дефектом и не скрываю soft404. Если canonical4.1scope требует именно HTTP404 дляпроизвольной неизвестнойстраницы, эта отдельная часть **не выполнена** и требует route-aware serverfix, а не новогоbrowserfixture.

## Evidence и приватность

`http-assertions.json` — статусы, headers, SHA256 каждогоответа, безопасные HTMLassertions; полныйtoken/HTMLприглашения/redirectLocation не записаны. `home-nojs.html` — толькообщаяпубличнаяглавная. `public-build-info.json`, `candidate-after.json`, `route-provenance.json` привязывают scope кobservedrc15. `check-public-get.py` — воспроизводимый GET-onlycollector, token получает изenvironment и не печатает/сохраняет.

`browser-actions.json`, safeAX/PNG дляглавной, `/about`послеreload, unknownroute, invalidinvite иanonymouslist послеreload. InvitationAX просматривался только в памяти, в`browser-invitation-assertions.json` записаны лишь выбранныеbooleanassertions иSHA256; invitationPNG не сохранялся из-заданных/URL. Token идентифицировантолькоSHA256 `f80ebc2d8e92202423c8997f58cc203f58369da285d832762b7151467c0a3886`. Incognitoокнозакрыто; браузерныеданныеprodсессии не использованы.

Среда:NativeChrome156.0.8078.74, macOS27.0.1(26A434), обычноеdesktopокно; viewport не заявляется физическимmobiledevice. TLSinterstitialне было; вCLIпроверкасертификатанеотключалась. ПерваяCLIпопыткавsandboxостановиласьнаDNSдоHTTP; разрешённый GETпроход выполнен отдельно. Нет mocks/testOAuth и нет записи production.

Отчёт не проверяет expired/revokedinvite отдельнымиfixture:заданатолькооднадействующаяссылкаиmalformednegative; ниотсутствиеистёкшейссылки, ниanonymousguardнеподменяютсяPASS. Проверкаистечения/отзыва, авторизованныхprivateviews, реальногоOAuth иreceiptвсегорелиза остаётсязаэтимscope.

`npm run agent:check` и scoped `git diff --check` прошли после записи evidence; `agent-check.log` сохранён рядом. Автоматический поиск полного предоставленного token по всем сохраняемым файлам нашёл 0 совпадений. `checksums.json` фиксирует все файлы evidence, кроме самого checksum-файла.
