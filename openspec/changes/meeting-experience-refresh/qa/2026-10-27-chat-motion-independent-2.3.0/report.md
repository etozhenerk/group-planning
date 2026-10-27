# Независимая проверка composer / chat · DS 2.3.0

Проверяющий `/root/chat_motion_review_23`. Проверка завершена как **needs-fixes**:
подтверждён дефект iOS Escape. Это частичный независимый проход, не готовность всего
изменения и не приёмка релиза. `qa:ready` / `design:ready` не заявляются.

Зафиксированный контекст — `f0956a7e9b8f9a3bedf3747feba292c30e95771b676b2d01a0be386feaa9854a`.
После фиксации дефекта исполнитель начал исправление iOS. Старый inputHash
сохранён; результат не переносится на следующую сборку. Машинный отчёт:
[design-review.json](design-review.json); независимые результаты кейсов:
[functional-results.json](functional-results.json). Проверка структуры отчёта
дала `structure=valid`, `currentAcceptance=false`.

## Подтверждённый дефект

**IOS-DS23-ESCAPE-001, P2 — Escape не закрывает emoji-док.**
Требования: `TC-CHAT-EMOJI-DISMISS-FOCUS`, chat-composition / «Закрытие панели
без перехода к вводу», `docs/design/components/chat-actions.md`.

1. Запустить точный QA host run08 с `SOMEWHERE_UI_SCENARIO=design`.
2. Открыть синтетическую встречу `cea00000-0000-4000-8000-000000000001`.
3. Нажать `composer-emoji-toggle`.
4. Передать настоящий hardware Escape через XCUITest `app.typeKey(.escape, modifierFlags: [])`.
5. Подождать три секунды.

Ожидание: dock закрыт, фокус возвращён opener, IME не открылась.
Факт: `emoji-search` и кнопка клавиатуры остаются видимыми; IME не открылась.
Первый независимый проход обнаружил сохранённую панель примерно через 0,75 с;
новый явный запуск воспроизвёл её после трёх секунд. Исходники приложения
проверяющий не менял.

- [Snapshot дефекта](ios-finding-snapshot.json), [основной журнал](ios-run01.log),
  [повтор с ожиданием](ios-escape-run03.log).
- [Кадр через три секунды](evidence/ios-escape03-attachments/DE11FD10-903B-40B2-A5E4-2C3BA4912B33.png).
- [Независимый probe](IndependentEscapeReview-run03.swift).
- Промежуточный `ios-escape-run02.log` — ошибка harness: `app.activate()` не
  восстановил чат. Escape в той попытке не выполнялся; это не повтор дефекта.

## Артефакты и окружения

| Платформа | Проверенный кандидат и среда |
| --- | --- |
| Web | `.cache/qa/chat-correction-2.3.0/web-r11-demo`, index SHA256 `1460bde6b2460ef03559241733b61145a16ecd7aa1f01c038ac700f8983a8ea2`. Самостоятельный HTTP-read подтвердил совпадение с origin 8445; [identity](web-identity.json). Codex IAB, фактически измеренные viewport 320×760, 390×844, 390×430, desktop 768×900 и 1440×900. |
| iOS | Неизменный `SomewhereUITestHost.app` run08, aggregate SHA256 `d7ef9cf3b81f83655157b78907e76e5fc83ea2102d4b24a49d194c1f49e8d2fb`. iPhone 18 Pro, iOS 27.0 / 24A434, 402×874, ru_RU, Europe/Moscow, SFUI, content-size L, Reduce Motion=false. Внешний runner компилировал только тестовый bundle; [compile receipt](ios-compile-run03.log). |
| Android | Установленный `dev.groupplanning.android.uitesthost` совпал побайтно с APK `8ef5e682a135681386264b99a057d5f0d605975d820c7d8979ff8917df03e269`. Source freeze `a38999b4448efdd9772f10df0d7e3a5044d8b54fb3a72ea37027e9ea62ae67da`; [identity](android-identity.json). emulator-5554, Android 16, sdk_gphone64_arm64, 720×1600 px / density320. |

Raw-эталон — опубликованный `2026-10-27-telegram-chat/chat.html`, DS 2.3.0.
[Raw меню 390](evidence/reference390-menu.png) снято отдельно от клиента.
Исторические engineering pass не копировались.

Web использовал отдельную созданную через UI встречу `QA DS23 independent`
с ID `3ab89cb3-9cb1-4685-92bb-b2fe250ebb5a`. Пользовательская встреча не менялась.
Native использовали переданные синтетические memory fixtures 61441 / 52531.
Токены и конфигурация аутентификации в evidence не выводились. Запросы к
production и внешние уведомления не выполнялись.

## Выполненные взаимодействия

**Web.** С черновиком «До XX после» выделено «XX», открыт dock, Escape вернул
фокус к emoji opener. Повторное открытие, русский поиск «пицца» и выбор 🍕
заменили именно выделение: «До 🍕 после». Возврат кнопкой клавиатуры дал
`TEXTAREA` focus и selection `[5,5]`. Browser Back отдельно закрыл dock с
фокусом на opener. Переключения plus → emoji → plus сохраняли одну поверхность
и черновик. Mobile date sheet и desktop place/task dialogs открыты и закрыты;
route-страницы не появились. 320 / low-height сохраняли доступные composer
и Send. Измеренные поля mobile390 используют 16 px. Пустой поиск предлагает
очистить запрос. [Журнал UI и DOM-наблюдений](evidence/web-interactions.json).

