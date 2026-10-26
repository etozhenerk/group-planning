# Возможность live mobile web IME

Исследование выполнено только чтением 27.10.2026. Android Chrome не запускался,
его данные/настройки/доверие не менялись. User emulator-5556 не использовался.
Разрешённый `adb -s emulator-5554 shell pm list packages chrome` вернул только
`package:com.android.chrome`.

[AndroidDevice.launchBrowser](https://playwright.dev/docs/api/class-androiddevice#android-device-launch-browser)
возвращает persistent context установленного браузера. API допускает выбор `pkg`
и `ignoreHTTPSErrors`, но не предоставляет параметр disposable userDataDir.
[BrowserContext.browser](https://playwright.dev/docs/api/class-browsercontext#browser-context-browser)
для Android возвращает null: обычный путь browser.newContext недоступен через
полученный объект.

Локально установлен Playwright1.64.1. В node_modules/playwright-core/lib/coreBundle.js
строки40429–40540 launchBrowser выполняет force-stop выбранного пакета, временно
пишет chrome-command-line и подключается к defaultContext, вызывая
loadDefaultContextAsIs. В изученном пути нет создания отдельного профиля и нет
очистки cookies. Следовательно, обещать изоляцию пользовательского профиля
обычным launchBrowser было бы неправильно.

Текущий вывод: этот путь не запускается. Для проверки нужен выделенный QA
browser/WebView package с собственным disposable storage и документированным
контекстом для loopback fixture. Подмена IME через CSS, viewport resize, один
focus или headless keyboard events не даёт pass реальной экранной клавиатуре.
До появления подходящего изолированного runtime состояние остаётся blocked.
Browser zoom200% в отдельном desktop profile — другая проверка, подготовлена
независимо и не выдаётся за IME.
