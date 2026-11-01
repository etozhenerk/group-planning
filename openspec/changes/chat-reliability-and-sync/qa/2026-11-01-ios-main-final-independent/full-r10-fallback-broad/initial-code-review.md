# Независимый первоначальный review fallback

Scope: два exact frozen файла в reviewed-source; production правки reviewer не вносил. Прочитаны protocol.md§«Порядок синхронизации», runtime callsites, refresh/sync lifecycle и новый ChatFallbackTests.

Новый scheduler хранит baseinterval отдельно от random multiplier. Вход delay10 даёт наблюдение10, затем3→6→12→30; delay3 даёт3→6→12→30. Jitter применяется к каждой следующей независимой базе, previous jitter не удваивается. Все production callsites передают ровно3/10. Active/current/generation/realtimeReady guards и single fallbackTask сохранены. MainActor sleep/random injection применяется к реальному scheduler; defaults используют Task.sleep и Double.random0.9...1.1, production bypass не вводится.

Deterministic regression содержит literal expected10,2.7,6.6,10.8,33,27,33 и6 реальных mockHTTP feed запросов через FeedOwner, проверяет cancellation/defer cleanup. Он выявил бы прежнее compoundjitter/24 поведение. Фикстура теста sync=false/realtime=true проверяет общий scheduler на успешном legacyfeed HTTP безSDK subscription; это не доказательство end-to-end sync-capable или realtime fallback. Delay3 path и lifecycle ownership оцениваются source/existingtests, новый тест сам по себе их не покрывает.

Блокирующих замечаний по прочитанному delta не найдено. Compilation/test verdict ещё отсутствует. Следующийшаг currentrequiredios-unit по fresh broad281plan; при compile/assertFAIL дальнейший UI не запускается. Старый8f49PASS не переносится.
