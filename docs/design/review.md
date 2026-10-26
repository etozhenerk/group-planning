# Публикация и приёмка экрана

После одобрения дизайна примените `design-system-publish`. После реализации
набора состояний экрана, до закрытия UI-задачи — `design-review`, который явно
поручает независимому субагенту проверку. Одного автоматического выбора навыка
по описанию недостаточно: порядок закреплён в AGENTS/OpenSpec.
При новом пожелании во время реализации или проверки выполните
[цикл изменения дизайна](revisions.md), включая обновление реальных макетов,
повторную публикацию и новое независимое ревью. Исправление ошибки реализации
по действующему эталону не является основанием менять дизайн.

## Манифест

В каталоге UI-изменения создайте `design-manifest.json` и добавьте путь в
`design-system/registry.json`. Формат задаёт `scripts/design/review-schema.mjs`:

```json
{
  "schemaVersion": 1,
  "id": "meeting-list",
  "designVersion": "1.0.0",
  "phase": "checkpoint",
  "approval": "Решение пользователя и ревизия макета",
  "implementer": "Идентификатор исполняющего агента",
  "report": "openspec/changes/example/design-review.json",
  "screens": [{
    "id": "list",
    "platforms": ["web", "ios", "android"],
    "states": ["default", "empty", "error"],
    "tasks": {"web": ["4.3"], "ios": ["5.1"], "android": ["6.1"]},
    "inputs": ["frontend/web/src", "frontend/ios/Somewhere", "frontend/android/app/src/main"],
    "references": ["openspec/changes/meeting-experience-refresh/assets/list.html", "openspec/changes/meeting-experience-refresh/assets/styles.css"],
    "contracts": ["docs/design/components/meeting-card.md"]
  }]
}
```

`tasks` связывает платформу с существующими ID в соседнем tasks.md.
Закрытый checkbox требует pass всех состояний соответствующего экрана/платформы,
даже если phase остался checkpoint. Отсутствующий ID — ошибка.

`inputs` должны включать все влияющие UI-исходники, конфигурацию сборки,
шрифты, ресурсы и fixture. Можно перечислить широкие каталоги: это консервативно
инвалидирует отчёт. Не включайте каталог с самим report/manifest/tasks,
иначе возникнет самоссылка. Общие tokens/version/authority/docs/design/scripts/design
включаются автоматически. Пути относительно корня, существующие, без symlink.

Не объединяйте разные формы в единственный `open` и все web-ширины в `default`.
Для live-приёмки нужны отдельные date-open, place-open, task-open, menu, error,
reopen и viewport-варианты. При разных наборах состояний создавайте отдельные
screen ID для платформ. Покрытие определяет контракт, а не число JSON-строк.
Первый historical-пилот сохраняет укрупнённую матрицу; перед возобновлением
реализации её нужно раскрыть, и pass по ней не выдаётся.

Фазы: checkpoint — работа в процессе; review — экран реализован и ждёт проверки;
complete — все заявленные платформы/состояния прошли; paused — явная пауза
пользователя. Переход фазы не меняет UI-hash. Перед закрытием отдельной UI-задачи
или экрана нужен `design:ready` по соответствующему manifest; разделяйте
независимые наборы состояний в отдельные изменения/manifest, если их приёмка разная.

```sh
npm run design:context -- --manifest openspec/changes/example/design-manifest.json
npm run design:ready -- --manifest openspec/changes/example/design-manifest.json
```

## Отчёт и evidence

Ревьюер записывает JSON: schemaVersion=1, manifest (путь), inputHash из context,
reviewer (отличается от implementer), reviewedAt (ISO), mode=live либо historical,
environment, summary и checks. Каждый check имеет screen/platform/state,
status=pass/needs-fixes/blocked, observations и evidence: path, sha256, kind.
Для pass также обязателен объект `capture`: sourceHash (hash контекста), fixtureHash,
runtime, os, viewport, fonts (список), locale, timezone, textScale и capturedAt.
Запишите фактические данные при захвате, неизвестное не придумывайте.
Для historical/blocked capture может отсутствовать.
Для pass нужны kind actual и reference (изображения) и interaction (журнал
действий/результатов). В observations указываются правило и наблюдаемый результат;
в environment — сборка, устройство/viewport, шрифты, масштаб, fixture, locale/timezone.
Сохраняйте небольшие целевые screenshots; приватные production-данные не нужны.

Изолированный отчёт можно проверить командой `npm run design:inspect-report -- --manifest <путь> --report /tmp/report.json`.
Она проверяет структуру/evidence, не разрешает закрыть задачу.

Hash связывает отчёт с текущими входами и контрактом manifest. Изменение любого
входа, эталона или evidence лишает отчёт актуальности. Неполное покрытие не pass.
Сама машинная валидность JSON не доказывает честность автора: независимость
и просмотр evidence остаются обязательны. Исторические материалы дают замечания,
но не приёмку текущего интерфейса. Скриншот без просмотра и взаимодействия — не ревью.

`design:check` проверяет генерацию, literals, authority, manifests и актуальность
заявленных complete; checkpoint/paused можно сохранить. `design:ready` требует
pass даже при checkpoint и используется для завершения/выпуска клиента.
CI в main не отменяет опубликованный коммит: локально выполняйте обе проверки
до заявления готовности. Выпуск web/iOS/Android вызывает ready с платформой.

## Дополнительный Codex hook

Проектный `.codex/hooks.json` содержит только локальную проверку готовности
перед завершением ответа при phase=review/complete. Он не запускает агента сам:
возвращает родителю необходимость вызвать навык. Нужны поддержка hooks клиентом
и доверие точной конфигурации в Codex; изменённые недоверенные hooks могут быть
пропущены. Не утверждайте, что hook включён, пока это не проверено в клиенте.
Основной порядок действует через AGENTS/OpenSpec и CI независимо от hook.

При явной паузе сначала сохраните paused. Повторный Stop после уже возвращённого
замечания не блокируется бесконечно; неполная работа остаётся неполной, gate
готовности не обходится. Docs-only, backend-only и checkpoint hook не задерживает.

## Средства визуальной регрессии

Web: существующий Playwright runner, затем `toHaveScreenshot` для проверенных
baselines на фиксированной среде. Native: существующие XCTest/Compose runners;
Swift Snapshot Testing и Roborazzi пригодны для отдельного подключения при
миграции компонентов. Версии и baseline принимаются после пробы совместимости.
До этого screenshot-only запуск прямо обозначается как screenshot-only.
Пиксельный diff не заменяет проверку смысла, навигации и жестов.
