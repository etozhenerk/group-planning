# Независимый web auth follow-up · 01.11.2026

Reviewer `/root/sdd_chat_audit`, после завершения composer iteration2. Только живой CUA native Chrome156.0.8078.74/macOS27.0.1 на root memory fixture HTTPS8492, immutable bundlev2 из родительского composer отчёта. Код/тесты/кейсы/ожидания не менялись, новые suites не запускались.

**Внутренний fake-provider путь прошёл: onboarding → Попробовать → новый synthetic профиль → Мои встречи; отдельный новый вход из приглашения вернул к исходной встрече без autoRSVP и без переписки. Реальный Яндекс ID не проверен.**

Источники прочитаны до прохода: `openspec/changes/gathering-activity-feed/specs/product-onboarding/spec.md`, `specs/invitation-rsvp/spec.md`; кейсы `TC-AUTH-AD08346A` и `TC-INV-BE2ABEB1`, публичность приглашения. Это адресный follow-up задачи gathering5.3, не общий PASS всех auth/RSVP/network/error/accessibility случаев.

## Реальные действия и результаты

1. Из UI synthetic Саши получено приглашение собственной встречи `QA composer independent v2` на30ноября. Полный invitation token оставлен только в памяти CUA; в сохранённых текстах замаскирован.
2. Открыто новое private окно Chrome: действующей сессии нет, главная объясняет приглашения/чат/опросы/задачи/список-календарь. Нажат именно «Попробовать». Открыт штатный fake-provider выбранного memoryfixture, выбран synthetic Лена. Возврат открыл `/meetings`, заголовок «Мои встречи», пустое состояние и «Создать встречу» без отдельной анкеты. Evidence: `01-clean-onboarding.{png,ax.txt}`, `02-new-profile-meetings.{png,ax.txt}`.
3. Первое private окно закрыто, затем открыто новое private окно с чистой cookie-сессией. По собственной ссылке показаны название/детали приглашения и «Войти и ответить»; composer и наши ранее отправленные строки отсутствуют. Evidence: `03-anonymous-invitation.ax.txt`.
4. Нажато «Войти и ответить», в fake-provider выбран synthetic Миша. После callback URL нормализован и сопоставлен с исходным приглашением — совпал. Отображены три кнопки ответа, **каждая Value0**: «Приду», «Возможно», «Не смогу». Composer/приватные строки отсутствуют; ответ не выбирался. Evidence: `04-invitation-return-no-rsvp.ax.txt`, `assertions.json`.
5. Private окно закрыто. В исходном окне Саши выполнен реальный Reload встречи; свежий UI по-прежнему показывает «1участник» и «Придут:1». Вход Миши сам не добавил участника. Evidence: `05-owner-roster-after-reload.ax.txt`.

## Границы и сохранность

- Fake-provider проверяет внутренние browser/session/return-route UI переходы. Настоящие Яндекс consent/token/network/cookie/provider ошибки и внешний OAuth не приняты.
- При приглашении не выполнялись RSVP, сообщения, изменения встречи, уведомления или удаление пользователей. Дополнительно появились только synthetic профили memoryfixture, созданные самим разрешённым входом.
- Private окна закрыты; штатное окно Саши осталось для root. Обычные данные Chrome/аккаунты не очищались. TLS interstitial не возникал и не обходился.
- Invitation route сравнивался до редактирования AX; сохранена маска token и булевы assertions. Первый диагностический `returnedSameInvitation=false` происходил из отсутствующего в Chrome AX протокола URL; сравнение одного нормализованного наблюдаемого пути далоtrue. Результат не подменялся проверкой другого приглашения.
- NativeAX и реальные действия составляют evidence. Screenshot публичного invitation с capability в адресной строке намеренно не сохранялся. Это не visual design gate.
