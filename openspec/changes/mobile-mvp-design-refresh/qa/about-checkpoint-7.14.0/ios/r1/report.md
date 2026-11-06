# About / document reader iOS R1 — независимый checkpoint

Вердикт: **pass в выполненном коротком объёме**, не финальный design/feature gate. Один реальный UI-flow `testAboutAndDocumentHistory` — 77.307 с, TEST EXECUTE SUCCEEDED. Новый runner/framework не создавался: один QA driver поверх существующей обвязки. Приложение/канонические тесты/кейсы/tasks не менялись.

Frozen artifact `7665f9ac0db08aa695ee5de15ae2dfcfcda5e38869c2a1a11520533ef3140699`, source `0b5cbd443280cfacc927b9019cb18dafc049140244525c11c2caca4c8d3a55aa`, input `4274fa8f3e7105f576ae524cc9dca1f7d4550e0781bd3df11917e761416fe81b`. Все20файлов проверены до и после exact frozen mainApp подстановки ([binding](artifact-binding.json)). Info.plist [metadata](metadata-expectation.json): iOS, версия0.1.0, build1; эти же фактические значения видны.

Authority: approved about-r2 + navigation-r2, normalized about/documents, UX, account-service-ios; кейсы TC-MOBILE-ABOUT-METADATA и TC-MOBILE-DOCUMENT-READER. Raw-номера0.1.0-rc.2/42 остаются примером. Исходная setup-пометка о Cookie selector уточнена: профильный label действительно «Cookie», несмотря на отдельный ServiceDocument.title. Новый accepted UI не требует возвращать прежние selectors.

Результаты:

- [About402](actual/about-normal.png) просмотрен по raw-композиции: один знак слева/строчный somewhere, одно описание, metadata card, единственный Developed by MintyDev. Нет support/privacy/Cookie повторов, карт или домашней нижней навигации; Back возвращает в профиль.
- [Privacy top](actual/privacy-top.png), [reading](actual/privacy-reading.png): отдельная прокрутка body, Back/Содержание остаются на y76.17. Полный существующий native текст и пометка проекта сохранены; native ServiceDocument.swift byte-SHA совпал с read-only setup ([proof](native-document-copy-proof.json)), новые юридические обещания не добавлены.
- [TOC open](actual/toc-open.png) → native swipe cancel: панель закрыта, anchor y373→373 и верхняя полоса без смещения ([facts](actual/toc-cancel-facts.json)). Выбор «Хранение и ваши права» закрывает TOC, показывает нужный заголовок и перекрёстную ссылку ([selected](actual/toc-selected.png)); документ у нижней границы scroll, поэтому поздний заголовок не обязан стать вверху.
- [Privacy→Cookie](actual/cookies-top.png), прокрутка Cookie, Back: исходная позиция privacy y572.67→572.67, delta0 ([facts](actual/crosslink-return-facts.json), [actual](actual/crosslink-return.png)). Повторный Back вернул профиль.
- [Compact large body](actual/privacy-compact-large.png), [TOC](actual/toc-compact-large.png): реальное QA-окно320×568 на физическом Simulator402×874, accessibility5; Back/TOC доступны, видимые текст/строки не обрезаны, body/TOC представлены отдельными scroll-контейнерами; их полный large-scroll здесь не проходился. «Содержание» переносится на две строки при таком размере текста. Граница QA-window/physical-screen явно сохранена в sidecars.

Все actual captures выполнялись после SettledGeometry (≥4stable samples/≥0.7с) и до assertions. Сохранены AX, measuredframes, environment и [действия/лог](about-independent.log); screenshot-only pass не используется. Существенных новых расхождений в выполненном scope не выявлено.

Ограничения: local/unavailable metadata, отдельный reduced-motion проход (фактически false), landscape, большая полная матрица manifest и финальные gates не проверялись. Большой текст проверен в одной compact-конфигурации; юридическая полнота текста не утверждается. VoiceOver не запускался/не проверялся. Исторические pass не переносились.

Own memory fixture остановлена, приложение завершено, software keyboard восстановлен1, simulator lock освобождён ([cleanup](cleanup.json)). Source/device свободны.
