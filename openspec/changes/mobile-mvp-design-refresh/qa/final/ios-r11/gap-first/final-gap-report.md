# iOS R11: gap-first пакет перед общей правкой

**Подтверждённый runtime transfergap — Info details loading/error; дополнительный source-confirmed gap — roster loading/error/retry. Других доказанных несоответствий в этом ограниченном проходе не установлено. Это не утверждение полноты приёмки12манифестов.** Новых длинных прогонов не запускали, source/device освобождены.

Source `eefcd74f245830494d60b2db9025e955c98c776720611ba7d6d2dbd283b8cc12`, exact983/20files. План R11 прерван: unit227PASS; UI15PASS/0assertionFAIL/0SKIP+1interrupted, wholeNON-PASS; manual284casechecks0 и821designchecks остаются непринятыми. Все прежние отрицательные исходники сохранены.

## F1 — details error/loading не соответствуют опубликованной Info

Authority: UX391; raw `assets/info-r2/source/ui/InfoSurface/InfoSurface.tsx` error/hiddenfooter, `InfoBody.tsx` SkeletonDetails; accepted nav-info отличается общей навигацией, не отменяет эти состояния.

Actual exact983:

- `info/held-details.png` +AX/facts: GETdetails удержан до сервера (`waiting`), вся ready-композиция и организаторский Sharefooter остаются, нет skeleton/«Загрузка встречи».
- `info/failed-details-503.png` +AX/facts: транспортный QA gate возвращает503 после реального fixtureGET200. Верх — legacy «Не удалось обновить информацию»/«Попробовать ещё раз»; ниже старая обложка/факты/ростер и рольfooter. Нет published «Встреча не загрузилась» и отдельного error-state безfooter.

Код: MeetingInfoScreen16–20, независимый content22–42 и footer44; ResourceState.begin11–16/fail27–32 сохраняют value; isLoading экраном не читается. Это воспроизведённое расхождение композиции/состояния, не screenshot-only предположение. 503 указан честно: existing gate не умеет произвольный502; app/transport ради него не менялись.

## F2 — roster loading/error/retry недоперенесены

Raw published nav-info включает people SkeletonDetails(label«Загрузка участников»), error«Не удалось получить ответы.»+«Повторить»→refetch. В native MeetingInfoPeople73–76 лишь Text«Не удалось загрузить участников» безretry и ProgressView; value-first ветка16 скрывает ошибку/загрузку при cache.

`info/roster-hold-before.png`/AX/facts фиксируют warm-cache GETparticipants held: прежние chips/число остаются. Дополнительный error-probe ожидал cold legacyText и остановился (cached value мог скрыть error). Этот helper failure не объявлен product-error/retry runtimePASS. Cold roster-error actual не снят, source-gap явный; нового повторного runtime не делали. Retry/полное loading-state нужно проверить после исправления.

## Область остальных пакетов и непроверенное

Следующая таблица — проверка очевидных отсутствующих веток по текущим источникам/authority, **не design PASS и не исполнение перечисленных состояний**. Полный state-by-state визуальный/функциональный проход821/284 в этой ревизии не состоялся.

