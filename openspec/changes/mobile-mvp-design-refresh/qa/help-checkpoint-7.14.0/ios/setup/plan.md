# Help/support iOS7.14 — read-only QA prep

**setup-only / not-run**. Frozen candidate/scope ещё не передан. Никакого app runtime, build, fixture, sourceHash/pass. Продукт/кейсы/токены не меняются. Переиспользуется существующий temp runner, auth, ResponseGate, ExperienceScreenshot и SettledGeometry; новая инфраструктура не готовится.

## Authority

Approved idhelp → assets/help-r2/frame.html и normalized preparation/references/help/frame.html; nav corrections navigation-r2; UX «Помощь и обращение/help-r2», контракт mobile-mvp «Профиль и сервис7.14». FAQ —4 прежних вопроса, первый открыт; whole-row plus/minus, высота без растяжения текста; скрытый ответ отсутствует в AX. Под FAQ один «Остался вопрос?» → «Написать в поддержку». Возврат сохраняет раскрытия и чтение.

Support: темы problem/question/idea, message10–3000 после trim, обязательная группа/inlineerror/focus, email необязателен, один PNG/JPEG/WebP≤5МБ, явный picker/cancel/remove. Diagnostics off; до включения native copy «Версия приложения и системы». Ни переписка, ни auth/private-link параметры не включаются автоматически. Unknown/error — один notice у submit, input/file сохранены, busy не даёт дубль. Номер только из подтверждённого APIответа, никогда DEMO-01.

## Existing helpers и нужные QA-адаптации

- `HelpDisclosureUITests`: whole-row/far-edge toggle и AX valueРазвёрнуто/Свёрнуто пригодны. `revealAnswer` опирается на **brand-wordmark**, которого в новом header может не быть; использовать реальный page/header bounds. Добавить один FAQ→form→Back возврат с сохранёнными opened/scroll. Не запускать VoiceOver.
- `SupportFormUITests` и `+Recovery`: reusable picker, message/IME, ResponseGate offline/real201/lost-reply/late-receipt. Старые selectors **«Отправить»→«Отправить обращение»/«Повторить отправку»**, **«Добавить скриншот»→«Прикрепить скриншот»**, **«Убрать»→«Убрать скриншот»**, **«Раздел»→«Раздел приложения»**. Success exit может быть **«К помощи»**, а старый assert **«Яндекс ID»** в profile уже не существует. **«Cookie и данные устройства»→«Cookie»** в profile. Bind по фактическим identifier/AX frozen host, не выдавать ошибку старого selector за продуктовую.
- Системный picker: identifierAdd остаётся стабильным при label«Готово»; cancel identifierCancel/labelОтменить. Не повторять недавнюю ошибку labelAdd/Добавить. Single-selection picker может возвратиться сразу после выбора, без Add — проверять фактическую поверхность.
- `SupportBoundaryUiTests` есть **только Android**. Нативные unit `SupportExperienceTests` проверяют body/key/diagnostics на TestTransport, но это не реальный UI/API receipt. В native UI отдельного SupportBoundary helper сейчас нет.

## Короткий runtime после frozen handoff

1. **FAQ/return**: profile→help; один collapse/expand whole row и второй вопрос; открыть «Написать в поддержку», Back→раскрытия/scroll. Actual normal402, один lower/large spot по окончательному scope.
2. **Form/section**: короткое описание→inlineerror/focus→исправление; тема/email. Section mobileSheet с8 исходными ключами, initial/current selected; cancel не меняет значение/описание/файл/позицию, явный выбор обновляет. Native grabber/Back на видимой поверхности, capture доassert, не Text.swipeDown. Keyboard/Enter не должны отправлять родительскую форму; физические key paths — только если реально доступны.
3. **File/diagnostics/privacy-return**: выбрать только QAasset; picker cancel сохраняет прежний файл; remove исключает его из отправки. Diagnostics off→состав данных→on/off. Privacy navigation→возврат сохраняет черновик/файл. Никаких реальных обращений/получателей.
4. **Real unknown/retry/receipt**: собственная memory fixture, ResponseGate methodPOST/path`/api/v1/support/feedback`. Offline before-request — известная transport failure без commit; held/drop/503 **после real201** — уже принятый сервером lost reply, не непринятие. Успех/номер не видны до подтверждения; retry без изменения payload получает реальный receipt. Сохранить actual notice, request-counts, gate status201, видимый server reference. Нет доказательства exactkey/receipt equality — честный limit, не перенос unitpass.

Footer проверяется **по фактическому overflow**, не по магическому874px. Сохранить доступную native высоту/safe area, natural content/footer и scroll bounds: при отсутствии overflow action в потоке без подложки/тени; при overflow единая flush-edge sticky панель, lastfield/notice доступны выше неё. Raw ResizeObserver сравнивает naturalcontent+footer с visualViewport. Native safe area может менять branch относительно макетного CSSviewport.

## Key mapping

| API key | Published label |
| --- | --- |
| meetings | Список встреч |
| calendar | Календарь |
| invitation | Приглашение |
| meeting_chat | Чат встречи |
| profile | Профиль |
| memories | Вайб встречи |
| sign_in | Вход |
| other | Другой экран |

## Isolation/evidence границы

Existing TestIOSFixture использует `fixtureSupport() = support.New(memory.NewSupport(),nil,time.Now)`: mock/isolated store, без Telegram destination. Свою fixture остановить в конце, root-процессы не трогать. Rate limit5 обращений в окне сохраняется; не делать много успешных отправок для визуальных кадров. `GET /support/feedback/{id}` намеренно404: нельзя добавлять публичный debugendpoint ради proof.

`SOMEWHERE_UI_HTTP_TRACE` даёт path→count, **не** method/body/idempotency key/receiptID. ResponseGate.receivedStatus даёт realHTTPstatus, **не** исходный JSONreceipt. Поэтому UIreference+201 подтверждают фактический server-driven result, но не достаточны для строгой samekey/samereceipt/state диагностики. Это требование к доказательствам финального кандидата, не разрешение нового transport/probe.

Cases: TC-MOBILE-SUPPORT-SECTION; TC-SUPPORT-C47A0ACC/B8F9FF7E/689C3B5F/703D40F6/E6C8467F/751A99A9. Backend Telegram retry2B1C9FBF не является nativecheckpoint. Крайние9/10/3000/3001 и все manifeststates не превращать в новую полнуюматрицу до final handoff.

Тот же simulator31262733-50DC-46A5-938E-4C462D70F109; `SOMEWHERE_IOS_SKIP_VOICEOVER=1` всегда; физическое402×874 и QA320×568 различать. После frozen SHA-проверка immutable/copy mainApp, semantic readiness→stableframes≥0.7s→actual ДОassert. При blocker — capture и короткий факт, без серии новых helper/build циклов. Финальные gates отдельно.

Решение родителя после подготовки: идемпотентность оценивать пирамидой — existing SupportOwner unit freeze-key/body, backend HTTP idempotency и actual UI lost-reply/retry/receipt. Каждый уровень записывать отдельно. Невидимая request/receipt привязка не является ручным pass; после UI родитель сверит expected/gates и только при реальной дыре добавит минимальный probe в существующую QA-обвязку. Сейчас новый transport/runner не нужен.
