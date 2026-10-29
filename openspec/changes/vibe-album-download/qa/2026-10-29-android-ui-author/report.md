# Android · сохранение всего альбома · 29.10.2026

Автор `/root/android_recovery_finish`. Авторская реализация по опубликованному
дизайну4.1.0; независимые design-review и feature-test требуются отдельно.
Общая задача и release gate этим отчётом не закрываются.

## Реализация

На экране альбома рядом с «Добавить фото» стоит «Сохранить все», две равные
колонки. Полное доступное имя — «Сохранить все фото». Геометрия кнопок, иконка,
цвета, типографика и отступы используют опубликованные токены. Новая иконка
переносит SVG-геометрию макета в Compose ImageVector по принятому шаблону проекта;
новых legacy literals нет. Индекс фото, свайпы, просмотр и стандартный «Назад»
остаются существующими.

Controller связывает экран с готовым AlbumDownloadRepository: одна подготовка,
отмена до публикации, disabled «Сохраняем…» после передачи системе, подтверждение
сохранения, ошибки/повтор, permission/settings и partial/«Понятно». Уход, смена
сессии и отзыв доступа отменяют подготовку; epoch не позволяет позднему callback
опубликовать или вернуть старую операцию. Повтор ждёт cleanup предыдущей попытки.
На API29+ permission не запрашивается, на26–28 используется legacy разрешение.

Изменены18 файлов из `owned-files.txt`. Recovery14 из предыдущего receipt
не менялись: `recovery-source-verification.json`. Общие документы, testing cases,
manifest и inventory ведёт root и они не входят в этот узкий source receipt.

## Проверки

| Проверка | Результат |
| --- | --- |
| Полный `scripts/check.sh` | PASS: clean, formatCheck, Debug/Release, Lint, unit, Debug/QA instrumentation builds |
| Unit suite | 188 PASS;0 failures/errors/skipped, включая6 новых controller tests |
| Lint Debug/Release |0 errors/warnings; по22 informational version hints |
| design:check | PASS после prune удалённых старых literals root; не UI acceptance |
| agent:check | PASS |
| Первый реальный QA UI прогон |5/5 PASS; evidence `iteration-1/` |
| Финальный реальный QA UI прогон | 5/5 PASS на финальных APK,18.204s; `verification.json` и `final-ui/` |

Три UI-сценария проходят обычный экран приложения и реальный MediaStore:

- сохранение всех трёх фото; published rows имеют pending0, имена соответствуют
  snapshot IDs, SHA256 каждого файла совпадает с оригиналом API; выбранное2/3
  сохраняется;
- задержанный snapshot: «Отменить», прежняя геометрия/индекс, отмена без записей;
  новая попытка и системный Back также не публикуют фото;
- ошибка подготовки сохраняет альбом; явный «Повторить» сохраняет все оригиналы.

Два отдельных **компонентных**, а не полных экранных, теста проверяют320dp,
fontScale1/1.8, равные соседние кнопки и стабильную высоту Idle/Preparing/Saving,
доступные имена, disabled Saving, настройки/partial/retry и пустой альбом.
Их screenshots не являются evidence полного экрана с системными отступами.
Saving и partial дополнительно проверены unit-тестами controller.

## Evidence и ограничения

`iteration-1/` сохранён до замены XML иконки на token-based Compose и исправления
цвета disabled spinner. Финальные APK, screenshots и logs фиксируются отдельно.
`source-hashes.json` содержит18 owned файлов; `android-build-source-hashes.json`
фиксирует557 Android source/config inputs. APK копии в игнорируемом `artifacts/`,
их точные SHA256 — в `artifact-hashes.json`.

Только emulator-5554 API36, только отдельный QA package
`dev.groupplanning.android.uitesthost`. Fixture — локальный Go HTTPS API с memory
store; synthetic фото. Cleanup удаляет только новые QA owner/path URI относительно
снимка до теста. Обычное somewhere, фотографии пользователя и настройки устройства
не менялись. Не выполнены live API26–28/29, физическое устройство, системный
permission-denial UI на legacy, настоящий disk-full и полный регрессионный прогон
приложения. Эти ограничения нельзя выдавать за независимый PASS.
