# Независимая проверка web · 5.0.0

Адресные browser focus-пути прошли на1280×720,390×844,320×740. Полный TC-CHAT-OUTSIDE-KEYBOARD остаётся blocked: touch long press недоступен в desktop IAB. Настоящая mobile OS IME не проверена.

Design:6 pass,3 needs-fixes,1 blocked. В многострочном composer обнаружено прежнее расхождение с raw: поле не растёт и скрывает часть draft (P2-WEB-COMPOSER-GROW, defect.md). Остальные118 экранов и общий design gate этим отчётом не покрыты.

Подтверждены: внешние click по фону/истории/шапке; сохранение draft и range9..20; первый click Send/плюс/emoji/header; по одной отправке на ширину; другие inputs; no-refocus после формы; замена selection emoji; explicit keyboard return; desktop Tab/Enter/Escape; wheel scroll; desktop right-click reactions. Mouse press700ms не является touch long press.

InputHash до/после: `70d23b247c66c02460ba6f6859b71d4df37013b28e59d1b1684ec01603905449`. Все253 файла frozen bundle неизменны и совпадают с авторским inventory. Его SHA256:119733f98f5ce7ae5ed8c7d0465f3f55b61bc801b8c4e45822669e6b2474056e. Root подтвердил freeze всех платформ до live прохода.

Приложение: https://127.0.0.1:8492/meetings/7857d0ed-fff2-415a-ac5d-91d167225731. Через UI создана своя встреча/8 history сообщений/3 Send checks. Исключительно синтетический memory fixture. Runtime/OS/шрифты/viewport/locale описаны в environment.json. Точная версия движка и browser Intl timezone не доступны через read-only wrapper; неизвестное не выдано за измеренное. Размеры viewport подтверждены DOM.

Картинки и действия: actual/, reference/, interactions.json; контроль hashes: checksums.json. Две ранние попытки mobile reference фактически были1280px из-за области viewport capability; они помечены viewport-attempt-*-actual1280 и не участвуют в verdict. Коррекция ошибочной подписи desktop mouse longpress сохранена в interaction log.

`design:check` прошёл. Авторские web:check (211unit) и targeted E2E(6) прочитаны после независимых действий, сохранены отдельно и не выданы за новый независимый запуск. Общий browser suite не перезапускался.

Cleanup: собственные рабочие tabs2–5 закрыты, viewport reset, composer draft очищен. Первоначальный error tab1 недоступен для close из-за URL policy(dataURL); временный tab закрывается app при завершении turn. Fixture не остановлен: root может сохранить для проверки или убрать собственный memory процесс после получения отчёта. Production и пользовательское демо не затронуты.
