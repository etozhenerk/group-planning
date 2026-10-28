# Возобновление web и общего сценария — 28 октября 2026

Статус: **in progress**, общий pass не заявлен. Текущий новый web-кандидат проверяет основной агент отдельно; результаты ниже относятся только к зафиксированному исходному артефакту.

## Точная база

- Исходный web HEAD `0fb96472`, приложение с изменениями `74d840f`, последующий test-only fix `fa8a25db`. Состав исходников: `source.json`.
- Замороженный demo file-map SHA-256: `7184e647c7fb1f6e5d6ef1933b45b2774aa0477650688e0eb4bbc96451758aab`; подробности `candidate.json`.
- После исправления test-only shared provider: backend test binary SHA-256 `488a342106ed41d75a3ff76fd264044dcb4cab74ffbbc105cb9275c469b012a2`; `candidate-final.json`, `fixture-source-final.json`.
- Независимая среда: TLS loopback8461, memory.Store, восемь тестовых профилей, realtime/read-state включены. Обращения сохраняются только в памяти, внешней отправки нет.
- Отдельный старый fault fixture8861: pending/error/retry; он не включает read-state и не доказывает WS/read-pagination.
- Пользовательский сервер8445 и его сборка не изменялись.

## Полный исходный web suite

1. `full-run01`:190 pass,2 fail,1 skip. Обе ошибки — отсутствующий в частичной frozen-копии tracked `boardgame.png`. Это дефект подготовки стенда; точный asset из HEAD добавлен, запись в `snapshot-fixture-correction.json`. Старые ошибки сохранены.
2. `full-results.json` / `full-run.log` (run02):189 pass,3 fail,1 skip. Две ошибки закрытия контекста — конфликт общего Playwright output с одновременно запущенным cross suite; cross runner теперь имеет отдельный output. Третья — удвоенный текст черновика в Chromium после reload/fill. Это не объявлено успешным полным прогоном.
3. Повтор исходного roster теста:2/2 pass (`roster-diagnostic.json`). Затем добавлено ожидание фактически восстановленного черновика перед заменой текста; assertions сохранены и усилены.
4. Roster Chromium/WebKit и отдельная ранняя печать до задержанного ответа IndexedDB:3/3 pass (`roster-and-early-typing.json`). Probe заменяет старый черновик другим текстом до восстановления и проверяет сохранение после reload. Исходник `draft-hydration-probe.ts`. Потеря раннего нового текста не воспроизведена; исходный failure не скрыт.
5. Первый диагностический probe ошибочно ожидал неиспользуемый WebCrypto decrypt и завершился timeout; это не тест продукта. Сохранён как `draft-hydration-probe-decrypt-unused.*`, исправлен probe задержки настоящего IDB read.

Полный suite после новых UI-правок root запускает отдельно. Pass этого старого артефакта не переносится на новый.

## Shared web / iOS / Android

- Исправлен доказанный test-only provider: шаблон ожидал Profiles, fixture передавал Sasha/Lena, поэтому выдавал незавершённую страницу без ссылок. Регрессия выполняет реальный шаблон и проверяет обе ссылки и закрывающий HTML. Before/after и targeted Go pass сохранены.
- Android fixture показывает последнюю часть чата; старые сообщения есть в API и штатно находятся `performScrollToNode`. Тест теперь явно прокручивает к ним, исходные проверки сообщений/вложений/реакций сохранены.
- После своей отправки из истории Android сохраняет позицию и показывает переход к новым сообщениям, как требует spec. Тест проверяет сохранение старого сообщения, нажимает переход и проверяет новый bubble. Production Android не менялся.
- Web после отказа iOS проверяет `403`, затем раскрывает полный состав и проверяет «Не смогу» у Лены; старое ожидание искало текст внутри свёрнутого блока.
- Cross run03: iOS join pass, Android pass; iOS withdraw не смог прокрутить к старому сообщению коротким центральным swipeDown. Video и xcresult сохранены локально.
- Cross run04: диагностический drag на краю вывел сообщение; это доказательство доступности, **не формальный pass** исходного сценария. Последующий web fail выявил свёрнутый roster.
- Cross run05: замена LongPressGesture на simultaneousGesture не устранила проблему. Экспериментальная продуктовая правка откачена. Причина прокрутки ещё исследуется.

