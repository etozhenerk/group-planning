# Прогон functional-qa-pilot

Цель: feature. Каталог: f76aceb21cfc483b0600fcf957de6d761a73d7d5049be4224958f86029fe4401.

| Кейс / окружение / способ | Результат | Наблюдение |
| --- | --- | --- |
| Отсечка присоединения за час: Уже подтверждённый участник (TC-INV-F00F3753/web-pilot/manual) | blocked | UI не открыт: Chromium sandbox MachPort Permission denied; IAB остановлен NET::ERR_CERT_AUTHORITY_INVALID до входа. Создание/чат/участие не проверены. |
| Непосредственный переход после создания: Успешное создание (TC-CREATE-9138348C/web-pilot/manual) | blocked | UI не открыт: Chromium sandbox MachPort Permission denied; IAB остановлен NET::ERR_CERT_AUTHORITY_INVALID до входа. Создание/чат/участие не проверены. |
| web-check (web-check) | failed | Process exit: 1 |
| web-e2e (web-e2e) | failed | Process exit: 1 |

## Обязательные автоматические наборы

- web-check: failed
- web-e2e: failed

Наличие отчёта не означает готовности. Выполните qa:ready / qa:release-ready.
