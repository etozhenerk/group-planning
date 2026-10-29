# Независимое ревью восстановления истории · 29.10.2026

**Вердикт: PASS для ограниченного восстановления шести исторических выпусков.**
Блокирующих расхождений не найдено. Проверены исходные файлы, Git-объекты,
свидетельства установки, снимок production, план публикации и все шесть описаний.
Этот verdict относится к восстановлению учёта; он не означает новой приёмки,
успешного release CI или разрешения повторной выкатки.

Reviewer: отдельный субагент `release_history_review`, не автор ledger.
Машиночитаемые результаты, полные OID, hashes и hashes проверенных входов —
[review-summary.json](review-summary.json).

## Проверенный состав

| Тег | Commit | Фактическое свидетельство установки |
| --- | --- | --- |
| backend/v0.1.0-rc.4 | `5f8b2e37fee78b80cc9ec577aa096b2b10b2067b` | `remote-audit.json`: `result.json.status=deployed_with_owner_exception`, версия backend rc4, schema 8 |
| backend/v0.1.0-rc.5 | `3ebbb60c7581e3eb9a9b2a72e30314f8b5653812` | `rc7-summary.md` связывает установку с точным архивом; production-result фиксирует executable; новый снимок подтверждает current rc5 |
| web/v0.1.0-rc.3 | `5f8b2e37fee78b80cc9ec577aa096b2b10b2067b` | `remote-audit.json`: статус установки и web rc3; следующий отчёт подтверждает замену rc3 |
| web/v0.1.0-rc.7 | `52649f034a78cee101e5a1e28412aefdfdc00b47` | `candidates-52649f03/production-result.json`: статус установки и точный build-info; rc7-summary содержит archive hash |
| web/v0.1.0-rc.8 | `3b39b1c8008a918797239cf3be2b344b186bafa5` | `candidates-3b39b1c8/production-result.json`: установка rc8 с предыдущего rc7 |
| web/v0.1.0-rc.11 | `823d93d36f1b4a223a4b43d28d46654fcfa96f28` | `2026-10-29-web-rc11-release/activation-result.json`: установка rc11 с предыдущего rc8 |

Пути выше разрешаются через ссылки `actualDeployEvidence.paths` в ledger;
исходные документы прочитаны отдельно. Owner-exception рассмотрены как
записи разрешения, отдельно от квитанций фактической установки. Их время
не принято за время деплоя. Hash executable backend не приравнивался к hash tar.gz.

## Независимые проверки

- Заново прочитаны bytes архивов, manifest и SHA256SUMS. В каждом из восьми
  каталогов ровно три обычных файла, без symlink; SHA256SUMS покрывает ровно
  архив и manifest, без повторяющихся строк. Размеры и hashes совпали с manifest
  и ledger. Три копии backend rc5 побайтово идентичны.
- Повторён `scripts/release/common.py:verify` для всех восьми каталогов.
  PASS, включая build-info внутри четырёх web-архивов. Распаковки на диск,
  сборки и исполнения артефактов не было.
- Шесть refs указывают на исходные аннотированные tag objects. Полные OID,
  peeled commits и JSON-карточки совпадают с ledger/publication plan;
  карточки целиком равны `manifest.release_plan`. Все commits — предки
  `origin/main=e7947f173c2c7b6418661a9e820ae41db8cf6acd`.
- Собственный read-only `git ls-remote --heads --tags origin` подтвердил тот же
  remote main, отсутствие всех шести recovery refs и совпадение существующих
  refs со снимком автора. После sandbox DNS failure read-only повтор с сетевым
  доступом завершился успешно; refs не записывались и не обновлялись.
- Пересчитаны все 62 hashes `sourceMetadataHashes`: совпали. Hash исходного
  production-observation также совпал. Снимок root от 08:02:05 UTC содержит
  все шесть выпусков с теми же commit/build/manifest hash и записанными archive
  hashes; current — web rc11/backend rc5, API и Caddy active/running.
  Reviewer не обращался к ВМ. Снимок не является новым hashing архивных bytes
  на сервере и не подтверждает текущее состояние БД.

Web rc4 остаётся **unknown**. Rc5/rc6 отклонены; rc6 имеет
`rejected_react185`. Rc9/rc10 в исходных отчётах rejected; утверждение
never activated в ledger явно атрибутировано root, а подтверждённая следующая
активация идёт с rc8 прямо на rc11. Ни один из них не попал в recovery.
Другие legacy/mobile/monitoring записи также не расширяют эти шесть выпусков.

## Публикация и ограничения

`recovery-publication-plan.json` перечисляет ровно эти шесть исходных объектов
и соответствующие три файла. Все шесть `release-notes/*.md` проверены:
commit, tag OID, размеры и hashes совпадают; ручная история, незавершённая
приёмка, отсутствие нового CI pass, rebuild и redeploy указаны явно.
Неизменённая историческая карточка может говорить «кандидат не выкатывается»:
это состояние при сборке, а более поздняя установка подтверждена отдельной
квитанцией. Исправлять карточку, manifest или тег задним числом не требуется.

[GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push)
подтверждает отсутствие tag push events при одновременной передаче более трёх
тегов; аналогичное правило указано для create. В просмотренных tracked workflows
нет обработчика release. Один атомарный импорт всех шести отсутствующих refs
соответствует этому ограниченному плану восстановления. Не делить его на
частичные push без повторной оценки триггеров; будущие версии выпускать
по одному тегу штатным Component releases.

Операционные условия завершения уже подготовленной публикации:

1. Перед созданием проверить отсутствие готовых и draft Releases; существующую
   запись или asset не заменять. Отсутствие refs само по себе этого не доказывает.
2. Сохранить title равным тегу, `prerelease=true`, без пометки latest;
   загрузить только исходные три файла. Owner-exception/receipt не входят в assets.
3. Опубликовать отчёт/ledger, чтобы ссылка на аудит из описания разрешалась.
   Сейчас материалы ещё не закоммичены. Сохранить hashes рассмотренных входов.
4. После записи проверить удалённые tag OID, Release identity/notes и полный
   состав/размеры/hashes загруженных assets. Предварительный PASS не является
   свидетельством того, что публикация уже состоялась.

Новая проверка CI, функциональная или дизайн-приёмка, production rollback,
проверка секретов, SSH/env/ключей, миграции и новый деплой не выполнялись.
Авторские ledger/report, исходные комплекты и приложение не изменены.

Проверки документов: `npm run agent:check` — PASS; `git diff --check` — PASS;
машиночитаемая сводка разбирается как JSON. Новые файлы review также просмотрены
на лишние пробелы и корректность ссылок; чужие изменения сохранены.
