# Web album cancel-before-ACK · независимый FAIL

01.11.2026, reviewer `/root/sdd_clients_audit`, Chrome156/macOS27.0.1,
responsive390×900, мышь/клавиатура, свой memory TLS8536. Источник/сборка:
[общий checkpoint](../../../meeting-experience-refresh/qa/2026-11-01-web-sdd-independent/report.md).
Собственные3 синтетические PNG и past meeting: [fixture](fixture.json).
Никаких пользовательских фотографий илиproduction.

## Пройдено

Primary открывает форму «Добавить фото в альбом» перед OS picker. Escape закрывает
форму и возвращает фокус к primary. Две кнопки расположены рядом на390, длинный
заголовок над ними. Наблюдались preparing и реальная штатная загрузка браузера.
[Сохранённый ZIP](observed-native-1.zip):3 файла, CRC ZIP корректен, SHA каждого
совпал с оригиналом API; [сверка](native-downloads-observed.json). Это3-photo live,
не новый ручной проход всего103-photo snapshot. Current E2E59/60 отдельно прошёл
в составе282PASS:103 originals, cancel/leave/handoff/access expiry/revoke.

## F1: отменённый POST оставляет занятый export

1. На загруженном собственном альбоме включить DevTools3G.
2. Нажать «Скачать», увидеть «Отменить подготовку фотографий», отменить ДО получения
   POST ACK. Видимый UI возвращается к ready; нового ZIP нет.
3. Выполнить ещё один запуск (в нашем проходе через Offline→ошибка→No throttling).
4. Нажать «Повторить»: реальный ответ429 `album_export_busy`; UI остаётся с общей
   ошибкой подготовки, новый архив не выдан.

[Кадр Preview](album-390-retry-429.png),
[безопасный AX/status](album-390-retry-429-safe.txt), [действия](interactions.json).
Сеть восстановлена и No throttling виден на кадре. Это не оставшийся Offline.

Кодовая причина-кандидат: `createAlbumDownload.cancel` abort-ит prepare fetch,
пока id ещё неизвестен; `cleanup` сразу выходит без id. При настоящем fetch
отмена делает поздний успешный ACK недоступным. Сервер уже держит собственный job
и корректно отклоняет другой ключ. Unit с mock promise, игнорирующим AbortSignal,
не воспроизводит такую границу. Это требует отдельного abort-aware контролируемого
HTTP regression; root получил точные пути и готовит исправление. Продукт, API,
лимиты, UI, CSS и ожидания reviewer не менял.

Первая попытка отмены через native AX попала в фото и открыла viewer — ошибка
hit-test инструмента, не product failure. Artifact `album-390-cancelled.png`
сохранён как исходный raw, его имя НЕ означает принятую отмену. Viewer закрыт
Escape; следующая попытка использовала реальные координаты кнопки и вернула ready.
Ни одна из этих попыток не переписана задним числом как pass.

Whole task3.1/qa:ready/design:ready не приняты. Отдельный root fix потребует нового
immutable артефакта, prior plan и независимой проверки. Более широкие states,
полный desktop live и системный OS-touch/IME этим390-проходом не закрыты.
