# Контракт реализации дизайн-пакета

25.10.2026: пользователь поручил реализовать весь пакет на web/iOS/Android.
Этот документ фиксирует согласование между реализациями; машинный контракт
остаётся в `contracts/openapi.yaml`. Все пути ниже имеют префикс `/api/v1`.
Деплой не входит в текущую работу. Сервер сохраняет cookie/CSRF и native Bearer.
Ошибки используют прежний envelope. Неизвестные дополнительные поля допускаются
клиентами; старые обязательные поля не удаляются.

## Визуальный критерий приёмки

Прямое уточнение пользователя от 25.10.2026: web, iOS и Android должны совпадать
с утверждённым дизайном 1 в 1. Нативная реализация не означает замену композиции
стандартным оформлением SwiftUI/Material. Все экраны повторно сопоставляются
с `assets/` на соответствующем viewport: геометрия, типографика, цвета, иконки,
отступы, навигация, состояния. `mobile-*.html` — iframe-обёртки; источники экранов
и окончательный каскад `styles.css` являются эталоном. Эталон не меняется ради
совпадения приложения. Успешные сборки и тесты не заменяют визуальную проверку.

## Профиль и встречи

- `GET /me/profile` → `{id, display_name, avatar_url, email, phone, provider, login, first_name, last_name, birthday, sex}`.
  Дополнительные поля nullable; provider = `yandex`. Только владелец видит личные данные.
  Новые поля необязательны для совместимости со старым сервером. birthday — строка
  YYYY-MM-DD с возможными нулевыми компонентами; sex — male/female/null.
- Публичный пользователь: `{id, display_name, avatar_url?}`. `avatar_url`
  nullable; отсутствие обрабатывается инициалами. Контактов здесь нет.
- MeetingSummary добавляет необязательные `period` (`upcoming|past|undated`, сохранённый сервером статус),
  `organizer_id`, `participant_preview`
  (до трёх публичных пользователей), `memory_photo_count`, `memory_preview`
  (до трёх media). Превью приватных участников/медиа только при текущем доступе
  к чату, не в анонимном приглашении и не при ответе «Возможно».
- Public invitation добавляет `join_closes_at: string|null`, `can_join: bool`,
  `join_disabled_reason: string|null`. Причины `join_closed`, `meeting_past`.
  Текущий участник сохраняет доступ; серверная мутация после отсечки возвращает
  409 `join_closed`. Клиент обновляет состояние по серверному ответу/foreground.

Поля Яндекс ID читаются только при наличии в проверенном ответе провайдера.
Дополнительные OAuth scopes автоматически не запрашиваются; отсутствие
контакта/аватара не блокирует вход. Известные данные не стираются пропуском поля.

## Реакции

- `PUT /meetings/{meeting_id}/messages/{entry_id}/reactions` с JSON
  `{emoji, active: boolean}`, `Idempotency-Key`.
- Ответ `{entry_id, reactions: [{emoji, count, mine, users: [PublicUser]}]}`.
  users содержит только людей с текущим доступом, без контактов.
- `GET /meetings/{meeting_id}/reactions?entry_id=ID&entry_id=ID` →
  `{entries: [тот же объект]}`; максимум 50 entry IDs за запрос.
- Разрешены обычные сообщения, включая новые сообщения-вложения. Использовать
  установку active, а не неидемпотентную серверную операцию toggle.
- До отдельной переработки realtime клиенты сверяют реакции видимых сообщений
  одним batch-запросом в активном чате при открытии/возврате и вместе с текущим
  циклом обновлений. Не делать запрос на каждый пузырёк.

## Медиа

- `GET /meetings/{id}/media/limits` → `{max_photo_bytes, max_file_bytes,
  max_files, photo_types, file_types}`. Начальные ограничения: 10 MiB на фото,
  20 MiB на файл, 10 элементов выбора; фото JPEG/PNG/WebP, файлы PDF/plain text/ZIP
  и перечисленные форматы фото. HEIC из системного picker преобразуется в JPEG
  до отправки; неизвестный формат не обещается поддержанным.
- `POST /meetings/{id}/media/uploads`, Idempotency-Key, JSON
  `{client_request_id, file_name, content_type, size_bytes, purpose}`.
  purpose = `message` либо `memory`. Ответ `{media: Media}`.
- `PUT /meetings/{id}/media/{media_id}/content`: бинарное тело с Content-Type;
  ответ `{media: Media}`. Повтор идентичных bytes безопасен; другое содержимое
  после успешной загрузки не заменяет готовый файл.
- `POST /meetings/{id}/media/{media_id}/publish`, Idempotency-Key,
  `{caption?: string}` →
  `{media: Media, entry: FeedEntry|null}`. Для memory — null, для message —
  одна серверная запись. Потерянный ответ повторяется с теми же ID/ключами.
