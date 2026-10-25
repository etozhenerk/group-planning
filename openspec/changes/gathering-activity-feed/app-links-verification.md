# HTTPS-приглашения: подготовка и проверки

25.10.2026. Задачи 8.5–8.7. Затронуты backend, iOS, Android и локальная/release
обвязка; web-интерфейс и API встреч не менялись. Деплой не выполнялся.

## Реализация

- Бэкенд формирует AASA и assetlinks по публичным идентификаторам и подписям
  из окружения. Невалидная/частичная конфигурация не запускается; отключённая
  платформа возвращает 404. JSON доступен без сессии, GET/HEAD без redirect,
  неизвестный `.well-known` не попадает в SPA.
- Android: обычные Debug/Release регистрируют только HTTPS host API и пути
  `/i/` и `/invitations/`. QA не регистрирует production HTTPS-ссылки.
- iOS: добавлен applinks host к существующим Yandex entitlements, локальный
  туннель и release origin согласуют домен. Архивирование принудительно задаёт
  обычный файл entitlements, затем проверяет домен и application-identifier
  в archive и IPA. Проверка provisioning profile различает App ID prefix и Team ID.
- Существующие нативные парсеры продолжают отвергать посторонний origin,
  query/fragment, лишние сегменты и неканонический токен. Ссылка сохраняет
  приглашение, но не отправляет RSVP.

Настройка и команды: [backend/docs/app-links.md](../../../backend/docs/app-links.md).
Публичные параметры текущего локального Debug APK подготовлены в игнорируемом
`.cache/verification/app-links/local-android.env`. Они не заменяют сертификат
Play App Signing или подпись RuStore; ключи в файл не включены.

## Пройдено

| Проверка | Результат |
| --- | --- |
| Go format, race, vet, build, архитектурные границы | Прошли; включая новый handler, конфигурацию и настоящий HTTP-сервер с web |
| API-контракт | 49 схем, 32 fixtures и 341 реальный ответ соответствуют контракту |
| Release tooling | 13 Python-тестов: включая разные prefix/team, отсутствие capability и потерю домена при подписи |
| iOS | swift-format, чистые Debug/Release simulator build + analyze; 108 unit-тестов прошли |
| iOS accessibility | 6 UI-тестов прошли: подписи, traits, формы/клавиатура, крупный текст, фокус текущего слайда |
| Android | Чистая сборка, ktlint, Debug/Release, lintDebug/lintRelease, 112 JVM-тестов, Debug/QA instrumentation APK прошли |
| Android manifest | Собранные Debug/Release содержат только `smwhere.ru` и два пути; QA не содержит этого autoVerify-фильтра |
| Android emulator | Проверка установленного manifest: Debug — 1 passed, QA — 1 passed; callback, главная, чужой домен и HTTP не выбирают MainActivity |

Первый Android-прогон обнаружил два замечания Lint в новом overlay: совместные
атрибуты `data` и отсутствие явного `exported`. Оба исправлены без подавлений;
повтор всех затронутых Gradle-проверок прошёл.

Xcode сформировал `Somewhere.app-Simulated.xcent` с `applinks:smwhere.ru` и двумя
доменами Yandex. `application-identifier` симулятора —
`KMGUVHBG8T.dev.groupplanning.ios`. Это не distribution profile: обычный codesign
entitlements blob simulator-бинарника пуст, simulator entitlements находятся
в отдельной секции. Этот результат не подменяет проверку device archive.

iOS результаты: `TestResults-20261025T111314-2196.xcresult`,
`UIResults-20261025T111706-5216.xcresult` в `frontend/ios/.build`.
Android использовал только прежний `emulator-5554`, без сброса данных.
Проверка маршрутов ограничивала intent своим package; она проверяет manifest,
а не доверие ОС к домену. Состояние верификации принудительно не изменялось.

## Не закрыто

- Файлы ассоциаций ещё нужно установить на публичный домен с соответствующим
  backend-релизом и окружением. Подготовка репозитория не меняет работающий сайт.
- Нет подтверждения `verified` Android и настоящего открытия из другого
  приложения; задача 8.7 остаётся открытой.
- Пользователь подтвердил только Personal Team и разрешил отложить TestFlight
  и физический iPhone до оплаты Apple Developer Program и настройки профиля.
  Новые сертификаты/ключи не создавались, store-артефакты не публиковались.
- Ручное озвучивание VoiceOver/TalkBack, физические устройства и разбор всех
  визуальных замечаний прежнего аудита остаются отдельной проверкой.
  Шесть успешных UI-тестов не закрывают 6.7/7.7 целиком.
- Два настоящих профиля, вход из приглашения, RSVP и переписка на целевом
  окружении остаются приёмкой 8.1/8.7. Моки не заменяют её.
