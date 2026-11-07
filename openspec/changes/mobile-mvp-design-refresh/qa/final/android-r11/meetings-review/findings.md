# Android R11: текущие замечания списка и границы Info

Независимый промежуточный проход; не итоговый pass пакета. Product APK `17f03868ba131fea4d00f04fa7b8c27161617177d9c71991846bf59ec24019a4`, source `19721ad674bde82e88fd2f570d5ea78991d3d507b698deb1c6b18ab89a1c45d9`. Приложение/канонические тесты/каталог не менялись. Предыдущие отрицательные наблюдения приватной QA-обвязки сохранены отдельно.

## F1: первичная ошибка календаря — needs-fixes

`network-r3/actual/calendar-network-diagnostic-small-phone.json` подтверждает `cached=false`, сетевую ошибку и фильтр выбранного дня. `MeetingListScreen` рисует сетку/agenda до общей ошибки; чтобы увидеть повтор, приходится прокручивать сетку и дату. Raw `info` здесь не используется: источник — `assets/calendar-r7/source/CalendarScreen.tsx`, ветка `state=error`, и `docs/design/components/mobile-mvp.md:123` («Первичная ошибка — цельная поверхность с повтором»).

Actual: `network-r3/actual/calendar--error-small-phone.png` и semantics; reference: `reference/calendar--error-small-phone.png`. Функциональный повтор на обеих ширинах работает (`network-r3/runtime.log`, один тест,64.985s), это не снимает расхождение композиции.

## F2: пересоздание во время RSVP скрывает неизвестный результат — needs-fixes

`rsvp-recreate/` содержит до/после реального ActivityScenario.recreate при активном Maybe→Going и задержке своего loopback HTTP. До: `saving=true`, pending существует, issue отсутствует. После: `saving=false`, тот же pending SHA, сохранённый ответ Maybe, issue отсутствует. Кнопка Going позволяет повтор, другие ответы disabled, но исчезли busy и пояснение о неподтверждённом результате; вновь показана общая подсказка об открытии чата после Going.

Ключ/ответ не потеряны, доступ не расширен. Проблема — отсутствие честного unknown-пояснения после отмены operation в `InvitationScreen` lifecycle finally → `InvitationViewModel.suspend()`. В публичных JSON pending заменён стабильным SHA; исходный private raw-инвентарь сохранён. Probe прошёл4.658s как сбор фактов, это не функциональный pass неизвестного результата.

## F3: непрочитанное перекрывает место при большом тексте — needs-fixes

`large-text-negative/actual-os.png`: реальный MainActivity,360dp, fontScale1.8. Подпись «99+ непрочитанных» переносится на две строки и накладывается на многострочное место карточки. Размеры и масштаб сохранены рядом. `MeetingCard` размещает upcoming unread абсолютным overlay, а нижний reserve содержимого фиксирован; высота подписи не резервируется после роста системного текста.

До увеличения текста actual API101, полное AX-имя101, визуальный cap99+, переход к последним сообщениям и подтверждённый API0 с отсутствующим badge проверены на обеих ширинах. Последующий приватный helper завис в Compose idle после fontScale1.8; остановлен ограниченно, без вывода о причине зависания. Частичные действия не объявлены pass всего метода.

## Ещё проверяется

- Первичная долгая загрузка календаря: raw SkeletonRows и TC-UI-LOADING-STABILITY против текущей grid+agenda/spinner. Есть `network-r3/actual/calendar--loading-small-phone.png`; нужно дополнительное непосредственное model.pageFor snapshot перед окончательным выводом.
- Info: accepted `info-r2` скрывает footer при loading/error и показывает SkeletonDetails либо отдельную error/retry поверхность. Header opener в текущем `InvitationConversation` только открывает панель, без GET/reload; `MeetingInformationContent` требует details, loading-ветки нет. Приватный live probe открытия с точечной задержкой/ошибкой GETmeeting подготовлен; до явного возврата Chrome-слота runtime не запускается.

## Положительные факты текущего прохода

- F1 прежнего календарного шрифта:320dp/font1, real counts77/1,13/500labels и11counter — PASS9.603s (`f1/`).
- День20встреч, страницы50+1, серверная правка между страницами, новая выборка без дублей, сохранение дня/периода/контекста — PASS19.806s (`dense/`).
- Обычные состояния списка/календаря на320×568 и360×800 — пройдены взаимодействия,47.234s (`visual/`); это не замена всем86design states.
- Ошибка/загрузка/сбой обновления с сохранёнными карточками/повтор — пройдены на обеих ширинах,64.985s (`network-r3/`).
- Реальный переход в историю через собственный clock-overlay и ClaimTransition/CompleteTransition: API/SDK/count1→0/1, прежний выбранный день — PASS (`clock/`).
- Maybe error/loading/ready/refresh-error/long/open и начало busy сняты. Продолжение исходного helper после resize не прошло; причина уточнена F2. Это не pass всей матрицы приглашений.

Обязательные fresh source suites203unit+99UI+2persistence уже PASS; их не повторяли. Они не подменяют отсутствующие ручные шаги/состояния. Полный scope Android остаётся283 исходных plan cases/12manifests; C60 отдельно skipped по утверждённой применимости первого native выпуска, не pass. Native profile logout-error остаётся известным открытым конфликтом authority.
