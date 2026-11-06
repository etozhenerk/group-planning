# iOS vibe7.13 — независимая QA setup

До frozen handoff — только подготовка, без pass. Frozen handoff получен06.11: текущий кандидат описан в ../r1/candidate.json; каждый новый app/hash требует собственного run. Это короткий экранный checkpoint, полный общий план создаётся после всех четырёх пакетов через qa:plan по объединению mapped cases.

Authority: approved vibe-r3 + navigation-r2, preparation/references/vibe/frame.html, design/vibe-ios.json, UX, mobile-mvp.md7.13. HTML рамка не задаёт native insets. Полноэкранная навигация ограничена MediaPhotoNavigation.index; стопка nextInStack циклична в обеих свайп-сторонах.

## Короткий проход

1. Multiple3 /402: header controls/actions/deck/card effective size; обе стороны→next, короткий drag→rollback, быстрый flick, last→first cycle; вертикальный scroll не открывает viewer. Grid→photo→viewer, contain, соседний кадр/rollback, крайние fullscreen не зацикливаются, close возвращает индекс. Cases: TC-VIBE-D2414F1E/C82FDBE2/DAC4D8E1/B5FF73B4, NATIVE-SWIPE-TAP, MOBILE-VIBE-GESTURE/STABILITY.
2. Empty0/single1 /320: свои отдельные past meetings через реальный API. Empty даёт добавить, single не листается за границы/не запускает cycle; header/add/save доступны. Cases: TC-VIBE-75A8C069/3C98DE12/DAC4D8E1.
3. Upload /402: «Добавить фото»→своя форма→system picker; cancel возвращает ту же форму/выбор. Два своих фото→частичный результат через существующий ResponseGate→сохраняются только failed→retry без повторной публикации success. Actual API counts и форма после успеха. Cases: TC-VIBE-F5929004/3E0FC811, MOBILE-VIBE-STABILITY. Старый NativeVibeUploadUITests ожидает picker первым и не является актуальным pass.
4. Доступное короткое save/privacy/retry: реальный PhotoKit save/permission по своей QA app; подготовка/отмена; изолированный actor revocation убирает фото/локальные превью. Ошибка фото→реальный Retry после release gate. Недоступный механизм/предусловие — конкретный blocked, без замены UI mock. Cases: TC-VIBE-EXPORT-GALLERY/ACCESS/03EF9D2B; остальные экспортные cases остаются общему gate.

Обычный текст402×874 и одно окно320×568 на том же physical Simulator402×874. Large/reduced-motion/landscape и полный каталог — по свежему общему плану; короткий spot не закрывает эти cases целиком. VoiceOver не читать и не включать. Везде SOMEWHERE_IOS_SKIP_VOICEOVER=1. Только device31262733-50DC-46A5-938E-4C462D70F109, без create/reset.

## Ожидания helpers

SettledGeometry.swift ждёт семантической readiness у caller, затем неизменные frame/window/anchors≥0.7с/4samples. Capture и JSON всегда ДО assertions. Измерения не подгоняются под expected48. Движение во время жеста отдельно фиксируется видео/interaction log, оно не выдаётся за settled frame. В helper failure — кадр/AX/metrics и немедленный release без серии перезапусков. Real scroll/reveal только до полностью видимого и hittable контрола; покрытые controls не тапать.

CreateMeeting id находится в wrapper.meeting.id; capability invitation_url не сохранять в QA. Fixture tokens/config вне репозитория, chmod600. Сборка QA runner только в temp-copy; после build-for-testing подставить точный frozen mainApp и сверить каждый файл/SHA. Старые tests/root build не дают pass новому UI.

## Команды и handoff

- Candidate ../r1/candidate.json; actual/report только ../r1. Fixture binary /private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test; TestIOSFixture, scope accessibility, config в собственной private temp dir.
- seed-albums.py CONFIG OUTPUT создаёт только0/1 past meetings и один собственный PNG; обычный real API, без backend/product правок. Multiple3 — design meeting deb00000-0000-4000-8000-000000000004.
- Build driver в /private/tmp/invitation-ios-independent-7.4/frontend/ios, schema SomewhereUI, jobs2; exact host swap после build. Затем test-without-building только VibeCheckpoint713Tests. Не вызывать общий all UI/VoiceOver runner.
- Общие design:check/qa gates не повторяются для checkpoint без необходимости; финальный общий кандидат: новые plan/run, обязательные suites и свежие design:ready/qa:ready, включая незавершённый Preparation settled/cancel-back/accepted/completed.

## Cleanup и ограничения

Остановить только собственную fixture/recorder; не трогать root процессы. Фото/тестовые разрешения только QA Simulator/app. Не удалять всю Photos library: записать собственные добавленные assets/файлы и удалять только доказанно свои; при отсутствии точного cleanup proof сохранить limitation. Настройки ориентации/размера/клавиатуры восстановить, если менялись. Не менять runtime, cases, эталоны, tasks или Git.