**Реальное движение web.** CUA выполнял пользовательские клики; read-only
`evaluate` только считывал computed style. Анимации не останавливали,
currentTime не меняли. Menu enter дал промежуточные opacity 0→0,1685→0,4496→0,5600
и translateY 8→6,65→4,40→3,52; scale не наблюдался. Exit удерживал DOM,
с первого sample `inert=true`, `aria-hidden=true`, затем удалял поверхность.
Emoji enter дал height 0→42→89→…→284 и opacity 0→1; exit завершился высотой0,
потом DOM исчез. Времена выборки согласуются с заявленными180/150 мс в пределах
интервала инструмента, без утверждения о физическом FPS. Быстрые повторные
открытия сохранялись. [Menu enter](evidence/web-menu-real-samples.json),
[menu exit](evidence/web-menu-exit-samples.json),
[emoji enter/exit](evidence/web-emoji-real-samples.json).

**Android.** Разрешённый ADB открыл точный QA APK. Через настоящий UI выполнены
normal/reduced emoji и menu open/Back, повторные открытия, переход к форме даты.
Черновик сохранялся. После системного Back дерево показывает
`focused=true` именно на «Выбрать эмодзи»; клавиатуры на кадре нет.
Вход в composer показывал настоящую видимую IME. Введённый через быстрые ADB
key events черновик фактически стал `BeoreXXafter`; проверка сохранения велась
по фактическому тексту, точная замена выделения в этой сессии не заявляется.
[После Back](evidence/android-after-back.png),
[AX после Back](evidence/android-after-back.xml),
[видимая IME](evidence/android-draft-ime-02.png).

Normal видео содержит промежуточные размеры/opacity, reduced при
`animator_duration_scale=0` — переключения без наблюдаемого развёрнутого
перехода. Записи: [normal](evidence/android-normal-motion02.mp4),
[reduced](evidence/android-reduced-motion.mp4). Действия сохранены в JSON рядом.
[Контактные кадры normal](evidence/android-normal-motion-contact.png),
[reduced](evidence/android-reduced-motion-contact.png),
[menu intermediate](evidence/android-menu-normal-strip.png),
[emoji intermediate](evidence/android-emoji-normal-strip.png).
Задержка30мс между remote-командами rapid reopen не доказывает фактический
интервал input dispatch внутри150мс; строгий rapid-критерий остаётся неполным.
Настройки восстановлены: animator raw `null`, window/transition1.0, font1.0.

**iOS.** CUA видел Device Hub и снимки, но coordinate input трижды отклонён
`-10005:noWindowsAvailable`, включая новую привязку и AX Raise. Это
[инструментальное ограничение](evidence/ios-control-blocker.json).
После явного разрешения пользователя независимый XCUITest прошёл composer,
русский emoji search, вставку, возврат text focus, меню, date sheet и сохранение
черновика. Normal видео просмотрено покадрово: [emoji](evidence/ios-emoji-normal-strip.png),
[menu](evidence/ios-menu-normal-strip.png). Приложение не пересобиралось.
Полный тест остановился на описанном выше Escape.

## Непройденные границы

- Два полных кейса `TC-CHAT-F00844F6` и `TC-CHAT-EMOJI-DISMISS-FOCUS` не получили
  общий pass. Для iOS второго кейса — failed; остальные пары — blocked/partial.
- iOS `keyboard.exists` дал true, однако AX frame `{{0,918},{402,226}}`
  лежит вне 402×874, и screenshot не показывает клавиатуру. Видимая software
  IME и её safe-area не приняты. Требуется включить её штатным механизмом.
- IAB desktop viewport не является настоящим mobile IME. На844×390 обнаружена
  desktop-поверхность при desktop pointer/profile; это не mobile-landscape pass.
- Reduced web не переключался через доступный инструмент. Reduced iOS,
  Dynamic Type, VoiceOver/TalkBack, access revoked/error/retry, все scroll anchors
  выше конца и полная selection/grapheme матрица не пройдены.
- Набор был focused partial: formal `qa:plan`/полный suite-run для всей матрицы
  в этой сессии не создан. Engineering logs исполнителей изучены отдельно и
  не преобразованы в независимые pass. `functional-results.json` прямо
  обозначен как отчёт наблюдений, не поддельный `run.json`.
- Полные xcresult и дополнительная simctl-видеозапись находятся в `/private/tmp`;
  долговременные screenshots, действия и встроенные XCTest videos экспортированы
  в evidence. Временные файлы не объявляются постоянным архивом.

## Проверки целостности

`design:check` прошёл в preflight. `design:context` сохранён до и после общего
source freeze; hash совпал. `design:inspect-report` подтвердил структуру, но
не приёмку. Все файлы этого прохода сохраняются отдельно от прошлых отчётов.
Дальнейшее исправление исполнителя требует новой сборки, нового контекста и
нового независимого прохода, без изменения этого отчёта и исходных hashes.
