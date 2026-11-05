# iOS invitation7.5 — короткий независимый checkpoint

Функциональный smoke: **6/6 passed**, 175с. Точный переданный bundle проверен перед запуском: `fe3e027b652301fa05e883bee780b948abd61930f57bd81a75b6ef93c3dd6f39` ([binding](artifact-binding.json)). Это ограниченный screen checkpoint, не финальная приёмка/gates.

Пройдены Going→чат, Maybe→приглашения, Decline→подтверждение/личные встречи; гость/ошибка входа/повтор, потерянный ACK и повтор, первый Going и системные строки со временем, Dynamic Type, landscape, share503→локальный retry→системный share и narrow smoke. [Действия и результаты](smoke-independent.log).

Визуально просмотрены actual и утверждённые invite-r3/response-routing: публичное приглашение показывает «Москва», иконки читаются; первый Going отображается системной строкой с конкретным ответом и временем; landscape-панель прилегает к трём краям; все три действия доступны при accessibility5. [Гость](actual/guest-standard-phone.png), [первый Going](actual/going-chat.png), [крупный текст](actual/large-text.png), [landscape](actual/landscape-return.png).

Два оставшихся наблюдения в общей панели сведений: технический `Europe/Moscow` всё ещё виден; при503 одинаковый статус/повтор виден и в foreground-sheet, и в затемнённом чате за ним. Публичное приглашение timezone исправило. Это не мешает функциональному retry; визуальный pass на все сведения не заявляю. [Доказательство](actual/share-error-standard-phone.png), [успешный retry](actual/share-retry-result.png).

Narrow — настоящий QA UIWindow320×568 при physicalScreen402×874, не другое устройство: [снимок](actual/narrow-window-smoke.png), [измеренные metrics](actual/narrow-window-smoke.environment.json). Обычный runtime iOS27.0, устройство31262733-50DC-46A5-938E-4C462D70F109. Использована отдельная memory/API fixture с согласованным test-only overlay; review-owner — alias существующего fixture-owner credential, не подмена состояния приложения.

VoiceOver, внешний Yandex OAuth, полные unit/UI suites и финальные gates не запускались. Repo code/manifests/tasks/Git не менялись. Своя fixture остановлена, QA app завершён, simulator lock освобождён; устройство свободно для следующего экрана.
