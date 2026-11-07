# Android R11 — сводка gap-first аудита перед одной пачкой исправлений

Дата:07.11.2026. Независимый reviewer, только QA. Source `19721ad674bde82e88fd2f570d5ea78991d3d507b698deb1c6b18ab89a1c45d9`, exact-primary APK `17f03868ba131fea4d00f04fa7b8c27161617177d9c71991846bf59ec24019a4`. Это конечный список найденных на данном этапе расхождений; **это не полная приёмка всех283кейсов/823состояний**. Продукт/канонические тесты/кейсы/эталоны не менялись. Source/device/Gradle освобождены родителю после сохранения actual.

## Пачка подтверждённых исправлений

1. **Calendar primary error:** при `pageFor(selectedFilter)==null` перед общей ошибкой остаются grid/agenda/дата; raw требует цельную error/retry поверхность. Обе ширины, фактические model/request/PNG/AX. Подробности и пути: `meetings-review/findings.md`, разделF1, `network-r3/actual/calendar-network-diagnostic-small-phone.json`.
2. **Interrupted RSVP:** реальное Activity recreate во время Maybe→Going отменяет saving, сохраняет прежний pending и Maybe, но не показывает unknown-пояснение. Нет ложного расширения доступа/потери ключа. `meetings-review/rsvp-recreate/`: before/afterJSON с одинаковым pendingSHA, actualPNG/AX. Вердикт относится к UI unknown; probe4.658s успешно собрал факты.
3. **Unread + large text:** font1.8/360dp,99+переносится и перекрывает многострочное место. `meetings-review/large-text-negative/actual-os.png`, системные font/window факты рядом. Обычный101→feed-end→API0 и отсутствие нулевой подписи отдельно подтверждены actual/API на двух ширинах (`unread-environments-r4/actual`). Полный helper после роста шрифта ограниченно остановлен; не выдаётся за passed.
4. **Info loading/error:** открытие Info из действующего чата не делает GETmeeting. При точечном blocked/delayedGET details остаются готовыми, loading=false, issue=null, действия активны. Присутствует лишь новый GETcover. Native Content не содержит самостоятельной loading-ветки; footer не скрывается при loading/Load. Approved info-r2 показывает SkeletonDetails либо отдельную error/retry и скрывает footer. `meetings-review/info-open/actual/info-on-open-{blocked,delayed}-model.json`,PNG/AX, source refs,10.145s diagnostic. Это не coldchat/roster proxy. Нужны собственные Info/roster loading/error/retry по принятому контракту; exact retry после исправления ещё не проверен.
5. **Calendar primary long loading:** raw SkeletonRows и TC-UI-LOADING-STABILITY против сохранённой grid с нижним CircularProgressIndicator при первой delayed day-load. Actual `meetings-review/network-r3/actual/calendar--loading-small-phone.png`; request!=null проверялся до capture, предшествующий error имел cached=false. Родителю отдельно передано, что непосредственный `pageFor` JSON именно в loading ещё не снят; не смешивать с правильным сохранением cached refresh. Родитель включил первичную loading в ту же пачку.

Старый F1 period320/font1/count77/1 исправлен и независимо PASS9.603s на текущем17f. Он не является новым отрицательным замечанием. Проект шрифт/count не уменьшался под обвязку.

## Конфликты требований, без самовольного pass/N/A

- `TC-VIBE-IOS-BACK-ONLY`, meeting-memories.yaml775: устаревший «текстовый стиль»/видимое «Назад» против более позднего опубликованного mobile-mvp.md16–17 (тонкий шеврон без видимого текста). Actual PageBack одинаков у сервиса и вайба. Нужна root test-spec синхронизация с принятой navigation-коррекцией; не продуктовый missinglabel.
- `TC-INFO-D5C31112`: native посетитель открывает политику «со страницы входа», а принятый8page onboarding и TC-INFO-ONBOARDING-NO-SERVICE прямо исключают входы в документы там. FreshEntry весь путь/AX это подтвердили. Нельзя выдать внешний webdocument за native шаг. Root определяет согласованный путь/применимость по authority; reviewer не исключает кейс.
- Известный native logout-error-preserve остаётся blocked/pending user decision. HTTP503 после успешного local-first выхода не доказывает сохранение профиля.
- C60 прежний поддерживаемый native binary: root уже определил N/A первого выпуска. В исходном283plan оставлен skipped, не pass. Другие compatibility cases не исключены.

## Все12пакетов: что действительно проверено и что ещё не закрыто