Текущие сборки — QA/UITestHost, не store/release. Hash Android QA и инструментальных APK — `android-cross-test-candidate*.json`; соответствие native исходников до диагностики — `native-source-parity.json`. Сырые xcresult/trace с временными конфигурациями находятся в игнорируемом `.cache/qa/web-resume-private`, не предназначены для Git.

## Проверки обвязки

Targeted Go provider regression, gofumpt/wsl, Android QA test build+format, iOS UI build-for-testing+format, web targeted roster/early-typing, `agent:check` выполнены. Финальные native проверки и общий cross pass остаются открытыми. Коммитов и изменений production этот исполнитель не делал.

## Исправление iOS: подтверждение причины и результат

- Run06: обычный swipeDown, медленный swipeDown и drag по центру фото одинаково не двигали историю. Drag на краю ранее работал. Скорость XCTest-жеста не объясняет сбой.
- Run07: отключение только родительского long-press на вложениях позволяло исходному центральному swipeDown пройти. Это диагностическая сборка, не кандидат: реакции вложений нельзя отключать.
- Run08: UIKit long-press с совместным UIPan устранил scroll failure, общий сценарий прошёл. Однако ещё не проверялся hold самой кнопки фото.
- Run09: новая регрессия фото выявила приоритет tap над удержанием: открывался fullscreen. Падение сохранено, промежуточный кандидат не принят.
- Run10: long-press получает приоритет над не-pan распознавателями; UIPan разрешён одновременно. **Полный общий сценарий pass**, включая новое удержание фото → выбор 🔥 → подтверждённый chip → последующий обычный tap → fullscreen. Исходный центральный swipeDown, текстовые реакции, фото/файл/альбом, Android reply, web receipt и отзыв доступа iOS/403 также прошли.
- Изменены `MessageWithActions.swift`, новый небольшой `MessageLongPress.swift`; значения длительности/дистанции сохранены из DS. iOS18+ использует UIGestureRecognizerRepresentable, iOS17 — системный onLongPressGesture. На iOS17 живой проход не выполнялся.
- Format pass; unit164 теста в42 suites pass. Чистая simulator build/analyze **PASS**. Независимый повтор передан отдельному reviewer; до его результата UI-задача не закрыта.
- Точный iOS QA-кандидат run10: `ios-scroll-candidate.json`. Он не является подписанным store артефактом. Web run10 — промежуточный root frozen dist (`cross-final-web.json`); root после него исправляет ещё два web finding, поэтому финальный cross на новом dist остаётся открытым.

API распознавания: [Apple UIGestureRecognizerRepresentable](https://developer.apple.com/documentation/swiftui/uigesturerecognizerrepresentable). Передача приоритета tap и разрешение совместного pan подтверждены живым XCUITest, а не только чтением документации.

## Финальная передача

- MAIN `project.pbxproj` после форматирования Xcode синхронизирован в QA worktree; повторный build-for-testing **PASS**. 520 tracked/new исходников MAIN и build worktree совпадают (`ios-final-source-parity.json`). Игнорируемый Local.xcconfig обычного приложения в QA не используется.
- Frozen `/tmp/somewhere-web-resume-20261028/ios-products-main-final`: весь product file-map SHA `eeb8a3aafca883bb3c2fff2a50ed569735958de46c6935661a1a9952588b41ea`, побайтово совпадает с run10. `ios-main-candidate.json` фиксирует точный artifact.
- После последнего web freeze исходный dist7184e647 сохранён в `/tmp/somewhere-web-resume-20261028/.cache/web-demo-initial-7184e647`. 8461/8861 получили новый253-file dist без перезапуска memory API. HTTP200 и все33 initial assets проверены на обоих origin. File-map SHA `5240899862ff0321310b57bec14289aac77f5e9444ad597b6c640e5e8ab968c3`; `reviewer-final-dist.json`, `reviewer-final-http.json`.
- Независимый web reviewer получил обновлённые стенды. Независимый native reviewer получил финальный QA artifact и проведёт общий cross на последнем webdist, отдельный live iOS проход и дополнительные жесты. Этот исполнитель не запускает дублирующий проход и не закрывает его за reviewer.
- `agent:check` повторно **PASS**, `git diff --check` **PASS**. Backend test-only provider исправления уже вошли в checkpoint основного агента; этот исполнитель сам ничего не коммитил и не выкатывал.
