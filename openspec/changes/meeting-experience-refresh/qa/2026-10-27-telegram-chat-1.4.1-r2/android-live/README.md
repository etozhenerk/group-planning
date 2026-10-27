# Android live r2 — готово для независимой проверки

Новый отдельный fixture: **https://127.0.0.1:54980**, PID **22948**.
HTTPS `/healthz` проверен с сертификатом из приватного конфига: 200.
Предыдущий собственный fixture PID 16576 был сверён по executable path и
завершён через SIGTERM. Старый evidence не изменялся.

Использован уже собранный общий бинарник
`.cache/qa/2026-10-27-telegram-chat-1.4.1-r2/httpapi.test`:
`81e880b4655e918e0f00dd084ca0dc509cd0de3d1499574c84dca3958df2e6be`.
Запуск: `TestAndroidFixture`, scope `calendar`, scenario `design`.
Синтетические данные заново созданы в memory.Store; изменения прежнего процесса
не переносятся. Production-код/UI в этом handoff не изменялись.

Приватный config mode 0600 расположен в
`.cache/qa/2026-10-27-telegram-chat-1.4.1-r2/android-live/config.json`.
Credentials не выводились в логи или evidence. Design credential действует до
**27 октября 2026, 17:56:44 МСК**. После истечения согласовать новое окружение;
не считать старые credentials действующими. Fixture оставлен живым до сигнала.

На уже работающем Somewhere_API_36 / emulator-5554:

- Проверен установленный APK: SHA-256 `74ceec478be40f4a90633c301b9b38e6fd6c47f23b3db3b0482725aeb4c36325`, точный saved run03.
- Удалён только старый reverse 65193, установлен reverse 54980.
- Force-stop только `dev.groupplanning.android.uitesthost`; новый config передан по stdin в private `no_backup/ui-fixture.json`, mode 0600.
- Запущен `dev.groupplanning.android.uitesthost/dev.groupplanning.android.MainActivity --es scenario design`; статус запуска ok, foreground QA подтверждён.
- Android 16 / API 36, build `BE2A.250530.026.F3`, incremental 13894323; 720×1600 px, 320 dpi, fontScale 1.0.

После запуска UI не трогался. Go/Gradle не запускались; установки, очистка данных,
wipe, запуск новых AVD, UI runners и изменения обычного приложения не выполнялись.
Pixel_10a/emulator-5556 не затрагивались. Текущие fixture и emulator оставлены живыми.

[environment.json](environment.json) содержит точные origin/PID/expiry,
бинарный и установленный APK hashes, реальные private paths и build identity.
[launch-result.txt](launch-result.txt) сохраняет исходный результат запуска.
Сохранённая копия установленного APK и служебные файлы остаются в игнорируемом
`.cache/qa/2026-10-27-telegram-chat-1.4.1-r2/android-live/`.
Это подготовка среды, не утверждение о прохождении независимой приёмки.
