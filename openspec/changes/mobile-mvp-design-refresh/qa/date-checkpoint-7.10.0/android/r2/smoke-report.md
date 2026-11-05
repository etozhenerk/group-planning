# Android «Предложить дату» — R2 targeted checkpoint

Вердикт: **needs-fixes**, только два оставшихся визуальных замечания карточки. Не финальная приёмка и не полный manifest/gate.

Frozen APK SHA256 `3a9d333808370cdc1aa9968e980816c0494092437f7b5ec8663089fa567e86e3`, source кандидата `0fa075aca1180ea11a985ed8201f549dfd329b32dfb309d2b282bce3b5033743`, DS7.10. Установленные bytes совпали: [installed-after.json](installed-after.json). [review-binding.json](review-binding.json) содержит binding и SHA свежих кадров/XML.

## Замечания одним пакетом

1. **P2 — действие «Предложить дату» в карточке белое и без +.** В raw nav-date/date-r1 это accent text action с левым +. Actual [card360.png](card360.png), raw [reference-card360.png](reference-card360.png). `DatePollBallot.kt:73–81`: LocalContentColor и только Text.
2. **P2 — disabled «Проголосовать» сохраняет полный светлый action fill.** До выбора вариантов XML у clickable parent явно `enabled=false`, но кнопка выглядит активной; raw показывает приглушённый disabled fill (общая коррекция opacity .65). Actual [card360.png](card360.png), [card360.xml](card360.xml); raw [reference-card360.png](reference-card360.png). `DecisionActionButton.kt:26–31`: fixed colorAction независимо от enabled.

## Targeted observed-pass

- Новая карточка: «Опрос», «Когда встретимся?», note, отдельные дата/weekday/count, новый footer, avatar fallback снаружи, actor/time под карточкой. Сверено со свежим raw reference. Данные/число участников у эталона отличаются; это сравнение композиции. Список голосовавших не проверялся: у API seed 0 голосов.
- Deadline360: дата `[40,1189][348,1285]`, время `[372,1189][680,1285]` — равные154dp поля, gap12dp. [deadline360.png](deadline360.png), [deadline360.xml](deadline360.xml), [reference-form360.png](reference-form360.png). Switches получили компактный visual при сохранении48dp строк. 320dp/font1.8 существующей формы снят в [deadline320-large.png](deadline320-large.png), но кадр показывает область параметров, не сам deadline; отдельный pass large deadline не заявляется.
- Свежая форма → Add third → системный Back → подтверждение в том же листе. «Продолжить редактирование» возвращает форму с третьим вариантом; повторный Back → «Выйти без сохранения» закрывает лист; reopen содержит исходные две даты. [dirty-confirm360.png](dirty-confirm360.png), [dirty-stay.xml](dirty-stay.xml), [left.xml](left.xml), [fresh-form.xml](fresh-form.xml), [actions.json](actions.json).
- Unknown regression: на отдельной реальной будущей встрече один UI submit вызвал существующий commit/lost-response fixture. После системного Back остаются та же форма, blocked fields и «Повторить отправку», dirty-confirm не появляется. [unknown-after-back.png](unknown-after-back.png), [unknown-before-back.xml](unknown-before-back.xml), [unknown-after-back.xml](unknown-after-back.xml). Retry/vote/exact-wire/API итог намеренно не повторялись.

## Границы и cleanup

Переиспользован ADB, новых app/test builds нет. Карточка подготовлена реальным authenticated API; UI создание/голос карточки не прогонялись заново. Существующий fixture binary из R1, production handlers без подмены ответов/актора. Первая попытка перейти к unknown сохранила старый Activity sheet; это ошибка QA-предусловия, исправлена cold task launch и ожиданием настоящего chat title перед действиями, не продуктовая находка.

Старый R1 pass не переносился; здесь только свежий targeted scope. Без новых матриц, VO/TalkBack, карт, motion и финальных gates. Device globals восстановлены, own config/namespace/reverse удалены, QA app и только собственный fixture остановлены: [cleanup.json](cleanup.json), `restored=true`. Source/device RELEASED. Приложение, Git, tasks и эталоны не менялись.
