# Android: профиль и вайбы, 03.11.2026

6.4 проверен основным агентом на emulator-5554 / API 36: experience-a11y 5/5 PASS,
34.163 с. Реальный временный HTTPS API; только синтетические профили/фотографии.
Три UI-входа проверяют полные поля, дату без года и явное очищение, без настоящего
Yandex OAuth. Профиль доступен при font_scale=1.8; TalkBack действительно включён,
private-field label получает accessibility focus, проверен findFocus.

Альбом: свайпы в обе стороны/цикл, индекс после Activity recreation, сетка,
landscape с font_scale=1.8 и animator_duration_scale=0. Настоящий TalkBack-фокус
и системное custom action «Следующее фото» меняют 1→2 без сложного жеста.
Проверены доступность элементов и actual; запись речи TTS и физический двойной tap
не заявляются. Отдельный tap/fullscreen и короткие/вертикальные жесты — существующий
ExperienceUiTests.singlePhotoDragsStayInStackAndTapOpensViewer и Nov2-результаты;
их production media-код не менялся после проверки.
После настоящего DELETE /me во временном API Back из альбома приводит к онбордингу;
фотостопка недоступна. Это отзыв сессии после серверной проверки, не замер
мгновенного push-отзыва. Actual в actual/ просмотрены. После finally подтверждены:
font_scale=1.0, animator_duration_scale=null, accessibility services=null, enabled=0.

6.5: README/runner документируют адресный scope. Новый formatCheck и QA compile PASS.
Production не менялся после финального check.sh 03.11: 197 unit без skips/failures,
чистые Debug/Release, оба Android Lint, оба instrumentation APK — PASS
(/tmp/somewhere-20261103-android-media-check.log). Повтор общего набора не запускался.
Независимый общий gate, release, физическое устройство и Telegram не заявляются.
