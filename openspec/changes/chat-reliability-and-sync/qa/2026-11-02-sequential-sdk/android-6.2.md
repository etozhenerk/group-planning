# Android6.2 · SDK/lifecycle/recovery

Последовательная проверка основным агентом на emulator-5554; настоящий JavaSDK
и локальный GoAPI с синтетическими участниками. Production не затрагивался.

- Разрыв snapshot→subscribe безhint: новая запись получена HTTPcatchup.
- Разрыв320.44s,100записей: все100 реально найдены в нативном UI. Быстрая
  прокрутка сначала пропустила10межкадровых строк; меньший перекрывающийся шаг
  заполнил выборку (`range-observed.json`), это не пропавшие сообщения.
- Короткий разрыв дал реальный `recovered=true`; HTTPсверка всё равно выполнена.
- RTT150ms: SDKready→HTTP245ms. SDKbackoff до готовности6.7s записан отдельно.
  Fallback успел получить100изменений раньше SDK: это функциональное recovery,
  а не доказательство полного100→UIбюджета после подписки. Отдельный control
  с удержанием HTTPдоSDKready и полный performanceпрофиль остаются в7.9.
- Настоящий410/reset и replay прежнего ответа: новый epoch/title, прежний
  anchor, pending и новый draft сохранены; старый ответ не перезаписал их.
- Legacywriter безjournal→новыйepoch сохранил запись. capabilities404/disabled:
  реальные отправки из Android черезHTTP, нет параллельного новогоSDKпути.
- Terminal401/403/404 дали по одномуsync за12s, приватных строк нет.
- Серверный expiry: disconnect42.46s, authenticatedme401 через50.43s;
  настоящийlogout, поздний ответ/hint и relaunch не восстановили приватное.
  Часы менялись только уQAсервиса и восстановлены. `security-result.json`.
- Flow/background/fake transport: текущие прежние196unit/92UI+2processdeath
  включают CentrifugeTransportTests, ChatLifecycleTests и реальный
  ChatReadLiveUiTests; общие UIсценарии повторно не запускались.

Найден и исправлен реальный UIпробел: после401 внутренняя встреча показывала
общую ошибку обновления вместо входа. Новый APKda391e85 использует существующее
принятое состояниеg03/skip-to-last, сохраняет private target и не меняет
publictokenpreview. Адресная проверка нового APK: `auth-fix/auth-result.json`
и `public-token-result.json`; актуальные кадры просмотрены. Новый дизайн и
токены не вводились. Первый publicсценарий ошибочно был запущен безAPI;
его setupXML сохранён отдельно, исправлен на штатный invite-anonymous.

После3правокruntime:196unit, formatCheck, Debug/Release/QA и обаLintPASS
(`auth-fix-build.log`). Исторические SDKпроверки15eb/aa11 и их hash сохранены;
изменился только переход к существующему экрану входа. Rawprotocol, metrics,
скриншоты/AX и stageлоги лежат здесь. Оба стенда остановлены, оба cleanup
подтвердили baselineDelta{}. Нет новых агентов, релизов/алертов/миграций.

Закрывается реализация и функциональная проверка6.2. Полные source-wide
qa:ready/7.8, performance7.9 и независимая новая приёмка не объявляются PASS.
