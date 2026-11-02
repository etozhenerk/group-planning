# 6.1 — навигация Android

Два адресных сценария текущей QA-сборки на emulator-5554 PASS: CalendarUiTests.calendarAndListPreservePeriodDayAndBack и EntryUiTests.lostCreateResponseRetriesSameMeeting. Календарь сохраняет день/период/месяц при Back, переключении списка и Activity.recreate; «Сегодня» и последняя строка доступны. В чате нет home-navigation и лишнего нижнего резерва; после Back панель снова видна. Создание с потерянным ответом/пересозданием/повтором открывает один чат, без табов в форме и чате; Back возвращает единственную встречу и панель.

Остальные утверждённые корневые разделы/карточки/large text уже выполнены независимым штатным94-тестовым проходом: ../2026-11-02-android-rsvp-independent/current-result.md, raw actuals/XML сохранены там. Навигационные Home/Calendar/Card/Create компоненты после того прохода не менялись; свежие проверки добавлены для отсутствия табов/резерва после нового invitation clock исправления. Обязательные проверки точного runtime: ../2026-11-02-sequential-cutoff/android-final-check.log — format,196unit, Debug/Release,Lint PASS. Два UI метода не выдаются за новый полный94-run.

Последовательный основной агент сверил actual с контрактами navigation/meeting-card и принятым native календарём. Общая независимая дизайн-приёмка0.3 и физический телефон остаются отдельными открытыми условиями.
