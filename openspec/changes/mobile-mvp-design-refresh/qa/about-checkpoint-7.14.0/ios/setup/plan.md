# About / document reader iOS — готовность короткой проверки

Только read-only подготовка. Runtime/build/новый runner не запускались, pass не выставлен. Ожидается frozen candidate + явный handoff. Устройство свободно.

Authority: approved `about` и `documents` → about-r2; normalized about/documents; общий Back navigation-r2. UX: один бренд/описание, platform/version/build, единственная подпись Developed by MintyDev; без повторов документов/обращения. Карты и их юридический блок исключены пользователем. Числа0.1.0-rc.2/42 в raw — пример, не expected installed metadata. Текущий текст документов и «Проект документа» сохраняются; юридические обещания не придумываются. Cookie браузера не приписываются iOS.

Кейсы: `TC-MOBILE-ABOUT-METADATA`, `TC-MOBILE-DOCUMENT-READER` в mobile-interface.yaml; родственные native/service-page и draft-policy cases в service-information.yaml. Manifest account-service-ios секции about/documents. Полную матрицу manifest здесь не разворачиваем.

Короткий actual-проход после freeze:

1. Профиль → О приложении: compare raw, один знак слева/строчный бренд, одно описание/credit; реальный iOS и полная версия/сборка из frozen Info.plist. Нет duplicate разработчика, support/privacy/Cookie links и нижней home navigation. Back возвращает к исходному профилю/его scroll. Local/unavailable только если в предоставленном candidate/готовой fixture доступны — иначе limit, без пересборки продукта ради имитации.
2. Профиль → Конфиденциальность: полный текст + проект, fixed верхняя полоса Back/Содержание. Записать anchor/frame до/после scroll: bar не движется, body отдельный scroll. Открыть TOC → отменить native dismiss/Back: положение чтения прежнее; открыть → выбрать поздний раздел: sheet закрыт, соответствующий heading достижим/не перекрыт bar.
3. По существующей перекрёстной ссылке privacy→Cookie: scroll→Back восстанавливает privacy anchor; самостоятельный Cookie из профиля возвращает в профиль. Только существующие утверждённые ссылки, без нового бизнес-флоу.
4. Один targeted large/compact sanity: sticky Back/TOC доступны, текст не обрезан/не растягивается sheet-анимацией. SettledGeometry: ≥4 samples/≥0.7с по body+bar+anchor, capture **до assertions**; при helper blocker один ограниченный retry и report/release.

Reuse: текущий temp-project `/private/tmp/invitation-ios-independent-7.4/frontend/ios`, `ChatSheetTestSupport.launch/reveal` (right-margin measured), `SettledGeometry`, `ExperienceScreenshot`. Не новый framework/transport. Existing canonical `SupportFormUITests/testServiceDocumentsReturnToProfileAtLargestText` и `DesignExperienceUITests/testHelpAndAboutMatchApprovedLayout` — база действий, не достаточная приёмка TOC/history. Исторический common-about — только пример сравнения, не pass нового кандидата.

Адаптации canonical selectors/ожиданий до runtime:

- Existing loop ищет кнопки «Конфиденциальность» и «Cookie», текущий ServiceDocument cookies имеет «Cookie и данные устройства». На fresh AX брать фактические принятные labels, не substring «Cookie» без проверки.
- Existing code ищет «Назад» и scroll-reveal Back; новый published Back — context accessibility label, sticky вне body. Не свайпать body ради fixed Back.
- Existing semver regex обязательна для всех запусков, но local/unavailable — честные текстовые состояния. Сравнивать значение с Info.plist exact frozen app; отсутствие build не превращать в0.
- Existing common-about тест подтверждает только одну строку somewhere/Версия; не проверяет отсутствие duplicate support links/credit и TOC/history. Будущий узкий QA overlay использует тот же runner/helper, без product/canonical edits.
- На baseline исходнике `ServiceInformationScreen.legacyDocument` ещё не имеет TOC/crosslinks/sticky Back, AboutPanel повторяет разработчика и support CTA. Это ожидаемая область предстоящего переноса, не runtime finding новой версии.

Готовые операции после handoff: проверить candidate file SHA и aggregate; подставить exact immutable mainApp в existing runner; отдельная memory fixture только при необходимости login (документы локальные); один выбранный QA method с SOMEWHERE_IOS_SKIP_VOICEOVER=1. Сохранить actual/actions/binding, завершить app, восстановить настройки/lock и release. Сейчас новых команд runtime не выполнялось. Финальные gates отдельно.
