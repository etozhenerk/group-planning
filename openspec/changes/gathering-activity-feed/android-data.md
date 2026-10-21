# Android: данные и состояние · 7.2

Затронуты Android, его CI и инструкции. Новых экранов и переходов нет;
UX/UI неприменимы к этому этапу. Согласованные макеты сохраняются.
Реальный Яндекс ID, Custom Tabs и callback относятся к отложенной 7.3.

## Устройство

- OkHttp 4.12.0, kotlinx.serialization 1.9.0, coroutines 1.10.2,
  Lifecycle ViewModel 2.9.4; версии закреплены вместе с Kotlin 2.2.20.
- DTO повторяют существующий OpenAPI. UUID, RFC3339 и строковые счётчики
  проверяются при чтении; неизвестные поля пропускаются. Неизвестный kind
  или payload_version остаётся данными и не отображается как сообщение.
- HTTPS origin задаётся явно. Transport отключает cookies, disk cache,
  автоматические redirects и повторы; обычная TLS-проверка остаётся включённой.
  Отмена coroutine отменяет Call, тело закрывается также при отмене.
- Сессия — собственный Bearer. AES-GCM с ключом Android Keystore шифрует
  файл в noBackupFilesDir, отдельный для каждого origin; plaintext fallback нет.
  I/O выполняется вне Main. Профиль подтверждается через /me.
- SessionRepository сериализует переходы Mutex; StateFlow публикует снимок
  сессии и приватного кеша. Поколения сессии, доступа и запросов исключают
  запись устаревших ответов. Выход/401 очищает секрет и приватные данные;
  403 на чтение встречи отзывает только её доступ. Отказ из-за роли на
  настройках или выдаче ссылки не отзывает чат.
- MeetingRepository загружает список, детали, состав и первую страницу ленты.
  ViewModel владеет заданиями через viewModelScope, переживает пересоздание
  Activity и отменяет работу при уничтожении владельца. После нового процесса
  восстанавливается только зашифрованная сессия, приватный кеш читается заново.
- Состояния формы/пагинация/опрос ленты и UI подключаются в 7.4–7.6.
  Runtime не содержит тестового профиля, сервера или автоматического RSVP.

## Проверка

Общие contracts/fixtures/cases.json подключаются в JVM-тесты без копии.
Проверки: сериализация, отмена реального OkHttp Call на локальном HTTPS-сервере,
редиректы/cookies/автоповторы, 401/403 (включая повреждённое тело ответа),
поздние ответы после выхода/смены доступа,
пусто/ошибка/повтор, ViewModel lifecycle и восстановление сессии.
Отдельный instrumentation-набор проверяет настоящий Android Keystore,
случайный IV, повреждённый шифротекст, разделение origin и удаление файла.
Он запускается только на уже открытом единственном эмуляторе. CI собирает
instrumentation APK; JVM-тесты входят в обязательный check.sh.
Результаты и ограничения — [android-data-verification.md](android-data-verification.md).

Основания: [Keystore](https://developer.android.com/privacy-and-security/keystore),
[отмена coroutine](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/suspend-cancellable-coroutine.html),
[ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-apis).
