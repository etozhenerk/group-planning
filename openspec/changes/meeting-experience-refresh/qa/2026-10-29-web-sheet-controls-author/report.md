# Авторская проверка web16.1 и ошибки диапазона реакций

Статус: адресные авторские проверки прошли; независимая и полная ручная приёмка не завершена. Production не менялся.

## Реализация

- Мобильный Dialog без X: доступная ручка, swipe/keyboard dismiss. Desktop X сохранён. Короткий drag возвращается; успешный exit сохраняет текущий transform/backdrop. Busy-action блокирует dismiss; dirty guard может оставить исходный dialog с возвратом в исходное положение.
- Readers резервируют189px (3×55+2×12) и ограничиваются доступной высотой. Loading/empty/error/list/pagination не меняют геометрию.
- Постоянный12px слот metadata; до2000ms нет индикатора/AX-объявления, далее spinner. Queued→sending не сбрасывает отсчёт; ACK сохраняет DOM/key/height. Ошибки и повтор сохранены.
- Подтверждённые реакции/receipts сохраняются в одном ограниченном snapshot текущего приватного scope. Ошибка нового GET не удаляет подтверждённые chips и не превращается в success. Scope/epoch/stream/denied guards не позволяют переносить чужие данные.

## Доказательства

`verification.json` и source/bundle inventories описывают точные файлы author08. Это demo-кандидат, не rc11 и не формальный receipt.

Full web:check —185 unit PASS, TypeScript/ESLint/CSS/architecture/Prettier PASS. Новые55/56/57 —12 PASS. GET58 —2 PASS, сохранённый chip1, ошибок React0, запросов2/1. Прежний аварийный45 WebKit844×390 —12/12 PASS.

На author07 прежняя регрессия дала32 PASS;2 остановки38 были неверным read_state=true объединённого harness вместо штатногоfalse. Повтор38 с правильным capability дал2 PASS, без изменения тестового ожидания. После единственного delta08 (error snapshot) повторены58,45 и новые состояния.

До snapshot fix Chromium создавал161 GET за750ms, а error/retry исчезал. WebKit терял chip. Исходные trace сохранены в before-get-error-*. После исправления retry проверяется настоящим Enter с focus preventScroll: pointer automation сначала прокручивала к нижней ошибке и инициировала другой GET раньше click.

## Границы

WebKit repository tests не доказывают физический Safari touch. Chromium жесты55 выполняются trusted CDP touch; WebKit — pointer path. Mac locked: полного живого/дизайн-прохода нет. Требуется новый точный production artifact rc11 и независимая проверка. rc9/rc10 остаются rejected.
