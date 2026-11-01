# Совместный actual recovery контроль · 01.11.2026

Независимый UI исполнитель `/root/sdd_clients_audit`; QA-only epoch/identity
control подготовил `/root/sdd_server_audit`, root независимо прочитал и разрешил.
Это дополнительные actual действия TC-CHAT-SYNC-F6CFB5E9, не новый полный suite,
не самостоятельное принятие всей chat4.3 или серверной фичи.

Точный web source949d24adef114fbca61f95bcec11df6278968e373c0ecc1a5e158bc8b24ff2e2,
artifact inventoryc3d07e3910c9b29c689f9d25b1406162d4fd3fa551e75cd8939b27429556171a,
catalog84856. Own8537 TLS memory, Chromium156.0.8078.4, ru-RU/Europe/Moscow,
1440×900 и390×900. Тот же253-file bundle. QA-only binary SHA256
e91e58687719007636f63423a85a973372b20dd220d5f6c0eb390818ac70f59f;
fixture source/control recipe и inventory сохранены в harness.zip, без control
token, cookie, CSRF или signing keys. MAIN/backend production source не менялся.
Оба feature плана существовали до этих будущих действий; ссылки сохраняются
в соответствующих canonical приёмках, timestamps не переписываются.

## Исполненные действия

1. Созданы180 реальных разновысотных сообщений. Открыт history viewport; GET
   предыдущей страницы реально выполнился при epochA, его200 body удержан до
   browser delivery. В нём есть записи вне будущего bounded snapshotB.
2. Через настоящий UI отправлен pending текст; POST удержан до server commit.
   Проверен реальный IndexedDB intent с тем же idempotency key, затем введён
   новый черновик. Сохранены ID видимой строки и её offset относительно viewport.
3. Одобренный control атомарно меняет только memory stream epochA→B с old-guard.
   Старый подписанный cursor действительно возвращает410 sync_reset_required.
   Обычный отдельный API message вызывает реальный server hint; приложение
   получает собственный410 и делает разрешённый snapshotB с around_entry_id
   сохранённой строки. Ответы410/snapshot не подменены.
4. ID/offset якоря сохранены в пределах2 CSS px. Pending intent и новый draft
   остаются в настоящем IndexedDB, textarea содержит новый draft.
5. Только после snapshotB отпущен старый history response. На обеих ширинах
   route.fulfill успешен, requestfinished зарегистрирован послеB, requestfailed
   отсутствует. Полностью совпадают data-server-count/window-first/window-last;
   anchor после позднего ответа не сдвинут. Это подтверждает fence старого окна.
6. Отпущен pending POST: один canonical message, тот же key всех попыток,
   durable intent удалён после подтверждения; новый draft не потерян.

[Исправленный targeted run](epoch-ui-delivered.log): **2/2 PASS**, без offline
и без изменения product assertions/таймаутов. Raw [1440](evidence/epoch-ui-1440.json)
и [390](evidence/epoch-ui-390.json), PNG до ACK сохранены рядом.

Поздний запрос — настоящий HISTORY, полученный при старом server epoch;
feed DTO не содержит stream_epoch. Это **не** доказательство обработки отдельного
sync DTO с искусственно изменённым epoch. Переноса чужих source PASS нет.

## Исходный контроль и уточнение

Первая адресная серия тоже получила2 PASS, но её catch ставил finished даже при
ошибке fulfill, а offline мог заранее отменить запрос. Независимый peer нашёл эту
причинную неоднозначность; по ней старый вывод о window-guard не принимался.
Исходная серия, её exact test/raw/PNG сохранены в initial-ambiguous внутри ZIP.
Повтор использует обычный server hint и требует успешной доставки позднего
ответа послеB. Никакое приложение или ожидание геометрии ради PASS не менялось.

Отдельные malformed cursor/401/403/404 и остальные F6/transport steps привязываются
к собственным current результатам, а не объявляются проверенными этим сценарием.
Own fixture остаётся для согласованного теста expiry; контексты/routes закрыты.
