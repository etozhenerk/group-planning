# 3.3 — сохранение альбома Android

03.11.2026, основной агент. Только emulator-5554, Android 16/API36,
720×1600/density2, 360×800dp, отдельный somewhere QA, локальный Go memory API.

- `sh scripts/test-ui.sh album-download`: **5/5 PASS, 18.192s**.
  Три полных UI-пути: сохранить все оригиналы с индекса 2/3, отменить/уйти
  из подготовки без новых фото даже после позднего ответа, ошибка сети и повтор.
  Два component-пути: 320dp/fontScale1 и1.8, равные соседние кнопки,
  preparing/saving, доступные действия и пустой альбом.
- Gallery сверяется через настоящий ContentResolver: после каждого из двух
  успешных сохранений ровно три новых собственных URI, IS_PENDING=0,
  SHA256 каждого совпадает с оригинальным сетевым snapshot. Контроль не основан
  на одной надписи «Фотографии сохранены». Cleanup удаляет только новые QA URI
  в своём Pictures/somewhere относительно baseline.
- Дополнительный адресный instrumentation: AlbumGalleryDeviceTests и
  AlbumDiscardRecoveryDeviceTests — **5/5 PASS, 0.187s**. Реальные pending rows,
  publish с исходными JPEG/EXIF, сохранность опубликованных копий после discard;
  потерянный insert reply, ошибка query и неполный delete сохраняют журнал
  для восстановления и освобождают lock.
- Исторические независимые lost-insert проверки 8/8 не перезапускались:
  все 14/14 проверенных product inputs побайтово совпадают с текущими.
  Они включают сохранность чужих/опубликованных записей, idempotent recovery
  и блокировку живой операции. Исходный FAIL и исправленный PASS сохранены.
- Текущие обязательные check.sh/Debug/Release/Lint/197 unit выполнены 02.11;
  после них Android-код не менялся. Сегодня заново собраны/установлены только
  актуальные QA APK для адресного прохода.

Actual ready/preparing/cancelled/saved/error и component fontScale-снимки:
`frontend/android/app/build/outputs/ui/album-download-8969`.
Просмотрены ready/error: одна строка, правильные размеры и центр иконок,
стандартная «Назад», нет общего бренда/нижних вкладок. Error соответствует
опубликованному token; известная неоднозначность CSS старого HTML не скрывается.

Логи: `/tmp/somewhere-20261103-android-album.log`,
`/tmp/somewhere-20261103-android-gallery-device.log`.
Глобальные настройки/обычное приложение/другие устройства не менялись.
В capture animatorsEnabled=false: этот результат не является проверкой
нормальных анимаций; fontScale1.8 — компонентная проверка, не системный шрифт.
API26–28 не выдаётся за проверенный runtime; pending recovery применяется API29+.
Проверка выполнена основным агентом по решению пользователя, общий независимый
qa:ready/design:ready и release-ready PASS не заявляется. Выпусков и Telegram нет.
