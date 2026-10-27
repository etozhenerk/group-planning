# Motion checkpoint · Android r2 · 27.10.2026

Независимый reviewer `/root/chat_correction_review`. Кандидат QA `441b4f139ca01973c318000e9e60e3f44515857260315ef18303723dc912ff45`; sourceTree `2d3a9e84daa2da78bb5cce0ba220f1d0a21594aa1bda9478631421048082a6f0`; design inputHash `24fcfab1dc726c74fe7145090d8ea40ff16ca4095513d51bf93ba42cc4035b52`. Только emulator-5554, Android16/API36,720×1600px,density320,fontScale1.0. Синтетическая visual-встреча cea…0001, QA API52531. Web/iOS live blocked: одно обращение CUA вернуло Mac locked, apps/browsers пустые.

## Вывод для вопроса об анимациях

**Пока нельзя считать анимации полностью исправленными.** На Android наблюдается enter quick picker и fade/scale exit full picker; переходы не сводятся к статическим screenshots. Однако при Reduce Motion quick picker на первом видимом кадре находится у верха разговора, затем за один следующий кадр перескакивает к сообщению. Это needs-fixes.

### AND-21-R2-M01 — flash неверного anchor при Reduce Motion

Действия: исходный чат, window/transition/animator scales =0, удержание bubble Тимофея650ms. В `android/motion-reduced-1.mp4` кадр4.359056s показывает quick bar примерно на y286px у верхнего края разговора; кадр4.392122s уже показывает его примерно y606px над выбранным bubble. Перемещение около320px за33ms, до этого bar отсутствовал. Это не плавный переход и не требуемое мгновенное появление в конечной позиции. Контракт chat-actions.md: quick/full привязаны к bubble; Reduce Motion убирает translation/scale. Evidence: `android/reduced-quick-dense/frame-00020.png`, `frame-00021.png`, `frames.json`, `contact.png`. Причина по коду не установлена, код не менялся.

### Что фактически видно

- Normal quick enter: промежуточные полупрозрачные/уменьшенные кадры5.026→5.194s normal-1; появляется выбранный outline bubble. Не измерялось точное соответствие easing/180ms, хаптика недоступна в видео.
- Normal full exit по Back: на36.093→36.159s panel ещё виден полупрозрачным, к36.193s исчез; промежуточные кадры подтверждают выход до удаления. Dense series `normal1-exit-dense`. На просмотренном отрезке нет зависания.
- Reduced full switch (31.359s) и exit (37.359s) без видимого fade/scale, в отличие от normal exit. Dense `reduced-full-dense`, `reduced-exit-dense`.
- Emoji dock normal открывается сразу в занятой нижней области; composer и timeline меняют высоту на первом видимом кадре3.394s normal-2. Плавного slide/fade dock в записи не видно. Reaction180/150ms контракт прямо ограничивает контекстные реакции, поэтому это наблюдение, не самостоятельное нарушение токена. Send остаётся доступен, draft сохраняется.
- Native sheet людей: normal подъём снизу25.028→25.194s и уход вниз47.495→47.561s normal-2 видны покадрово. Переключение фильтра Все расширяет sheet по содержимому; на settled screenshots наложений нет.
- Plus menu normal открытие попало в конец normal-1. Закрытие выполнено и подтверждено screenshot, но близко к границе60s; temporal exit не считаю покрытым.

## Не покрыто motion-приёмкой

Pressed feedback конкретной emoji и её выбор; отдельный quick exit; полная оценка normal full enter; reduced plus/sheet; reduced dock exit (закрытие после границы записи); хаптика; low-height/landscape/large-text; iOS/web. Whole motion pass не выдан.

## Метод и восстановление

3 записи ADB screenrecord по60s сняты после сигнала parent heavy builds finished. Реальные UI actions и screenshots/AX — независимый reviewer. После записи scales восстановлены:window1.0,transition1.0,animator=null. MP4 декодирован AVFoundation; sandbox decode дал -11821, тот же пассивный декодер вне sandbox успешно получил кадры. В frames.json сохранены requested и actual timestamps; повторные actual frames дедуплицированы в contact sheets. Contact sheets — производные для просмотра, оригинальные PNG/MP4 сохранены. Это не pixel-regression pass.
