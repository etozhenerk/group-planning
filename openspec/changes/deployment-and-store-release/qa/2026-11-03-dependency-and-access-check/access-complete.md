# 3.3 — служебные права, сеть и получение конфигурации

03.11.2026, основной агент. Задача закрыта после устранения пустого OAuth-секрета.
Начальный частичный результат в result.md сохранён и не переписан в PASS.

## Исправлено и проверено

- В существующий OAuth-secret `e6qs3a6acfo71onj24el` добавлена активная версия
  `e6qibtr9n0gj6ud53cff` с существующими Client ID/Secret somewhere. Значения
  переданы через stdin, не через argv и не в Git. Новых учётных записей,
  разрешений или OAuth-реквизитов не создавалось.
- `sync-oauth-config.py` получает IAM из metadata ВМ, читает Lockbox и
  синхронизирует два поля закрытого systemd EnvironmentFile. Проверяет полноту,
  дубли/чужие поля, управляющие символы, тип/режим файла. Запись атомарная,
  остальные настройки и права сохраняются. Секреты/ответы/ошибки HTTP не печатает.
- На существующей ВМ скрипт выполнен в `--check`: exit0,
  `{"verified_keys":2,"changed":false}`. Оба поля совпадают с действующей
  конфигурацией приложения; systemd передаёт её процессу через EnvironmentFile.
- Отдельно тот же fetch выполнен от `sudo -u somewhere`: exit0,
  `{"runtime_user":"somewhere","verified_keys":2}`. Это фактическое получение
  непустого секрета с runtime IAM-правами, а не HTTP200 для пустой версии.
- Первый запуск проверки от somewhere не смог прочитать закрытый root-only
  EnvironmentFile. Права не расширялись: доступ к Lockbox проверен от somewhere,
  сверка закрытого файла — от root, как при запуске systemd. Этот отказ не скрыт.
- Три unit-проверки PASS: атомарное/idempotent обновление и права; отказ без
  изменения файла при check/missing/duplicate/world-readable/symlink; отказ при
  неполном, дублированном, постороннем и содержащем перевод строки payload.

## Права и сеть

Свежие role bindings, SG и внешние TCP-пробы сохранены в checks.json.
Runtime имеет folder-level monium.metrics.writer, ресурсный Lockbox payloadViewer;
прав administrator/editor на folder нет. OAuth-binding перепроверен после записи.
Входящие TCP80/443 публичны; SSH22 ограничен 95.24.33.238/32.
Go8080 слушает loopback, внешний TCP — timeout. Дополнительная сверка
`pg_lsclusters`/SHOW показала, что рабочий PostgreSQL16/main использует port5432
с пустым listen_addresses, только Unix socket; внешний TCP5432 также timeout.
Наблюдавшийся loopback PostgreSQL-listener16241 не является рабочим16/main.
Первоначальная интерпретация этого listener как production-порта уточнена;
ограничения SG и исходные результаты TCP-проб сохранены.
somewhere.service active, User/Group=somewhere, EnvironmentFiles указывает
на проверенный `/etc/somewhere/application.env`.

Посторонний существующий probe-invoker `ajegu74pcdijevjl6g27` успешно получил
собственный IAM-токен, но PayloadService/Get ответил PermissionDenied
(request_id dbabef86-3f8a-49d5-ab93-a65616663a90). Это подтверждено исходным
журналом CLI, в Git сохранены только безопасные метаданные. Повторное извлечение
payload было заблокировано автоматической проверкой и не выполнялось обходным
способом. Использован ранее состоявшийся отказ, а не выдуманный повтор.

## Границы

Другие application/backup placeholders не используются для выдачи OAuth и остаются
пустыми; получение непустого секрета проверено именно через используемый OAuth.
Резервные ключи не переносились. Нет перезапуска приложения/БД, релиза, миграции,
изменения SG/IAM, CI или Telegram. Проверка загрузки конфигурации не заменяет
реальный интерактивный OAuth-цикл из4.2. agent:check, OpenSpec strict и diff-check
выполнены при фиксации.
