# Перенесённые задачи карт · 04.11.2026

Не выполнены. Пользователь отложил блок до отдельной проработки.

## 5. Яндекс Карты · общая функциональная зависимость

- [ ] 5.1 Backend/API: проверить текущие доступы/SDK-условия, спроектировать и реализовать совместимый optional place_location для создания встречи/опроса/чтения/применения, координаты/идентификатор/текстовый fallback/очистку старых координат. Сохранить права/revision/idempotency и старые клиенты; Go/API contract/integration checks. Использовать memory.Store/мок очереди, не вводить БД/SQL/Docker. Кандидат для 5.5.
- [ ] 5.2 mobile web: реализовать переиспользуемый полноэкранный picker Яндекс Карт: поиск/организация/точка/подтверждение/отмена, ручной ввод, stale search/error/empty/geolocation, pan/pinch без dismiss sheet, safe area и provider attribution. После 5.1,2.12 и основы 6; web:check/build, Chromium/WebKit, ширины 320/390/739 и desktop-regression740/1100/1440. Встраивание в создание/опрос принадлежит 8/10, не дублировать их формы.
- [ ] 5.3 iOS: реализовать переиспользуемый полноэкранный picker Яндекс Карт: поиск/организация/точка/подтверждение/отмена, ручной ввод, stale search/error/empty/geolocation, pan/pinch без dismiss sheet, safe area и provider attribution. После 5.1,2.12 и основы 6; swift-format, clean simulator build и device/UI-проверки по frontend/ios/AGENTS.md. Встраивание в создание/опрос принадлежит 8/10, не дублировать их формы.
- [ ] 5.4 Android: реализовать переиспользуемый полноэкранный picker Яндекс Карт: поиск/организация/точка/подтверждение/отмена, ручной ввод, stale search/error/empty/geolocation, pan/pinch без dismiss sheet, safe area и provider attribution. После 5.1,2.12 и основы 6; Gradle wrapper, ktlint, Debug/Release, Android Lint и device/UI-проверки по frontend/android/AGENTS.md. Встраивание в создание/опрос принадлежит 8/10, не дублировать их формы.
- [ ] 5.5 Независимо принять 5.1: feature-test/API/старые клиенты и qa:ready.
- [ ] 5.6 Независимо принять 5.2: design-review + design:ready, затем feature-test + qa:ready по точному кандидату. Покрыть обе формы через 8/10 и отмену без потери данных.
- [ ] 5.7 Независимо принять 5.3: design-review + design:ready, затем feature-test + qa:ready по точному кандидату. Покрыть обе формы через 8/10 и отмену без потери данных.
- [ ] 5.8 Независимо принять 5.4: design-review + design:ready, затем feature-test + qa:ready по точному кандидату. Покрыть обе формы через 8/10 и отмену без потери данных.

