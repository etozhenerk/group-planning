# Android R9 — RSVP 15.4/15.7

Шесть кейсов выполнены независимо на unchanged source7f4f7abb…fade9fe / APK a0dd600c…05376c4e.29declared design states просмотрены с current actual/reference/actions. В run.json теперь14manualchecks: ранее принятые3launch+5entry и две officialpassed suites сохранены byte-equal как подмножество; добавлены только6RSVP. Audit — run-preservation-audit.json. Общие202unit/99UI+2persistence не повторялись.

Реальные Going→чат, Maybe→приглашения, NotGoing→подтверждение→личные встречи выполнены по ссылке, из savedcard и сведений. Контролируются конкретныйmeetingID/состав/доступ, обе вкладки и GETответ, без абсолютного требования пустого аккаунта. Подтверждённые Going/member и organizer не записывают новый ответ; outage private-role GET не угадывает доступ, retry восстанавливает правильную роль без события.

Конкурирующий API Maybe дал UI409 до Going; свежий ownerfeed подтвердил, что Going не записан. LostACK после реального NotGoing/раннего RTAccessRevoked убрал privatechat, сохранив публичные факты и исходный pendingkey/body. Тот же intent/key повторно подтвердил Declined без нового события. Отдельная реальная смена SDK-fixture/HTTPсессии не позволила позднему старому ответу открыть старый маршрут.

Для system-event второй actor сначала открылownerchat и дождался реального SDKSubscribed; первый actor затем последовательно сохранил три ответа, каждое наблюдалось в UI. Повторяется тот же NotGoing key/body; warmreload не меняет entries. Независимый readonly API подтвердил ровно3различныхeventID/3answer и отсутствиеjoin при первом отказе. Guestprivatefeed403, UIчат отсутствует. Fresh1.8/scale0/Back-return состояния выполнены тем же productionflow, прежнего фиксированного имени в helper нет.

Auth-no-RSVP designstate использует уже принятый currentR9 entry controlledreturn на отдельно bound5faf realmemoryStore overlay. Не заявлены реальные OAuthprovider/OSverifiedlinks. Остальныекейсы/экраны/платформы здесь не приняты. Root выполняет scoped gates перед checkbox/push.
