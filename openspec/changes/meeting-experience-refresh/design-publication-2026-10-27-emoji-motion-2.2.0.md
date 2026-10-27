# Движение панели эмодзи · 2.2.0

Основание — принятый запрос пользователя анимировать открытие всех popup,
модальных и нижних панелей, подтверждённый «давай». У emoji-дока этот случай
оставался вне явно опубликованной нормы. Дополнение не меняет композицию,
действия, размеры и иконки; не оправдывает расхождения текущего приложения.

`motion.duration.emojiPanelEnter/Exit` — 180/150 ms из действующей шкалы,
easing — `motion.easing.standard`. Mobile dock раскрывается высотой/opacity,
desktop сохраняет popup с opacity. Выход удерживает поверхность до завершения,
но сразу выключает её ввод/AX. Повторное открытие отменяет старый completion,
Reduce Motion переключает сразу. Фокус, selection, черновик и якорь сохраняются.

[Raw](assets/revisions/2026-10-27-telegram-chat/chat.html) обновлён до реализации;
источники предыдущей версии — `assets/revisions/2026-10-27-telegram-chat/history/2.1.0`.
TypeScript/bundle прошли; в IAB проверены открытие/закрытие, сохранение текста,
возврат фокуса в composer и композиция. Это не измерение native-анимации и
не независимая приёмка приложения. Промежуточные кадры/reduced/rapid reopen
проверяются на новых сборках.

Обновлены [контракт](../../../docs/design/components/chat-actions.md), UX,
spec/chat-composition, тест-кейс TC-CHAT-EMOJI-DISMISS-FOCUS и manifest.
Предыдущие отчёты и hashes сохранены. Для web/iOS/Android остаются обязательными
feature-test/design-review и gates; открытые задачи 4.5/5.3/6.3 не закрыты.
