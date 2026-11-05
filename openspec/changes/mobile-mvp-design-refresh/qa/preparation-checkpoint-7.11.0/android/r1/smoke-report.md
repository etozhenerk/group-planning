# Android Preparation R1 — checkpoint

Вердикт: **needs-fixes**. Короткие независимые design-review + feature-smoke; не полная матрица/manifest и не финальный gate.

APK `86ec04d1e41267161c87f1b520145721360c51aa7d2a732891f292988964d336`, source frozen кандидата `ea249fa1e1fbf45681d33b729e794fe2c697a7a4fdc88326ee1af25d1cae2426`, DS7.11. [Candidate](candidate.json), [installed hash](installed-after.json), [binding/SHA](review-binding.json). Emulator5554/API36, normal360×800dp + один320×640dp/font1.8.

## Замечания одним пакетом

1. **P2 — status в details без иконки.** Actual «Предложена», затем «В работе/Выполнено/Отказ от задачи/Отменено» рисуются plain Text; raw status row содержит leading Task/Clipboard icon. Actual [self-details-offered.png](self-details-offered.png), raw [reference-details360.png](reference-details360.png). `PreparationTaskDetails.kt:30–48`; существующий `PreparationStatusRow` не используется здесь.
2. **P2 — value-группа человека не выровнена вправо.** В actual facts автор/получатель имеют avatar в середине строки и имя с пустым растянутым хвостом; raw compact avatar+name group прилегает к правому краю. Actual [self-details-offered.png](self-details-offered.png), [self-details-offered.xml](self-details-offered.xml); raw [reference-details360.png](reference-details360.png). `PreparationTaskDetails.kt:126+`: оба Text label/name получают weight(1f), поэтому имя растянуто вместо компактной правой группы. Данные и self suffix у raw/actual различаются, речь о выравнивании видимого содержимого.
3. **P3 — required legend без gap после *.** Actual «*Обязательное поле» слеплено, в raw есть интервал между mark и текстом. [form360.png](form360.png), [reference-form360.png](reference-form360.png). `CreatePreparationTaskSheet.kt`: Row с RequiredMark и Text без arrangement/gap.

## Фактически выполнено

- Empty submit → «Напишите, что нужно сделать», focus в title, hint виден с IME: [required360-ime.png](required360-ime.png). Форма короткая, submit в потоке; доступность кнопки после скрытия IME/scroll пройдена, sticky здесь не требовался.
- Title «Bring games»; recipient открывается внутри того же листа; поиск zzzz → noresults; Back скрывает IME, следующий Back возвращает форму без изменения адресата/title. Выбор «Саша · вы»; [recipient360.png](recipient360.png), [recipient-no-results.png](recipient-no-results.png), [self-selected.png](self-selected.png), XML/actions.
- Dirty Back → confirmation той же панели, Stay сохраняет title/self; повторный Back→Leave закрывает, reopen чистый. [dirty-confirm.png](dirty-confirm.png), [dirty-stay.xml](dirty-stay.xml), [dirty-left.xml](dirty-left.xml).
- Реальное создание себе: готовый fixture503 **до commit** → unknown form, поля/адресат сохранены и заблокированы; Back оставляет панель; Retry создаёт карточку. [create-unknown.png](create-unknown.png), [unknown-back.xml](unknown-back.xml), [self-card-offered.png](self-card-offered.png). API до принятия подтвердил `state=offered`, `assignee=null`: [api-self-offered.json](api-self-offered.json). Автоназначения при self адресате нет.
- Card→details→«Принять задачу»→В работе→«Отметить выполнение»→Выполнено, terminal actions исчезли: [self-accepted.png](self-accepted.png), [self-completed.png](self-completed.png). API completed: [api-final-100.json](api-final-100.json).
- На accepted stock recipient task: Decline→confirmation→«Оставить как есть» сохранило В работе; повторный Decline→confirm дал terminal отказ. [decline-confirm.png](decline-confirm.png), [declined.png](declined.png), [api-final-300.json](api-final-300.json).
- На accepted organizer task: Cancel→confirmation→confirm дал cancelled. Один320/font1.8 spot: title/body/actions перенеслись без потери, confirm доступен. [cancel-confirm360.png](cancel-confirm360.png), [cancel-confirm320-large.png](cancel-confirm320-large.png), [cancelled320-large.png](cancelled320-large.png), [api-final-400.json](api-final-400.json).

## Ограничения

Переиспользован ADB и прежний fixture binary, новых app/test builds нет. Raw preparation frame снят свежим; raw card→details реально прокликан. В raw accept попытка сначала попала на background locator, corrected modal locator дошёл до busy, но ACK/confirmation visual в reference не завершён; новых состояний по указанию родителя не добавлял. Поэтому полный visual verdict confirmation/actions, все history/result и все role combinations ограничены, screenshot-only pass им не выдан. Functional cancel/decline/abort actual прошли и API state подтверждён. Фото в actor отсутствует — только actual fallback, реальная avatar-photo загрузка не проверена. Fixture unknown503 до commit, не lost-after-commit; exact wire body/key не перехватывались. Нет полной large/motion/access matrix, VO/TalkBack, карт и финальных gates. Product source не правился; возможный следующий batch не меняет binding этого frozen R1.

[Cleanup](cleanup.json): globals восстановлены, QA app/свой fixture остановлены, собственные config/namespace/reverse удалены, restored=true. Source/device RELEASED. Только QA, без app/tasks/Git edits.
