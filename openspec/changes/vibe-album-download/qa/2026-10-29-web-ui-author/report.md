# Web: скачивание альбома · авторская проверка

## Реализация

По опубликованному дизайну 4.1.0 secondary «Скачать все» находится рядом с
«Добавить фото». На телефоне две равные колонки; обе кнопки используют общие
borderWidth, min-height, icon и spacing. Подготовка заменяет secondary на
spinner + «Отменить»; выбранное фото и геометрия сохраняются. Пустой альбом не
показывает download. Ошибка предлагает повтор, успех сообщает только
«Скачивание началось».

Новый feature slice соединяет проверенный API/state foundation с Session и
accessEpoch. Layout cleanup отменяет подготовку до выхода с экрана; private
purge, текущие 401/403 и смена сессии прекращают операцию, поздний ответ её не
возвращает. После вызова штатного browser download локальный уход/повтор больше
не отправляет DELETE: передачей владеет браузер, доступом и TTL — сервер.
Неизвестный экспорт при потерянном POST очищается по позднему ID либо TTL.

ZIP передаётся браузеру через same-origin ссылку из проверенных ID, без Blob и
архивации в JavaScript. UI не утверждает, что файл записан на диск. Поля API
строго проверяются; ответ со сторонним download URL отклоняется.

## Точный экземпляр

- Bundle: `/tmp/somewhere-album-web-ui04-20261029`, 253 файла, SHA256 каждого в
  `bundle-files.json`. Это demo QA, не production/release identity.
- Source: MAIN c621b98d плюс перечисленные в `owned-files.json` изменения;
  полный web source + тесты/контракт/API fixture — `source-files.json`.
- Стенд: https://127.0.0.1:8475, `TestBrowserFixture` с настоящим albumexport
  manager, memory.Store, test-only OAuth; process session 86479.
- Свои 103 PNG и пустая встреча: `fixture.json`. Вход «Саша» в тестовом provider.
  Тестовая сессия при необходимости — `/tmp/somewhere-album-review-session.json`
  с mode 0600; не копировать в Git/evidence.

## Результаты

- Общий web:check PASS: типы, ESLint, CSS, FSD/AST, Prettier, 211 unit в 48 файлах.
- Новое покрытие foundation: 26 unit/integration; API adapter integration
  использует mocked fetch, не объявляется реальным HTTP.
- Локальная Vite demo-сборка PASS, прежнее предупреждение большого chunk сохранено.
- `59-album-download.spec.ts` + `60-album-download-access.spec.ts`: 12/12 PASS
  Chromium desktop и mobile WebKit, 45.1 с. Оба файла входят в штатный CI config.

Фактически получены native downloads корректных ZIP 103 фото при 503 второй страницы
списка; проверены unique safe names, ZIP Store, CRC и SHA256 каждой серверной
фотографии, сохранение индекса и отсутствие fetch/XHR для download. На 320
подтверждены равные соседние кнопки и неизменная геометрия во время подготовки.
Проверены cancel→DELETE 404, error/retry, empty, уход до handoff→cleanup,
уход после handoff→целый ZIP без DELETE, реальный отзыв RSVP 403 и logout 401
без выдачи фотографий.

## Сохранённые промежуточные ошибки

`e2e-iteration02.log`: 2 setup failure из-за revision после присоединения гостя.
API возвращал 409; helper теперь запрашивает актуальную revision перед переводом
встречи в прошедшие. Product/assertions не ослаблялись.

`e2e-iteration03.log`: 2 failure диагностического ожидания page.route на download.
Native browser download этот route не вызывал, при этом файл скачивался.
Неподдерживаемый interception gate убран; итоговый тест проверяет наблюдаемые
handoff, уход, отсутствие DELETE и реальный целый архив. Он не моделирует
медленную 1 ГиБ передачу.

## Границы

Это авторские проверки. Независимые feature-test/design-review и gates ещё не
пройдены; 3.1 и выпуск не закрыты. Реальные Safari/iPhone/Android, 1 ГиБ архив,
EXIF-фото и недоступность системного каталога в новом web E2E не проверены.
Фото fixture — 103 различных малых PNG; совпадение серверных bytes подтверждено.

Изменения CI 52/39 не входят в этот flow: Linux touch проблема расследуется
отдельно, полный Web CI ещё не объявляется зелёным. Пользовательские серверы 8445
и 8466 не перезапускались, production не изменён. Старые web приемки и QA receipt
не переносятся на новый UI. Исторический foundation receipt относится к слою
до добавления hook/UI и уточнения передачи владения браузеру.
