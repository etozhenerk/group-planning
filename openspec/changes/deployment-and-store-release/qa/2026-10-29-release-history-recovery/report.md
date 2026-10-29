# Восстановление истории релизов · 29.10.2026

Найдены **6 подтверждённых ручных выпусков web/backend без тега в origin**.
Их исходные комплекты сохранны: локальный tag object, commit и JSON-карточка
совпадают с manifest; фактические SHA-256 архива, manifest и SHA256SUMS
сверены. В каждом каталоге ровно три обычных файла, без symlink и лишних файлов.
Это аудит истории, а не новая приёмка или разрешение публикации.

Машиночитаемые результаты — [ledger.json](ledger.json), read-only снимок
`git ls-remote --tags origin` — [origin-tags.json](origin-tags.json).

## Комплекты для восстановления

Пути ниже относительно корня репозитория. Все перечисленные выпуски имеют
отдельное сохранённое исключение владельца при незавершённой полной приёмке.

| Тег | Commit | Каталог исходного комплекта | Доказательство активации |
| --- | --- | --- | --- |
| backend/v0.1.0-rc.4 | 5f8b2e37fee78b80cc9ec577aa096b2b10b2067b | infra/local/releases/candidates-5f8b2e37/backend | remote-audit.json: deployed_with_owner_exception, schema 8 |
| backend/v0.1.0-rc.5 | 3ebbb60c7581e3eb9a9b2a72e30314f8b5653812 | infra/local/releases/candidates-3ebbb60c/backend | rc7-summary.md и production-result.json пары web rc7/backend rc5 |
| web/v0.1.0-rc.3 | 5f8b2e37fee78b80cc9ec577aa096b2b10b2067b | infra/local/releases/candidates-5f8b2e37/web | remote-audit.json: deployed_with_owner_exception |
| web/v0.1.0-rc.7 | 52649f034a78cee101e5a1e28412aefdfdc00b47 | infra/local/releases/candidates-52649f03/web | production-result.json: deployed_with_new_owner_exception |
| web/v0.1.0-rc.8 | 3b39b1c8008a918797239cf3be2b344b186bafa5 | infra/local/releases/candidates-3b39b1c8/web | production-result.json: предыдущий web rc7 |
| web/v0.1.0-rc.11 | 823d93d36f1b4a223a4b43d28d46654fcfa96f28 | infra/local/releases/candidates-823d93d3/web | activation-result.json: предыдущий web rc8, backend/services unchanged |

Точные пути к каждому доказательству, исходные OID тегов, все полные hashes и
размеры файлов перечислены в ledger. Для recovery отбирать только записи с
`confirmedUnpublishedDeploymentForRecovery=true`; не пересобирать и не
пересоздавать теги. GitHub Releases в этом аудите не запрашивались и не менялись.
Требуется отдельная проверка отсутствия уже существующего Release перед recovery.

Последняя записанная цепочка production: web rc3/backend rc4 и миграция 1→8;
затем web rc7/backend rc5; затем только web rc8; затем только web rc11.
Это история сохранённых квитанций. Свежего чтения ВМ этот аудит не выполнял.

Точные hashes последних записанных production-архивов:

- Web rc11: `ed0edec79515470ea76550b22b26ff8510e4925d603f94fc2f1b82939f374767`.
- Backend rc5: `f79040c3f83c5b8bb9c1da608e9eef1bcc9d7ade2f8b233604109044659ae7d5`.

Три локальные копии backend rc5 — candidates-3ebbb60c, candidates-bd4ed97c
и candidates-52649f03 — имеют одинаковые bytes всех трёх файлов. Hash
работавшего executable `bf74555c…` из production-result относится к бинарнику,
а не к tar.gz; в ledger эти величины не отождествлены.

## Остальная история

Инвентаризированы **19 уникальных тегов**, **17 уникальных комплектов** в
**19 каталогах**. Все найденные исходные архивы совпали с manifest по SHA-256
и размеру; все SHA256SUMS совпали с текущими bytes. В источниках подтверждены
10 исторических активаций: 9 web/backend и monitoring rc3. Наличие старого
отчёта о CI не переносится в новый CI pass.

В origin присутствуют web rc1/rc2, backend rc1/rc2/rc3, monitoring rc1/rc2/rc3.
Все эти refs совпадают с локальными OID. Web/backend rc2 — lightweight tags;
старые аннотированные теги без JSON-карточки сохранены как legacy, а не
ошибочно названы несовпадающими новыми карточками. Для web/backend rc1
локальные release bundles не найдены; архивные hashes и активация — unknown.