| Пакет | Фактическая текущая база | Непроверенное / ограничения |
| --- | --- | --- |
| Launch3.2/3.7,16states/3cases | Свежий полный manual/design, реальный TalkBack/RM, rootgates и push | После изменения source понадобится новый проход; текущий pass остаётся только R11 |
| Entry3.4/3.9,36/5 | Свежий полный manual/design8pages/nav/busy/error/context/TalkBack, rootgates/push | SyntheticSDK +realHTTP не равен настоящему OAuth/подтверждённым OS links |
| SharedRSVP15.4/15.7,29/6 | Свежие6кейсов/29states, роли/unknown/late/revoke/события, rootgates/push | Дополнительный lifecycleF2; новый source потребует fresh14 приоритетных cases |
| Foundation6.3/6.6,74/11 | Обязательный current sourceUI: sheet controls/dirty/unknown/IME/доступ/keyboard +primary navigation proofs | Полное сопоставление74states/11cases и отдельный declaredTalkBack ещё не завершены; не allpass |
| Meetings7.3/7.6,86/57 | Exact-primary320font1, обе геометрии normal/long/past/undated/empty/month/day;20/51+revision+context; network/retry; реальные101→0; worker transition1→0/1 | F1/F3/primaryloading; large/RM/landscape/shortIME матрица не завершена; Maybe matrix прервана F2; полный57stepmapping ещё не закрыт |
| Create8.3/8.6,28/25 | Fresh source99: create/draft/dateprefill/cover processing+systempicker/validation/revision; просмотрен текущий create actual | Полная28state primary companion/reference matrix и оставшиеся ручные steps не завершены |
| Decisions9.3/9.6,166/92original | Fresh source99: date/place/task create/vote/apply/cancel/conflict/unknown/recreate/large; текущие формы/ошибки просмотрены | Полный166state/точныйstepmapping и оставшиеся focus/role/manual variants не завершены. C60 только skipped/N/A |
| Conversation10.3/10.6,148/35 | Fresh source99: очередь/черновик/receipt/reactions/typing/IME/SDKrevocation; обаprocess-deathPASS; живойInfo boundary дополнен | InfoF4, interruptedRSVPF2; все148state actual/reference/interactions и declaredaccessibility ещё не готовы |
| Vibe11.3/11.6,62/22 | Fresh source99:103originals/allpages/preload/offline/save/cancel/error/revoke; actual stack/grid/viewer просмотрены; **дополнительный existing PhotoBatchRetry PASS** на exact17f с realbaseline0/partial/recreate/publishcounts[1,2]/exact2attachments/retaineddraft | Не запускались новые длинные omitted suites; полноценные settle/delayed/offline-both-directions/manual62state matrix и MediaStore process-recovery supplemental ещё нужны; Backauthority conflict выше |
| Account-service12.3/12.6,116/27 | Fresh source99: full/partial/cleared provider fields+GETprofile/noDELETE; support9/10/3000/3001+real201lostACK/samekey/body/receipt; actual profile/help/about просмотрены; exact-primary current metadata/Back вF1 | Local/unavailable/optionalbuild доplan не переносятся в formalR11; current fresh fallback component states ещё нужны. ПолныйTOC/history/crosslink,selector/attachment/a11y matrix не завершены. Logout иguestpolicy authority выше |
| Journeys13.3/13.6,18/17 | Свежие связанные launch/entry/RSVP и densecalendar/context/realworker; source99 содержит остальные базовые действия | Не all17journeys: требуется точное совмещение steps с evidence и закрытие остальных пакетов, а не общий exit0 |
| Invitation8.9/8.12,44/38 | Fresh canonical6invitation methods в99 +sharedRSVP actual; Info/сохранённыеMaybe дополнительные факты | Полная44state/38step primary matrix ещё не завершена; runtime signedOSlinks/realprovider не доказаны syntheticSDK/customscheme |

## Проверки и границы

Обязательные source-scope suites после plan:203unit и99UI+2persistence PASS. Production Debug/Release/Lint/format/check PASS. Их не повторяли после gap findings. Source-suite APK9429 честно отделён от exact-primary17f,492payload entries одинаковы; source-suite actions используются только при точном совпадении с шагом, не как общий pass.

Новый targeted existing PhotoBatchRetry не входит в99 и выполнен отдельно, без изменения теста: `vibe-gap-preflight/photo-batch/binding.json` доказывает SHA root==CoW; API нулевой precondition записан перед началом. Этот PhotoBatchRetry проходит загрузку фотографий из чата; он не заменяет отдельный вход «Добавить фото» в вайбе или всю проверку TC-MOBILE-VIBE-STABILITY. Собственные QA-фотографии удаляются каноническим finally. Частичный unknown helper, ошибочные guard/locator и bounded stop сохранены отрицательными, не замаскированы повтором всего теста.

После partialCommit новые долгие suites не запускались. Device восстановлен (font1/wmreset/scales1), QA app остановлен; собственные56763/54612reverse/config и coverb64 удалены. Дополнительные own Go fixtures остановлены; production/реальные пользователи/сообщения не использовались. Ревью не запускало VoiceOver и не исключало TalkBack.
