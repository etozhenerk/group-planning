# Вайб iOS 7.13 — targeted R4

Вердикт: **PASS только исправленного transport-error/partial→retry scope**. Итоговые gates и общая приёмка не выполнялись; остальные состояния не наследуют pass.

Проверен immutable artifact `a8df3eed6e53e7178189872c2805fa01ea4b8c1001208714d72059dfaed285af`, source `57cc33a6e932b3a95fad4cad23d1a63ad1027d4a96a65212bbc8a6477b6575a4`, input `1038b841b55c7da932435e6bfda2f636aab7672d83ce038a2f79192d0573c26a`. Все20 файлов frozen app и копии проверены SHA: [candidate](candidate.json), [binding](artifact-binding.json).

Один существующий `testBPartialUploadNoticeAndExactRetry` **PASS30.174s, 0 failures**, [лог](partial-independent.log), [driver](VibeCheckpoint713Tests.swift). Runner переиспользован без пересборки; имена его внутренних файлов/скриншотов сохраняют префиксr3, но каждый приложенный actual получен свежим R4 запуском после подмены frozen mainApp. A/dismiss, deck и viewer не выполнялись.

Выбраны2фото в настоящем native picker. Controlled ResponseGate пропустил первый успешный publish, заменил второй серверный ответ503; в форме остался один preview и enabled CTA «Повторить отправку». Транспортное сообщение под preview отсутствует; отображается единый warning-notice рядом с submit, как в [approved raw partial](../r3/reference-partial.png). [Fresh actual](actual/partial-notice-before-assert.png), [AX](actual/partial-notice-before-assert.ax.txt), [capture-before-assert/settled record](actual/partial-notice-before-assert.geometry.json). Содержательные ошибки валидации отдельного файла здесь не воспроизводились.

После снятия gate реальный retry закрыл форму. API3→5; до retry сервер уже имел5 из-за потери ответа, после retry сохранены ровно те же5IDs, publishcounts[1,2]. [API proof](actual/api-retry-proof.json), [HTTP counts](actual/http-request-counts.json), [результат](actual/retry-result-before-assert.png). Ранее успешный файл не перепубликовывался.

Окружение: собственная disposable memory+TLS fixture и тестовый identity provider; iOS27.0 Simulator402×874, русский язык, обычныйL. VoiceOver не читался/не включался. Без production данных, новых suites/матриц/gates. App завершён тестом, собственная fixture остановлена, lock снят: [cleanup](cleanup.json). **Source/device RELEASED.** Продукт, эталоны, manifests, cases, tasks и Git не менялись.
