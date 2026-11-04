# Baseline перед мобильным переносом · 04.11.2026

Снимок [baseline.json](baseline/baseline.json) фиксирует локальный `main` на
`ea4cad9be1077b23b0fa9394e6e51093ae8d4258`. Локальная ссылка `origin/main`
совпадает; сетевой fetch этим снимком не заявляется. Дерево уже содержало чужие
изменения. Их перечень сохранён до первой правки в `baseline/worktree-before.nul`;
хеши 2719 отслеживаемых файлов кода/API/дизайна/каталога — в
[tracked-inputs.json](baseline/tracked-inputs.json). Содержимое прежних задач и
хеши manifests активных изменений — в [active-changes.json](baseline/active-changes.json).
Ни один прежний отчёт или receipt не переписан и не перенесён как новый pass.

OpenAPI: `contracts/openapi.yaml`, версия `0.1.0`, SHA256
`b869a5014cd0ee3a752c41bb9ad0692c4a107f145fba0c6b3993581668b1f55d`.
Web package `0.0.0`, native defaults `0.1.0 / 1` — значения исходников,
не установленные/магазинные версии. RC/CI identity выбирается в 4.3.
Дизайн-система перед публикацией — `5.0.0`; её общую версию пока не меняем.

| Владелец действующих операций | Сохраняем при переносе | Граница нового пакета |
| --- | --- | --- |
| chat-reliability-and-sync | capabilities, sync/realtime, persistent outbox, client request ID, read-marker/readers, retry/recover, media | 9 меняет мобильную композицию, сохраняет API/ACK/unknown и права; общий store/transport не переписывает |
| vibe-album-download | snapshot/exports/download, ZIP web, PhotoKit iOS, MediaStore Android, cancel/partial/permission/cleanup | 11 меняет жесты/виды/форму и подпись действия, использует существующие download-album и native album services |
| account-deletion | приватные поля `/me`, сессии, совместимый DELETE `/me`, скрытая навигация | 6 проводит публичный avatar_url через модели; 12 меняет профиль, не открывает удаление и не удаляет API |
| meeting-experience-refresh / gathering-activity-feed | создание/RSVP, роли, настройки/revision, дата/место/подготовка, загрузки, история | 7–10 переносят представление; большинство/hidden/anonymous/сроки и явное принятие задачи сохраняются |
| support-feedback / release-version-policy | реальная отправка обращения/номер, диагностика opt-in, восемь ключей раздела, реальные client metadata | 12 переносит форму/выбор раздела/reader; примеры версии/номера из макетов не становятся production-данными |
| deployment-and-store-release | production storage/OAuth, deployment/подпись/ключи, версии и receipts | перенос не меняет production и не выпускает клиентов; локальная разработка memory.Store/мок, без БД/Docker |

Публичный `avatar_url` уже есть в контракте; отдельного endpoint ради фото
не добавляем. `place_location` в baseline отсутствует: 5.1 добавляет его
совместимо со строковым `place` для создания, опроса и чтения/применения.
SQL/миграции не входят в мобильный перенос.

Сохранность desktop проверяется на 740/1100/1440 CSS px и в существующей
landscape/coarse-pointer ветке. Mobile 320/390/739 получает отдельные варианты;
старые общие токены не переопределяем ради нового mobile-вида.

Хеши всех references/additionalFiles из approved-designs.json проверены.
Flow-r1 исключён. Следующие изменения входов требуют повторной сверки baseline;
снимок и прежнюю приёмку сохраняем с исходными хешами.
