# Вайб iOS 7.13 — targeted R3 upload

Вердикт: **needs-fixes (F1, design); функциональный targeted scope успешен**. Это экранный checkpoint, без итоговых gates/матрицы/checkbox и без переноса прежних pass.

Точный immutable artifact `74605f454ee9a6b7a27a2be1646505177ce8671f82dffdd9a363228489d1abe7`, source `1c0cd22bf6953563472fb1ceb48e734443f635e6e4e30bccbc425e72fb4d9190`, design input `583e22139d267dff88dc6c6a0f1aee06df43e3abbbdcf129230a8246760968ef`. [Candidate](candidate.json), [20-file binding](artifact-binding.json), [повторная SHA-проверка после QA-selector fix](selector-rerun-binding.json). QA runner из прежней временной копии; после каждой инкрементальной сборки его mainApp заменялся точным frozen app.

## F1 — повтор транспортной ошибки под фото

В реальном partial-state видны одновременно красное «Не удалось отправить фото.» под оставшимся preview и общее предупреждение с retry возле submit. Approved raw `assets/vibe-r3/ui/UploadCarousel/UploadCarousel.tsx` намеренно не выводит `item.error`, начинающееся с «Не удалось»; transport failure показывается одним notice около submit. В native `frontend/ios/Somewhere/Features/Media/MediaPhotoSelection.swift:56–57` любой failed-stage выводит fallback, включая `transferFailure`. Нужен фильтр/параметр для album-варианта с сохранением содержательных локальных ошибок выбора. Код не менялся.

Доказательства: [actual partial](actual/partial-notice-before-assert.png), [AX](actual/partial-notice-before-assert.ax.txt), [settled record](actual/partial-notice-before-assert.geometry.json), [approved raw partial](reference-partial.png), [raw text/SHA](reference-partial.json). Общий warning-icon, пояснение о сохранённых снимках и CTA «Повторить отправку» присутствуют и доступны. Pixel-exact геометрия sheet не объявляется pass: presentation scale и native safe area отдельно зафиксированы environment.

## Реальный targeted проход

На том же разрешённом iOS27.0 Simulator402×874, русский язык, стандартный L, без VoiceOver:

1. **Пустая форма → native grabber dismiss: PASS17.456s.** Координатный drag начат на видимой ручке над заголовком, не на Text; start201/470.56→201/844. Capture до действия и после действия **до assertion** подтверждает закрытие формы и возврат в альбом. [До](actual/empty-before-grabber.png), [после](actual/empty-after-grabber-before-assert.png), [gesture](actual/native-grabber-action.json), [лог](smoke-independent.log). Неподтверждённый R2 header.swipeDown заменён свежим действием на R3.
2. **Partial upload/error→retry: PASS31.667s**, [лог единственного targeted повтора](partial-selector-rerun.log), [driver](VibeCheckpoint713Tests.swift). Использованы существующие `ResponseGate.failPublishedMediaResponse(afterFirst:true)`, `continuePartialFailure`, native picker и `NativeChatCounterpart`. Выбраны2фото через системный picker; API реально опубликовал оба, только второй ответ заменён transport503. В форме остался один failed preview; предупреждение и enabled retry присутствовали. После release gate retry закрыл форму. [Выбрано2](actual/two-selected.png), [partial](actual/partial-notice-before-assert.png), [после retry](actual/retry-result-before-assert.png).
3. API: **3→5** снимков. При partial потерянном ответе сервер уже имел5; после retry ровно те же5IDs. Для двух media publish request counts **[1,2]**, ранее успешный не перепубликовывался. [API/trace proof](actual/api-retry-proof.json), [HTTP counts](actual/http-request-counts.json). Это честный lost-response partial, не доказательство отсутствия server commit до ошибки.

В первом запуске B остановился на старом QA-label selector `Add/Добавить`, при реально выбранных2фото: iOS кнопка получила label «Готово», identifier остаётся `Add`. Первая ошибка сохранена в [логе](smoke-independent.log), [исходном driver](driver-attempt1.swift), [наблюдаемом AX](picker-observed.ax.txt); product failure из неё не выводился. Исправлен только QA-selector, затем один повтор **толькоB**, без повтора успешного native-dismiss.

Собственная disposable memory+TLS fixture `/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test`; production native/API logic, тестовый identity provider. В simulator Photos добавлены только публичные QA assets `vibe-r3/boardgame.png` и `friends.png`; личные фото/production сервисы не использовались. Fixture-auth не является external OAuth proof.

## Границы и release

Колода/viewer не перепроверялись. Общая регрессия, сохранение/permission/privacy/revocation, пустой/одиночный альбом, narrow/large/reduced-motion и отдельный zero-success upload-error остаются финальному общему кандидату. VoiceOver не читался/не включался. Не запускались новые gates и обязательные полные suites.

App завершён тестом, собственная fixturePID48543 остановлена, simulator lock освобождён trap. **Source/device RELEASED**; root fixtures не затронуты: [cleanup](cleanup.json). Продукт, эталоны, manifests, кейсы, tasks и Git не менялись.
