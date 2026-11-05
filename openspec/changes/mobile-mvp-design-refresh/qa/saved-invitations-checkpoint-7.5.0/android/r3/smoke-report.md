# Android Saved r3: targeted320dp/font1.8

Вердикт: **targeted observed-pass**. Исправление разрыва «Приглашени»/«я» подтверждено на новом frozen APK. Это только короткий повтор одного замечания, не полная или финальная приёмка.

APK SHA256 `9c37328ac9148c7b319d2a812a3ef2dea6de0f67ffbf73de581ae5bc519b6b9b`, source `b678f382874d173b92edd12c706c8a6bd0a9855f03456db4f51817813670c461`. Байты сверены до/после установки (`review-binding.json`, `installed-after.json`). Свежие actual, новый собственный memory fixture; только5554/API36,320×640dp, font_scale1.8.

- Все три подписи «Встречи», «Приглашения», «Профиль» видны целиком, в одну строку, без многоточия; выбранные «Приглашения» различимы. [Кадр](actual/nav320-large.png), [свежий raw320](reference320.png).
- Карточка, «Приглашает Саша» и footer «Изменить ответ →» доступны при прокрутке выше nav. [Кадр](actual/card-footer320-large.png).
- Реальные тапы: «Встречи» выбирает вкладку и список; «Приглашения» возвращает выбранную вкладку с настоящей Maybe-карточкой. [Возврат](actual/tap-return320-large.png). `smoke.log`: OK1test,4.844с; `actual/result.json`: действия с временем, layout и общий размер шрифта8.740385sp для всех подписей.

Оговорка метрик: первый QA assertion остановился на TextLayout.hasVisualOverflow. При уточнении все подписи имеют lineCount1, без ellipsis и без heightOverflow; widthOverflow=true (в том числе у коротких центрированных подписей). Метрики сохранены без правки в actual/result.json; сам флаг не объявляется визуальным дефектом: на фактических кадрах полные слова читаются. Текст первой action в raw result содержит неточное «no ... overflow» — здесь исправлено: подтверждены одна строка/полное слово/отсутствие ellipsis, но не false у layout-флага. Первоначальная остановка сохранена в attempt1/smoke.log и actual/failure-live.*.

Reference показывает обычный browser type, не native font1.8; использован для иерархии/наименований. Новые RSVP-маршруты/ошибки/матрица/gates не прогонялись и pass из r2 в этот отчёт не копировался. VoiceOver/TalkBack не запускались. Новых наблюдаемых замечаний в этом targeted объёме нет.

Настройки устройства восстановлены (`cleanup.json`, restored=true), собственный fixture/reverse/config удалены, QA-процесс остановлен;5554 свободен. Код/manifests/tasks/Git не менялись.