- `GET /meetings/{id}/media/{media_id}/content` выдаёт готовые bytes после
  проверки доступа. Все download/thumbnail URL относительны к API origin,
  требуют текущую сессию; не передавать Bearer сторонним URL.
- `GET /meetings/{id}/memories?cursor=...&limit=50` →
  `{photos: [Media], next_cursor: string|null}`. Устойчивый порядок добавления;
  purpose memory доступен для прошедшей встречи, только текущим участникам.

`Media` = `{id, meeting_id, file_name, content_type, size_bytes,
kind: photo|file, purpose: message|memory, status: pending|uploaded|published,
download_url: string|null, thumbnail_url: string|null, created_at, uploaded_by}`.
uploaded_by — публичный пользователь. До публикации URLs null.
Первая локальная реализация может отдавать защищённое фото по одному URL
для preview/original; production-миниатюры и квоты проверяются до выпуска.

Сообщение-вложение сохраняет `kind: message`, `payload_version: 1`,
`payload: {text: "Фото" либо подпись/имя файла, attachments: [Media]}`.
Необязательный `caption` — только для документа (`kind=file`, `purpose=message`),
до 2000 Unicode-символов после удаления внешних пробелов. Пустое/отсутствующее
значение сохраняет прежний текст с именем файла. Непустая подпись фото — 422,
`field_errors.caption=not_allowed`; превышение длины — `invalid_length`.
После начала публикации тело и ключ сохраняются при повторе: тот же ключ
с другой подписью — 409 `idempotency_conflict`; новый ключ не позволяет изменить
уже опубликованную подпись — 409 `media_already_published`. `{}` совместимо
с прежними клиентами. Клиент выводит подпись и сам документ с его именем.
Старый клиент показывает текст; новый рисует файл/фото без повторения этого
технического текста. Поле attachments необязательное. Фото не публикуется
в альбом автоматически. Неудачные файлы повторяются по одному.

## Обращения

Публичный `POST /support/feedback`, Idempotency-Key, JSON:

```json
{
  "client_request_id": "UUID",
  "kind": "problem",
  "description": "Описание от 10 до 3000 символов",
  "screen": "meeting_chat",
  "email": null,
  "screenshot": null,
  "diagnostics": null
}
```

kind: `problem|idea|question`. screen:
`meetings|calendar|invitation|meeting_chat|profile|memories|sign_in|other`.
Необязательный screenshot: `{file_name, content_type, data_base64}`;
PNG/JPEG/WebP максимум 5 MiB после декодирования. Сервер проверяет изображение
и удаляет метаданные. Контакт не подставляется из профиля.
diagnostics: `{client_version, platform, os?, browser?, viewport?}`;
platform = `web|ios|android`, viewport = `{width,height}`. Передавать только
после явного включения, не добавлять query URL, чат, cookie или токены.

Ответ после записи: `{id, reference, status: "accepted"}`; reference вида
`SW-…`, не фиксированный номер из макета. Ошибка сохраняет ввод/изображение.
Ограничение частоты — 429; ошибка поля — 422 с field_errors.
Фоновая доставка/хранилище скриншотов остаются серверными, клиент не знает
бота или получателя. Локально mock, настоящая доставка — отдельная проверка.

`client_version` — до 80 символов, `os` — до 120, `browser` — до 512;
viewport — целые width/height от 1 до 16000. В локальной fixture endpoint
использует настоящий приём в memory.Store, без внешней отправки. При
PostgreSQL-режиме до реализации постоянной очереди endpoint возвращает 503.
Сохранённые приглашения дополнительно могут содержать `preview.organizer`
с публичными полями User; анонимный preview имени не раскрывает.

## Сведения о сервисе и границы выпуска

Версия каждого клиента берётся из его сборки, контакты/реквизиты не выдумываются.
Политика/cookie остаются явно обозначенными проектами до заполнения отложенных
пользователем сведений. Такой статус не считается готовностью публичного выпуска.
В этой работе не деплоить сервер/web и не публиковать мобильные приложения.

Последние решения пользователя: раскрываемую «Обложку» при создании сохраняем.
Футер — только десктопный web-онбординг (от 740 px), никаких футеров внутри
приложения, в мобильном web, iOS или Android. Это приоритетное уточнение к
старым HTML/PNG, а не разрешение менять прочие детали утверждённого дизайна.

## Пояснение предложенного места

`POST /meetings/{id}/place-polls` принимает необязательное `explanation` string,
trim, максимум 2000 Unicode-символов; null/нестроковое значение — 422.
Ответ PlacePoll добавляет optional nullable `explanation`, пустая строка → null.
Права и срок опроса прежние, текст доступен только участникам чата. Поле входит
в hash идемпотентности; отсутствие/пустое поле сохраняет старый hash. JSON-документ
place_polls сохраняет строку без SQL-миграции, завершение/отмена не стирают её.
