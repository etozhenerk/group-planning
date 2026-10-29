# Web rc15: клавиатура вне поля сообщения

29.10.2026 установлен web/v0.1.0-rc.15, source dd9ab2863439e872e716bc1ba811578e5c8cbf07, build 13. Продуктовые деревья закреплены по 17fb80e8.

[Component releases 40906556659](https://github.com/etozhenerk/group-planning/actions/runs/40906556659) завершился SUCCESS. Установлены три исходных файла [GitHub Release 428101263](https://github.com/etozhenerk/group-planning/releases/tag/web/v0.1.0-rc.15); размеры и SHA256 совпали с GitHub digest. Тег не переносился, артефакты не пересобирались.

Владелец принял дизайн и прямо разрешил выпуск, затем подтвердил «ОКАЮ», «РАЗРЕШАЮ», «ПОЖАЛУЙСТА ЗАЛЕЙ УЖЕ». Решение и точный допуск сохранены в owner-decision.json и owner-exception.json. Полная независимая приёмка остаётся incomplete. Все обязательные автопроверки прошли; workflow и автоматический деплой не менялись.

## Проверка после установки

- Публичный build-info: rc15, точный commit, build 13.
- Главная, healthz, readyz и build-info — HTTP 200.
- Все 242 JS/CSS файла побайтно совпали с опубликованным архивом.
- somewhere.service: active/running, ExecMainStatus=0, NRestarts=0.
- Backend остаётся rc6; схема БД и миграции не менялись.
- rc14 сохранён для отката; откат не потребовался.

При переносе macOS добавила AppleDouble ._ файлы. Установщик отказал до изменения production. Удалены только три служебных файла с проверкой имени и magic; исходные assets и guard не менялись. Повторная строгая проверка и установка прошли.

Перед тегом исправлен устаревший hash в сводном дизайн-отчёте: он был собран раньше финальной записи Android interactions.json. Сводка пересобрана из окончательных независимых отчётов без изменения verdict. На чистом release checkout design:check прошёл.
