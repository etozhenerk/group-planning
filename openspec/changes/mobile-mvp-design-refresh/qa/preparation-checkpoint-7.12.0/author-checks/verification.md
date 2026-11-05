# Проверки исполнителя · подготовка7.12

Web:61файл/266unit-тестов, typecheck/ESLint/styles/FSD/Prettier и demo build
прошли на первом7.12кандидате. Последние две визуальные правки проверены
отдельно: typecheck/целевойESLint, styles/FSD/Prettier и новый demo build;
исходная ошибка пустой строки CSS сохранена вместе с успешным повтором.

iOS: swift-format и simulator build-for-testing прошли на7.12.
Пять PreparationTaskTests прошли перед последним переносом привязок7.12;
после этого изменялись представления и параметры UI-примитивов, модель операций
не менялась. Это не новый полный native regression или clean-release gate.

Android: formatApply, assembleQa/assembleQaAndroidTest и5PreparationTaskTests
прошли на7.12r1. После последней правки Back повторены формат и assembleQa;
переход проверяется отдельным независимым smoke наr2.

Публикация: design:generate, design:check67, design:test34, agent:check пройдены.
До нового check устаревшие literal-записи удалены design:prune.
74snapshot7.10 совпали с HEAD до публикации; оба индекса истории7.10/7.11
содержат74файла и проверенныеSHA. Финальные design:ready/qa:ready, полный
Release/Lint/native regression относятся к общему кандидату; checkbox открыты.

Последняя привязкаglyph20: целевойESLint/Prettier/typecheck и новаяdemo-сборка прошли; независимыйweb7.12r3 подтвердил20×20внутри32×32. iOS7.12r1 остаётсяpartial: текущийhelper измерял доsettle, capture/cancel-back/accepted/completed не приняты. Эти ограничения не перенесены вpass.