| Кандидат / попытка | Зафиксированный результат |
| --- | --- |
| Web rc4 | Есть оригинальный комплект и совпадающий тег. Квитанция активации не найдена: **unknown**, не основание recovery. |
| Web rc5 | Отклонён из-за React185 в отчёте rc7; доказательства активации нет. |
| Web rc6 | receipt.json содержит rejected_react185; это квитанция кандидата, не установки. |
| Web rc9/rc10 | Root явно указал never activated; repo-отчёты подтверждают rejected, а следующая квитанция ведёт с rc8 сразу на rc11. Существующие owner-exception не доказывают активацию. |
| Monitoring rc1 | Облачная сборка остановилась на timeout proxy.golang.org; работающая версия не подтверждена. |
| Monitoring rc2 | Облачный builder отказал из-за отсутствия package main для plugin; рабочий деплой не подтверждён. |
| Первый probe apply monitoring rc3 | Provider TLS handshake timeout до создания ресурсов; последующий отчёт отдельно подтверждает ACTIVE-версию и таймер. |

Успешное создание monitoring rc3 не подтверждает доставку Telegram. Статус
этого канала остаётся в исходных отчётах и не переоценивается аудитом истории.
Квитанции установки iOS и QA-кандидатов Android/web выделены в
`nonReleaseReceipts`: они не являются комплектами тегированных GitHub Releases.

## Откаты и ограничения доказательств

Сохранённый rollback target последнего web-выпуска — rc8. Отчёты rc7 и rc8
прямо говорят, что откат не потребовался. Подготовленный для схемы 8 совместимый
runtime имеет записанный hash `c1e028d590629e2245cccafb3f3c004a17a4795767168b5f689a68526d084eff`;
его подготовка не доказывает выполнение production rollback. Квитанции
фактического production-отката в просмотренных источниках не найдены: unknown.
Успешные unit-тесты установщика с откатом не выдаются за production-событие.

Точная дата owner-exception — дата записанного разрешения, а не дата активации.
Для rc7/rc8/rc9/rc10/rc11 повторяется прежнее разрешение владельца; оно не
превращает проверки или отвергнутые кандидаты в успешные релизы.

`qa:release-ready` для rc11 не выдал receipt, полная ручная/визуальная приёмка
осталась незавершённой; это прямо сохранено в исходном release report. Новая
воспроизводимость сборок, успешный старый GitHub CI и полнота приёмки здесь не
заявляются. Нужен независимый review этого ledger перед использованием root.

Читались только разрешённые метаданные, квитанции/отчёты, Git tag objects и
после дополнительного разрешения — bytes исходных tar.gz/zip для hashing.
Содержимое архивов не извлекалось. application.env, credential stores,
приватные ключи и секреты не читались. Исходные manifests/receipts не менялись;
на ВМ ничего не записывалось, tags/Releases не публиковались.

## Дополнительное наблюдение root

После фиксации исторической части root передал отдельный read-only снимок
ВМ от **29.10.2026 08:02:05 UTC**. Его bytes без изменений сохранены в
[production-observation.json](production-observation.json); hash и сопоставление
добавлены отдельным `productionObservation` в ledger. Исторические квитанции
не переписаны.

Снимок подтверждает current web rc11 и backend rc5, active/running для API и
Caddy, а также девять сохранённых release directories. У всех девяти commit,
hash manifest и записанный в manifest hash архива совпали с локальным ledger;
среди них присутствуют все шесть комплектов recovery. Снимок не хеширует
архивные bytes на ВМ и не запрашивает БД; схема 8 остаётся фактом прежней
квитанции и последующих сообщений об отсутствии миграций. Root также сообщил
успешный strict `scripts.release.common.verify` для всех шести комплектов;
этот результат записан отдельно как проверка root.

## План root после независимого review

Пока это **план; удалённых изменений в рамках аудита нет**. Root планирует
одним атомарным push передать ровно шесть исходных tag objects, затем через
GitHub UI создать шесть записей Releases с исходными тройками файлов и явной
пометкой восстановления ручной истории. Повторная сборка не предусмотрена.

Основание для отдельного исторического импорта: GitHub документирует, что при
одновременной передаче более трёх тегов события push для тегов не создаются;
аналогичное ограничение действует для create. См. [GitHub Docs: push](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push)
и [create](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#create).
Это не новый штатный процесс выпуска. Каждый будущий тег публикуется отдельно
через существующий release workflow. Отдельный recovery workflow здесь не
создан. Перед импортом root проверяет неизменность шести refs, отсутствие
готовых Releases и возможные обработчики события release; независимый reviewer
проверяет ledger и соответствие этого ограниченного плана исходным bytes.
