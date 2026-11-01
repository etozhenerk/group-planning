# Независимая qualification server union36 · 01.11.2026

До case actions: sdd_server_audit независимо проверяет работающий backend,
реализацию которого не писал. Применяется feature-test; родитель назначил
независимую роль, дополнительных агентов не создаём. Product/runtime, specs,
cases, catalog и tasks не меняются. Telegram/релизы/production writes исключены.

Union:24 backend chat cases (включая PAGE/LOOKUP/THROUGH/CAPABILITIES) и12
meeting API/profile cases. Точный task/case/platform mapping берётся из обоих
актуальных testing manifests. API cases не утверждают client UI/real OAuth.

## Current freeze и дифференциальная граница

Backend/contracts413 inputs. С прошлого412 изменён только QA
ios_fixture_faults_test.go и добавлен его regression: fault теперь относится
только к RSVP route. Production/storage/http/provider source не изменился.
Сохранить old input hashes, оригинальные SQL/probe execution timestamps и
binary hashes. Доказать compiled production-dependency parity и byte parity
неизменённых storage probes. Не выдавать старый SQL за новый run.

1. Собрать текущий HTTP test artifact и новый feature plan36 до actions.
2. Один общий backend-unit-integration через qa:run-suite после plan,
   GOFLAGS=-count=1/-json. Opt-in SQL skips обозначить отдельно.
3. Исполнить свежие actual HTTP/Go overlay actions: текущие chat probes и11
   meeting groups по raw case steps, с TLS loopback, fake-provider, synthetic
   A/B/C/X и управляемыми часами. Новые route-only fixture regressions исполнить.
4. API contract check/test и actual response validation. Старые handlers,
   profile privacy/absence, cutoff/legacy/concurrent reschedule, participant
   summary, reactions и media/album/cleanup проверить реально; найденный gap
   закрыть узким QA probe либо оставить точный blocked/failed.
5. SQL/dispatcher persistence использовать только через доказанную current
   dependency/binary parity с исходными evidence. Новую БД не поднимать без
   реального недоказанного критерия; полный stockPG не повторять.
6. Для client-only clauses backend не объявлять UI pass. Для CAPABILITIES
   сохранить точный известный legacy artifact и actual current-server actions;
   не выдавать его за новый клиентский релиз. Backup lack-of-evidence case
   проверяет честность claims, не доказывает encryption/restore.
7. Записать actual каждого шага, CURRENT actions и REUSED byte-qualified facts
   отдельно. Сохранить cleanup, source-after, qa:ready/task-scope результаты.
   Whole-task7.2 hot-meeting/lock-wait не закрывать одними mapped functional
   cases. Checkbox меняет только родитель после review критериев целой задачи.

Публичные поля/permissions Яндекс ID сверены с официальными страницами
https://yandex.ru/dev/id/doc/ru/user-information и
https://yandex.ru/dev/id/doc/ru/codes/code-url. Реальный provider account и
его OAuth grants этим локальным fake-provider проходом не проверяются.