| Пакет | Заявлено состояний | Результат gap-first |
| --- | ---: | --- |
| mobile-mvp-account-service-ios | 116 | Profile/Help/About/reader имеют отдельные state views, unknown/receipt/metadata resolver. Нового доказанного отсутствия ветки этим source-audit не найдено; полный runtime не выполнен. |
| mobile-mvp-conversation-ios | 148 | Info details loading/error и roster loading/error не перенесены полностью; F1/F2 ниже. Chat skeleton/read/reaction/unknown и settings notice/conflict ветки присутствуют; это не actual PASS. |
| mobile-mvp-create-invite-ios | 28 | Форма/validation/dirty/known/unknown/date/time/cover ветки присутствуют. Initial draft-load использует общий StatusView; отдельного опубликованного initial-loading в create matrix нет, поэтому без raw-основания дефект не заявлен. |
| mobile-mvp-decisions-ios | 166 | Date/Place/Preparation отдельные cards/forms/ballot/result/confirmation/unknown ветки присутствуют. Редкие роли/результаты и все ширины не проходились заново. |
| mobile-mvp-entry-ios | 36 | Текущие8r5страниц, authbusy/error/cancel и explicit settled-signin защита присутствуют. Keyboard/VO8-page activation остаётся не проверена после остановленной инструментальной ветки. |
| mobile-mvp-foundation-ios | 74 | Общие Back/identity/sheet/sticky/required компоненты и guard/keyboard bindings присутствуют. Все821 комбинации не просмотрены; это не общий foundation PASS. |
| mobile-mvp-invitation-ios | 44 | Public unavailable/loading, RSVP busy/error/unknown и rolecheck ветки присутствуют. Нет нового доказанного transfergap от static-read. Production universal-link OS delivery/real external OAuth не заменялись SDKfixture. |
| mobile-mvp-journeys-ios | 18 | Реальные маршруты соединяют принятые поверхности; F1/F2 затрагивают info-path. Все сквозные истории на новом plan не выполнены. |
| mobile-mvp-launch-ios | 14 | Cold/restore/resume/reducedmotion ветки существуют; source-level unit/suite не заменяет exact983 motion/geometry/realVO runtime. |
| mobile-mvp-meetings-ios | 86 | List/calendar/saved имеют skeleton/initialerror/refresherror/empty/tabselection ветки; в отличие от Info refresh-state здесь явно отделён. Полный runtime не выполнен. |
| shared-rsvp-routing-ios | 29 | Confirmed going/chat, maybe/saved, declined/result, no-write roles и eventrow ветки присутствуют; предыдущие свежие preflight13методов не переносятся в formalR11. |
| mobile-mvp-vibe-ios | 62 | Album empty/error/loading/denied, failedphoto/retry, uploadpartial/export/permission ветки есть. Полный103×2source-suite прерван до конца; primary/motion/allstates не принимались. |

Открытые границы перед новым final candidate:

- Native logout-error semantics остаётся отдельным pending продуктовым вопросом; local-first не выдаётся за сохранение профиля при503.
- Полная off/on TTS через pinned SDK64cap остаётся UNMEASURED. Actual nativeSwitch0→tap→1 и realformSpeech проверялись в preflight, payload TC-SUPPORT-703D40F6 этим не доказан и остаётся обязательным отдельным сценарием.
- Восьмистраничный keyboard/VO безswipe путь TCMOBILEONBOARDACCESS не получил полноценного actual proof; ветку исследования активации по поручению не возобновляли. Это ограничение проверки, не доказанный appbug.
- PhotoKit/permissions/export, large/reduced/short-IME/landscape всех экранов, редкие роли/result/conflict/unknown и native trackpad/pointer состояния ещё не принимаются по одному smoke/source-read.
- Исторический oldclient native C60 — N/A в текущем mapping по firstrelease, не PASS. Покрытие других compatibility/cover/capability частей не сокращали. Настоящие production association/OAuth не утверждаются fixture-доказательством.

## QA attempt provenance/cleanup

Первый Info-probe после пригодного heldcapture ошибочно ждал marker200 после удаленияgate: matchingRule уже нет, это QA-only preconditionfail. Original `info-runtime.log`/driver/xcresult сохранены. Отдельный error-only метод снял503 и завершился12.450s; второй roster-method содержит пригодный heldcapture и непригодный cold-errorprecondition. Результаты execution не названы featurePASS. `info-error-roster-runtime.log`, `groups/` и `drivers/` сохраняют оригиналы.

Свои fixture/locks завершены, keyboard prefs восстановлены, собственный app закрыт. Продукт, canonical tests, cases, manifest, план и эталоны ревьюер не менял. Root может начинать единую app-пачку по F1/F2; остальные непроверенные состояния требуют свежей независимой проверки и required suites после freeze, не догадок о PASS.
