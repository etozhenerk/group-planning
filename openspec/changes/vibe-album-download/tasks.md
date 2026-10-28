# Tasks

## 1. Контракт и дизайн

- [ ] 1.1 Подготовить UX-прототип, опубликовать состояния действия в design-system и testing-manifest; проверить design:check, qa:check и agent:check.

## 2. Backend

- [ ] 2.1 Добавить атомарный снимок альбома, приватную подготовку/состояние/скачивание/отмену ZIP с bounded temp и cleanup; integration проверяет полный набор, совпадающие имена, отзыв, чужой ID, отмену и срок. Обновить OpenAPI и документацию, выполнить Go race/vet/build/format/dependencies и api:test.

## 3. Клиенты

- [ ] 3.1 Web: вторичная кнопка, подготовка/отмена/ошибка, download браузера без Blob, cleanup на уход/выход; unit+E2E на desktop/mobile и независимые feature-test/design-review, qa:ready/design:ready.
- [ ] 3.2 iOS: add-only Photos, полный snapshot, приватная подготовка и пакетное сохранение, отмена/ошибка/повтор; unit+XCUITest с проверкой галереи и независимые feature-test/design-review, qa:ready/design:ready.
- [ ] 3.3 Android: MediaStore, pending пакет, rollback только собственных записей, lifecycle/отказ/ошибка; unit+instrumentation с проверкой галереи, check.sh и независимые feature-test/design-review, qa:ready/design:ready.

## 4. Приёмка и выпуск

- [ ] 4.1 Независимо проверить единый снимок, весь альбом более страницы, отмену/отзыв и native gallery на точных сборках; сохранить отчёты и выполнить qa:ready/design:ready без переноса исторических pass.
- [ ] 4.2 Подготовить точные новые backend/web/native кандидаты, полный release-test/qa:release-ready, затем разрешённый выпуск backend/web и установку iOS; проверить smoke и совместимость старых клиентов.
