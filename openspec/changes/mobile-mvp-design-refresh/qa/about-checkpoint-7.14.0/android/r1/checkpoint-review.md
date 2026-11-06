# Android About/reader R1: короткий проход, needs-fixes

Frozen candidate и before/after binding совпали. APK
425247255c75f2e9cff1ac256faeb8a73d93439fd2f6d85e777fe274a2f58c51,
source d9f335a916e1527d30111d7c267fb56a820e3f9008d5ceaf5ba13f04ec25aeb5.
TestAPK2bb1c1af98f94a8b9064aed275e5204f2a3d58450fae289c3c783fb188b51253.
emulator-5554,720×1600,density320,font1,animator1; isolated memory API127.0.0.1:64284.

## Результаты действий

- Canonical actualBuildAndDocumentsReturnToTheProfile4.927s: реальные
  BuildConfig0.1.0/1 и возврат privacy прошли; весь test **failed** на Cookie
  entry: ищет reader title «Cookie и данные браузера» в профиле с approved
  коротким «Cookie». Исправить только locator profile entry, сохранить real
  metadata и selected-profile assertions. canonical.log/evidence/.
- Manual About actual: один lockup, описание, Android/0.1.0/1, один
  Developed by MintyDev, без дублей support/document links, карт и нижней nav.
  Просмотрены about-ready.png и corrected about-reference.png. Raw0.1.0-rc.2/42
  не подставлялись в клиент; unavailable/local metadata branches не принимались.
- Privacy real scroll: Back/«Содержание» сохранили bounds, прокручивается body.
  TOC7native секций; Back cancel сохранил точные text/bounds; явный выбор
  последнего заголовка закрыл sheet и показал раздел. На конце документа
  heading не обязан выровняться с верхом, когда достигнут maxScroll.
- Privacy→cookies crosslink: TOC8native секций. После закрытия sheet и отдельного
  settled system Back восстановились точные privacy text/bounds/scroll. Первый
  опыт с двумя соседними Back перекрыл hide animation; он сохранён как
  privacy-crosslink-return, но не объявлен дефектом. Подтверждённый результат —
  privacy-crosslink-settled-return и запись actions.json.
- Один compact320×568/font1.3/animator0 spot: bar доступен, TOC прокручивается,
  последний пункт виден и выбирается, большой heading/абзац читаемы. Просмотрены
  toc-320-large-scrolled и privacy-320-large-jump actual. Это не полный RM/matrix.
- Существующий legal_strings.xml не менялся в diff; native paragraphs/7+8секций
  сохранены. Их отличия от browser raw намеренно не классифицируются как UI bug.

## Замечания одной пачкой

1. DocumentStatus glyph — actual ChatSymbol.Task/checkmark, raw FilePenLine18.
   privacy-ready.png vs privacy-reference.png; сменить на правильный glyph.
2. About metadata13/20 не задаёт lineHeight20: actual строки около55.5dp вместо
   raw53, Text наследует native22.5sp. Status title12/18 также наследует22.5sp:
   actual status≈100.5dp против raw95. Нужны явные опубликованные20/18sp;
   native system font/переносы разрешены, отсутствующий lineHeight — иной вопрос.
3. Canonical Cookie entry locator — исправление обвязки, описано выше.

Approved reference served узким собственным tmp server. Первоначально не был
скопирован about-r2/somewhere.svg, поэтому первый brand reference broken;
approved asset добавлен в tmp и about-reference.png переснят с успешным decode.
Ревьюер не менял raw эталон/стили. TOC reference отдельно privacy-index-reference.

## Release и пределы

QA-only изменения; приложение/тесты/кейсы/токены не редактировались. App остановлен,
исходные size/font/animator восстановлены, source/device освобождены для batch.
Актуальные full gates не запускались, pass всему экрану/платформе не выдавался.
Support-origin history return, полный large/RM/focus matrix остаются финальному
проходу. Maps/desktop/VoiceOver/TalkBack исключены.
