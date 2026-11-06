# Android R9 — запуск 3.2/3.7

Свежие independent manual/design на plan18:17:39.255Z, source7f4f7abb…fade9fe, frozen APK a0dd600c…05376c4e. Три launch-case checks passed;16declared design states independently reviewed with actual+approvedraw+interaction. Никакого pass остальных280cases/11designmanifests.

На320x568/360x800 выполнены cold/единственный поворот1200ms/долгий APIrestore со статичным словом/Home-resume/configuration change/currentcanonical real Activity.recreate/fastrestore. На обоих scale0; отдельно реально включённый TalkBack с touchExploration и successful loading-name accessibilityfocus, фактический MainActivity locale ru. Настройки восстановлены, собственный launchfixture остановлен.

Fresh official unit202/0failed/0errors/0skipped AFTERgeneratedclean PASS. Official fullUI99+2: **passed**, exit0; raw stdout/suite-summary-r9.json сохранены. Все обязательные suites прошли. Готово к независимому root gate для3.2/3.7; checkbox выполняетroot. Reviewer не менял product/source/tests/cases.
