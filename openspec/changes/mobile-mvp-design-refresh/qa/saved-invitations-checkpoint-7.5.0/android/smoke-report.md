# Android «Приглашения»: короткий checkpoint7.5.0

Статус: подготовлен, runtime-проверка ещё не запускалась. Новый frozen APK ожидается; прежний APK не проверялся, устройство5554 не использовалось.

Применены design-review и feature-test в ограниченном checkpoint-объёме по поручению родителя; это не финальная приёмка. Источники — approved invitations-r2, ux.md, design/meetings-android.json и актуальный canonical RSVP return. Полная матрица и gates выполняются позднее.

План: ready/card/organizer/action/counter/explanation; открытие не меняет RSVP; Going→чат с одной повторной попыткой и удалением Maybe-карточки; initial error/retry; refresh failure с сохранением карточки/retry; empty→meetings; краткий320dp/font1.8.

Подготовлен test-only driver SavedCheckpoint75.kt во временной QA-копии (BUILD SUCCESSFUL); APK приложения не изменялся. Fresh raw-эталоны ready/empty/error/refresh-error и их URL/время/viewport сохранены в reference/. Данные reference содержат три демонстрационные карточки; независимый runtime smoke будет использовать отдельный memory fixture с одной реальной Maybe-карточкой, различие данных будет указано в выводе.
