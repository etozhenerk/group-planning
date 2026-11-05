# Android «Предложить место» — R1 checkpoint

Вердикт: **needs-fixes**: одно визуальное расхождение выбранного голоса. Короткий независимый design-review + feature-smoke, не полный manifest и не финальный gate.

Frozen APK SHA256 `3762aa0b9b975f6b5ef779b779f9cf70c24d7b672d140629267e461f47bd1509`; source кандидата `e5a19e62820ca98a0f28496d53b0ea08050d1eb8cacde8a49efeec4a4fea19cb`; DS7.10. Actual normal360×800dp, emulator-5554/API36, один320×640dp/font1.8 spot. [Binding](review-binding.json), [installed APK](installed-after.json).

## Пакет замечаний

**P2 — подтверждённый выбранный голос выделен только рамкой.** После настоящего ACK «За» получает1 голос, но тёмная raised-заливка и светлый текст остаются как у невыбранной кнопки; меняется лишь accent border. В принятом raw выбранная кнопка имеет светлую accent/own-заливку и тёмный текст. Actual [voted360.png](voted360.png), [voted360.xml](voted360.xml); raw после клика «За» [reference-selected-card360.png](reference-selected-card360.png). `PlaceVoteButton.kt:61–65`: background/contentColor фиксированы, selected влияет только на border. Функциональный выбор сохранён корректно, проблема визуальная.

## Фактически пройдено

- Ручная форма без карты: current-place summary, required legend, обязательное multiline новое место, необязательное multiline пояснение, deadline day/time/TZ+note, закреплённый нижний footer. [form360.png](form360.png), [filled360.png](filled360.png), [reference-form360.png](reference-form360.png). Raw Android sheet высокий и частично выходит за reference viewport; фактический footer/scroll проверены в приложении.
- Empty submit → inline error под новым местом + правильный focus, hint и footer доступны с IME: [required360-ime.png](required360-ime.png). Ввод точного current place «Original venue» → «Предложите другое место.»: [same-place.png](same-place.png). Исправление на «New venue» очищает ошибку: [corrected.xml](corrected.xml).
- Dirty Back заменяет содержимое того же листа подтверждением; Stay сохраняет New venue; повторный Back→Leave закрывает в чат; reopen чистый. [dirty-confirm.png](dirty-confirm.png), [dirty-stay.xml](dirty-stay.xml), [dirty-left.xml](dirty-left.xml), [form-reopened.xml](form-reopened.xml).
- Первый реальный POST получает готовый fixture503 **до commit**. Клиент показывает unknown notice, блокирует поля, Back сохраняет форму; retry создаёт карточку, поля/пояснение сохранены. [unknown360.png](unknown360.png), [unknown-back.xml](unknown-back.xml), [created-card360.png](created-card360.png). Это не lost-after-commit proof, wire exactness отдельно не перехватывалась.
- Первый реальный PUT vote также503 до commit: голос не выделен, один error+retry. После retry ACK «За»1. [vote-error.png](vote-error.png), [voted360.png](voted360.png). API независимо подтверждает один `place_poll_created`, `state=open`, `my_vote=for`, `votes_for=1`, `meeting.place=Original venue`: [api-after.json](api-after.json). Новое место не применилось досрочно даже при1/1 голосе за.
- Карточка показывает фактического автора «Саша», avatar fallback, HH:mm, caption, место/пояснение, counts/footer. Raw active [reference-active-card360.png](reference-active-card360.png). Изменён только reference clock на2026-11-05T12:00Z: дефолтный raw deadline21:00 уже прошёл к runtime capture, что делало state=poll завершённым. [reference-state.json](reference-state.json). Сам raw не менялся.
- Один320/font1.8: текст карточки переносится, «За»/«Против» вертикальные, counts/footer читаются и доступны прокруткой: [voted320-large.png](voted320-large.png). Это spot, не полное large покрытие формы/чата.

## Ограничения и cleanup

Новых app/test builds не было, использован ADB и точный frozen APK. Своя будущая встреча создана реальным authenticated API с ASCII current-place для надёжного ADB same-place ввода. Фотография профиля в доступном actor отсутствует — actual photo загрузка не подтверждена; автор этого сценария одновременно organizer, различие автора/organizer runtime не проверялось, хотя read-only binding карточки берёт `entry.actor`. Срок не ожидался/не ускорялся: применение и остальные final-result состояния вне короткого прохода. Крупный composer, motion, полная матрица, VO/TalkBack, карты и финальные gates не проверялись.

[Cleanup](cleanup.json): globals восстановлены, QA app и только свой fixture остановлены, собственные config/namespace/reverse удалены, `restored=true`. Source/device RELEASED. Приложение/Git/tasks/эталоны не менялись.
