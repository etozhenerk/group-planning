# Web composer: внешнее нажатие · 5.0.0

Добавлен локальный hook composer: pointer click вне textarea/её label снимает
только текущий фокус composer. Click capture не предотвращает default/propagation;
blur после распознавания click не сдвигает цель между down/up. Detail0 сохраняет
клавиатурную/виртуальную активацию. OnBlur сохраняет draft selection, существующие
emoji restore, другие input и обработчики жестов не менялись.

Web check: 211 unit PASS, типы/линтер/архитектура/стиль PASS. Vite demo build PASS.
Новый61: 6/6 PASS, Chromium и WebKit1440/390/320. Проверены внешний фон и история,
сохранение текста/selection, внутри поля, первая отправка1POST/1accepted, Plus,
другая форма/search, emoji replacement/явный возврат, keyboard activation и
отсутствие даже временного focus-return при закрытии header/form panel.

Первый прогон3PASS/3FAIL на WebKit Tab сохранён отдельно: штатный Tab пропускает
button; изолированный HTML показал Tab→input, Alt+Tab→button. Используется
прежнее соглашение53, assertion фокуса не ослаблялся. Runtime/bundle не менялись.
После тестового уточнения повторены типы/eslint/prettier и только6сценариев61.

Изменённые4файла и hashes: owned-files.json; runtime/source и bundle inventories
рядом. Full browser suite и CI не запускались. Настоящая mobile OS IME не
подтверждена браузерной эмуляцией. Независимая приёмка остаётся отдельной.

Fixture8492 остаётся запущен. После login выбрать «Войти как Саша», перейти по
URL из /tmp/somewhere-web-composer-dismiss-fixture.json. Это собственные
синтетические данные memory API, без production/настоящего OAuth.

Перезапуск при необходимости из MAIN/frontend/web:
SOMEWHERE_BROWSER_DIST=/tmp/somewhere-web-composer-dismiss-20261029
SOMEWHERE_BROWSER_ADDR=127.0.0.1:8492 npx --no-install tsx scripts/browser-server.ts
(переменные передать одной командой). Данные при перезапуске очищаются;
seed: npx --no-install tsx /tmp/somewhere-seed-composer-review.mts.
