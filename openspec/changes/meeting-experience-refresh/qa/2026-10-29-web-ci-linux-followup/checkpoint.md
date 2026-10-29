# Linux CI после 8ef09d33

Run40842365914, Tests123341565758. Это диагностика, не успешная приёмка.

- Base: 261 PASS, 1 FAIL, 1 SKIP. Оставшийся Chromium52: после двух swipe fullscreen и `close.tap()` viewer остаётся видимым (строка187). Проверки51/53 проходят на Linux; focus и CSS timeline исправления подтверждены этим запуском.
- Chat: 38 PASS. Новый реальный transport reconnect, subscribe ACK, HTTP cursor catch-up и отдельный online/terminal401 путь проходят на Linux.
- Read: 10 PASS.
- Window: 3 PASS, 1 FAIL. WebKit39: после двух удалённых сообщений и возвращения страницы на передний план ID якоря прежний, но offset отличается на39px при допуске2px (строка182).

Annotations сохранены без секретов. Для диагностики нужны trace/screenshots и trusted-touch-events из browser-evidence artifact; основной агент загружает их через авторизованный GitHub UI. Новый runtime patch до подтверждения причины не сделан. Допуски/таймауты не менялись.

Foundation скачивания альбома временно вынесена из компилируемых исходников в vibe-album-download/qa/2026-10-29-web-foundation/draft; это непроверенный черновик.
