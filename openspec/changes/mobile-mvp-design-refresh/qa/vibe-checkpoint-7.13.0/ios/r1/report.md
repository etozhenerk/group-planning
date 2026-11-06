# Вайб iOS 7.13 — независимый короткий checkpoint R1

Вердикт: **needs-fixes (design F1); функциональный проход успешен в ограниченном scope**. Это промежуточная проверка экрана, не итоговая приёмка, не gates и не основание закрыть checkbox. Прежние pass не переносились.

Проверена точная frozen-сборка из [candidate.json](candidate.json): artifact `a14feaa49034c857e4acfcdf72eab2d15218f037ad04836175977985f586569d`, source `9159e707c77708c972bdf793d0f6d00cf803fe3a15fadaa29188bc8fbea015f7`, design input `39744a07e97ff0ea27c1af1b3f630f6a02d3fb19241e105d5f4363bedd7c872c`. Все 20 файлов immutable app проверены по SHA и повторно проверены после подстановки в отдельный QA runner: [binding](artifact-binding.json). Runner собран в временной копии; app заменён точным frozen bundle после build-for-testing.

## F1 — колода не заполняет оставшуюся высоту

На реальном iOS 27.0 Simulator, окно и physical screen 402×874, safe area top62/bottom34, русский язык, стандартный L: settled `photo-stack` = `(12,260,378,410.67)`. При approved normalized raw на том же viewport `photo-deck` = `(12,265,378,577)`, `flex:1 1 0%`, bottom842. Разница высоты 166.33pt оставляет большой пустой низ; даже поправка на native bottom34 не объясняет её. Исходная причина видна в `frontend/ios/Somewhere/Features/Media/MemoriesScreen.swift:88`: только `.frame(height: deckHeight(height))`, функция128 задаёт clamp, но нет заполнения остатка. Raw clamp — исходная база, flex растит её.

Доказательства: [actual](actual/ready-effective-deck.png), [settled geometry](actual/ready-effective-deck.geometry.json), [native environment](actual/ready-effective-deck.environment.json), [actual metrics](actual/effective-layout.json), [reference](reference-402.png), [reference metrics](reference-402-metrics.json). Изменённые тексты встречи — fixture data, не дефект.

## Выполненные реальные действия

Один независимый `VibeCheckpoint713Tests.testShortFrozenVibeCheckpoint`: **PASS 52.377s, 0 failures**, [полный лог](smoke-independent.log), [исполненный driver](VibeCheckpoint713Tests.swift). Данные из собственной memory+TLS fixture: production API/native runtime и private media, тестовый SDK identity provider; это не внешний OAuth.

- Реальный вход из прошлых встреч в альбом с 3 фото; короткий drag15 откатывается без смены индекса. Длинный drag влево 1→2, вправо 2→3, быстрый drag последнего 3→1 с циклом. [Rollback](actual/short-rollback.png), [обе стороны/flick/cycle](actual/both-directions-flick-cycle.png).
- Переключение на сетку, открытие третьего фото. Fullscreen contain сохраняет пропорции; на последнем движение вперёд остаётся3, обратное даёт2, короткое откатывается на2. Закрытие возвращает выбранный2. Полноэкранные границы не заменены циклом. [Последнее](actual/viewer-last-contain.png), [середина](actual/viewer-middle-rollback.png).
- «Добавить фото» сначала открывает собственную форму; «Выбрать фото» открывает системный picker; cancel возвращает ту же собственную форму, без отправки. [Own form](actual/own-upload-first.png), [после cancel](actual/picker-cancel-own-form-retained.png).

Geometry helper проверял неизменность frame/window ≥0.7s и делал capture до assertion. Метрики заголовка sheet не используются для pixel-pass: presentation-scale может стабильно сохраняться во время sheet, обязательный окончательный settled-layout остаётся финальной приёмке. Deck/viewer кадры доступны с AX и environment рядом. Сам факт переходов не доказывает качество всех промежуточных кадров движения.

## Ограничения и освобождение

По явному сокращению checkpoint не проверены: пустой/одиночный альбом, partial upload/retry, photo/load ошибки, export/save/permission/revocation/privacy, vertical drag/trackpad/keyboard, reduced motion, узкий320/large/landscape. Они остаются финальному общему кандидату с существующими helpers и не помечены pass. VoiceOver не читался и не включался. Новые matrices, suites и gates не запускались.

Симулятор `31262733-50DC-46A5-938E-4C462D70F109` освобождён, QA app завершён, собственная fixture остановлена, root fixtures не затронуты: [cleanup](cleanup.json). Приложение, макеты, manifests, кейсы, tasks и Git не менялись.
