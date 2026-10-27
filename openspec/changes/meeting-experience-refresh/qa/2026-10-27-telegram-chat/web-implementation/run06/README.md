# Web: повторная проверка перехода к реакциям

DS 1.4.1; 4/4 Playwright-сценария прошли в Chromium и mobile WebKit.
Команда: `npm run test:e2e --workspace @somewhere/web -- tests/28-meeting-refresh.spec.ts tests/34-telegram-chat.spec.ts --grep "reaction toggle|reaction people"`.

Проверены открытие списка людей, фильтрация, Back в тот же чат и открытие Share из picker.
`source-inputs.json` фиксирует исходники после прогона до следующей правки.
Это проверка исполнителя, не независимая функциональная или дизайн-приёмка.
