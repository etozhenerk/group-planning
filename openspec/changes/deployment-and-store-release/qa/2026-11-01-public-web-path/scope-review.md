# Обоснование scope deployment4.1

01.11.2026, независимый reviewer `/root/sdd_chat_audit`. Уточнение применимости критериев после исходного публичного прохода. Исходный `qa/2026-11-01-public-web-path/report.md`, его assertions/screenshots/checksums не изменялись. Нового runtimeпрохода не выполнялось.

**Авторизованный reload приватной встречи не является обязательным недостающим критерием именно 4.1. По фактически проверенным публичным маршрутам и текущему тексту 4.1 задачу можно закрыть, сохранив 4.2 открытой.** Это не расширяет PASS до авторизации, privatechat или всего requirement постоянногоHTTPSorigin.

## Что требует rawплан

`deployment-and-store-release/tasks.md:75`,4.1:

> Настроить production dist на общем origin API/web; проверить deep-link reload, новый и старый путь приглашения, Open Graph без JavaScript,404 и отсутствие приватных данных в публичномHTML.

Следующий отдельный 4.2 (`tasks.md:76`) прямо включает реальные webcookie/CSRF, вход/отмену/возврат в приглашение, обмен сообщениями на целевомHTTPS и webchecks/build/E2E+внешнийsmoke отдельно отfakeprovider.

`design.md:253–254` перечисляет оба среза одной фразой: dist/commonorigin/deeplink/new+oldinvite/OGnoJS, затем cookies/CSRF/HTTPS. Это агрегированный раздел web, он не переносит всё содержание 4.2 в 4.1 и не требует отдельно privateauthenticatedreload. Раздел не утверждает, что каждый 4.1read обязан быть authenticated.

`specs/service-operations/spec.md:26–35`, «Постоянный защищённый адрес», требует постоянный web/APIHTTPSorigin и сохранение приглашения при входе. Это составное productrequirement: publicopening подтверждено 4.1, **возврат после реального входа остаётся 4.2**, и завершение 4.1 не отмечает весьrequirement полностью принятым. `client-distribution/spec.md` относится к подписанным mobile/storeклиентам; он не добавляет приватныйwebreload к 4.1. Требования onboarding/invitationprivacy сохраняются независимо, ни одно не удаляется.

## Соответствие фактического прохода 4.1

| Прямой критерий | Существующее фактическое доказательство |
| --- | --- |
| productiondist/commonorigin | Publicrc15 buildinfo,32same-originJS/CSS200,HTML200, GETsame-originAPI/me401; CUAреальныйlanding |
| deeplinkreload | Прямой `/about`→Cmd+R, `/meetings`anonymousguard→Cmd+R и действительное `/i/[redacted]`→Cmd+R; serverdist загрузился и сохранил нужные публичные маршруты |
| новый/старыйinvite | Новый 200; старый 308 сcanonical/querypreservation; browserlegacy→тот жеанонимныйpreview |
| OGбезJS | Метаданные уже вHTTPHTMLбезcookies/JS, canonicalmatches, image200 |
|404 | MissingassetHTTP404, malformedinvitationHTTP404 и понятное недоступноеinvitationUI; unknownSPAroute показываетNotFoundUI |
| нетprivateHTML | Проверенные publicответы имеютemptyroot/noinline/нетprivatechat/sessionserialization; authenticatedcontextдлятакогоотрицательногоpublicпроверочногоответа не нужен |

НеизвестныйextensionlessSPAroute имеетHTTP200shell иUI404. Это не скрыто и не «исправлено» в evidence. В доступных 4.1/design/specsнет дополнительной нормы «любой неизвестный extensionlessroute обязан вернуть transport404 доJS». Поэтому не превращаю эту возможную новую serverroutingполитику в незаданный blocker. Существующее 404 поведение проверено положительными/отрицательными HTTP+UIточками; если такая дополнительная норма будет принята позднее, она потребует собственной правки/проверки, а не переписывания текущего результата.

## Как читать исходное blocked

В исходном report написано «проверенная публичная часть 4.1 проходит», затем отдельно помечен blocked **неисполненный authenticatedprivate-route experiment** из-за отсутствияQAaccount/fixture и запрета логина. Это фактическое ограничение данного прохода, а не обнаруженное нарушение прямых критериев 4.1. Требование privateauthenticatedreload в 4.1 было бы добавленным scope. Его отсутствие нельзя заполнять ложнымPASS; одновременно оно не должно удерживать выполненный публичный 4.1checkbox открытым.

Для закрытия 4.1 ссылаться на точный publicrc15 `web/v0.1.0-rc.15`, commit `dd9ab2863439e872e716bc1ba811578e5c8cbf07`, build13 и первоначальноеread-onlyevidence. НынешнийMAINbackendpatch и отсутствиеполногоQA/designgate другихchanges не становятся частью этого узкогоpublicPASS. Не закрывать 4.2, realOAuth/cookie/CSRF/messagecases, expired/revokedfixturecases или весьрелиз этой записью.

Никакие rawтребования, tasks, expectations, исходный report, catalog или продукт при уточнении не менялись. Checkboxрешение остаётся у основного агента.
