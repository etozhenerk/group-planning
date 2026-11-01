# Read-only SDD аудит клиентов и авторизации · 01.11.2026

Репозиторий: `/Users/misha/Documents/Codex/projects/group-planning`, `main...origin/main`.
Область: клиентские задачи `meeting-experience-refresh`, `vibe-album-download`, `account-deletion`, открытые client/auth пункты `gathering-activity-feed`.
Продукт, Git, CI, облако и документы репозитория не изменялись; тесты не запускались.
Прочитаны AGENTS/startup, task lists, актуальные/последующие отчёты, соответствующие требования и адресные исходники. Использованы принципы `openspec-verify-change`; это аудит сохранённых evidence, не новая независимая функциональная/визуальная приёмка.

В разделах конкретного change сокращённые пути evidence считаются относительно openspec/changes/<change>/; frontend/... и docs/... — относительно корня репозитория. Переход ../ ведёт к соседнему change. Исторический PASS означает только исходный scope/hash. В текущем дереве много untracked QA evidence; наличие такого evidence на диске не означает, что оно уже зафиксировано в Git.

## Главный вывод

Открытые checkbox массово смешивают уже написанную функцию с ещё незавершёнными `feature-test`/`design-review`/`qa:ready`/`design:ready`. Нельзя представлять их как десятки ненаписанных экранов. Но и отмечать весь объединённый пункт `[x]` на основании реализации нельзя: действующие правила требуют приёмки.

Реально подтверждённый незакрытый продуктовый дефект клиента: **P2-WEB-COMPOSER-GROW**, многострочный composer не растёт и скрывает часть черновика. Остальной основной остаток в проверенных клиентах — матрица приёмки, доступность, реальные auth/deep-link сценарии и точные native кандидаты/выпуски. Старые Android pending insert/readers bugs уже исправлены и независимо перепроверены.

Владелец **принял дизайн 5.0.0 и разрешил web rc15**, он действительно выпущен. Повторное согласование дизайна и новый выпуск того же outside-keyboard исправления не нужны. Это отдельный факт, не независимый QA PASS. Удаление аккаунта должно оставаться скрытым; push отложены. Новая экранная клавиатура проверялась настоящей native IME в симуляторе/эмуляторе, не на физическом телефоне.

## done-with-evidence

| Change / ID или подрезультат | Что действительно сделано | Evidence |
| --- | --- | --- |
| meeting 1.1 | Дизайн согласован; поздняя 5.0.0 также принята владельцем | `tasks.md`, `design-publication-5.0.0.md`; `../deployment-and-store-release/qa/2026-10-29-web-rc15-tagged-deployment/{report.md,owner-decision.json,owner-exception.json}` |
| meeting 2.7 | Уже отмеченная серверная документация/инженерные проверки; не client QA | `tasks.md` |
| meeting 7.3, web-часть; 17.1, выпуск-часть | Точный web rc15 установлен; Component releases SUCCESS, 242 JS/CSS совпали с опубликованным архивом; backend rc6 | `../deployment-and-store-release/qa/2026-10-29-web-rc15-tagged-deployment/{report.md,public-smoke.json}` |
| vibe 1.1, подготовка/публикация | UX и опубликованная дизайн-система 4.1.0/4.1.1, manifests/testing подготовлены; старый текст «не согласован» в разделе паузы устарел | `design-publication-4.1.0.md`, `qa/2026-10-29-design-publication/report.md`, `qa/2026-10-29-web-actions-row-publication/report.md` |
| vibe 3.3, исправление pending insert | Потерянный URI insert больше не теряет recovery intent; независимый повтор 8/8 | `qa/2026-10-29-android-lost-insert-fix/report.md`, `qa/2026-10-29-android-lost-insert-independent/report.md` |
| account 1.1,1.2,2.1–2.4,4.1,5.1 | Уже отмеченные контракт/сервер/защищённое клиентское хранение реально реализованы; сохраняются при скрытии входа | `verification.md`; `frontend/ios/Somewhere/State/SessionStore.swift`; Android `data/session/AccountDeletionRepository.kt`; web `features/delete-account/model/useDeletion.ts` |
| account, требование скрытия входа (части meeting 11.1–11.3) | В current профилях трёх клиентов нет действия удаления; сам механизм сохранён | `specs/account-lifecycle/spec.md`; web `pages/profile/ui/ProfileView/ProfileView.tsx`; iOS `Features/Profile/ProfileScreen.swift`; Android `ui/profile/ProfileScreen.kt` |
| gathering 5.3/6.3/7.3, реализация auth | Web OAuth, iOS LoginSDK3.2.0, Android LoginSDK3.1.3, server SDK exchange и хранение попытки написаны; реальный onboarding-вход native подтверждал пользователь | `auth-native-verification.md`, `auth-web-verification.md`, `production-client-verification.md` |

Это выполненные подрезультаты. Объединённые checkbox с обязательным current QA остаются открытыми до отдельного gates результата либо честного разбиения implementation/acceptance.

## implementation-done-acceptance-missing

### meeting-experience-refresh

| ID | Статус реализации и конкретный недостающий объём | Evidence |
| --- | --- | --- |
| 0.1,0.2,0.4 | Bottom sheets/desktop modal, компактные сведения без сервисного футера и очищенный native onboarding реализованы; новая полная матрица UX и независимая приёмка не завершены | `qa/2026-10-28-web-final-independent/report.md`, `qa/2026-10-28-ios-final-independent/report.md`, `qa/2026-10-28-android-polish-summary.md`, `qa/2026-10-29-ios-current-live/report.md` |
| 0.3 | Это сама оставшаяся приёмка, не функция. В manifest сотни состояний, нет общего current PASS | `design-manifest.json`, `design-review-5.0.0.json` |
| 1.2,1.3 | Реальные прототипы/публикации, copy/design review artifacts существуют; полный свежий проход текущей 5.0.0 не завершён. Ссылки на необходимость проверить старый raw2.0.0 не должны принуждать возвращать прошлый дизайн | `assets/revisions/`, `copy-review.md`, `design-verification.md`, `design-publication-5.0.0.md` |
| 4.1–4.4,4.7 | Навигация/создание→чат/карточки/RSVP cut-off/профили реализованы; свежий весь функциональный+визуальный scope на всех требуемых размерах отсутствует | `qa/2026-10-28-web-final-independent/report.md`, `qa/2026-10-27-telegram-chat-1.4.1-r2/backend-reviewer-report.md` и current web code |
| 4.5,4.6,4.8,4.9 | Composer/emoji/reactions/media/vibes написаны; обязательная UI-приёмка не завершена. У 4.5 дополнительно реальный composer-grow defect ниже | `qa/2026-10-29-web-ci-independent/live-resume-3/report.md`, `qa/2026-10-29-web-rc11-independent/report.md`, `qa/2026-10-29-keyboard-outside-web-independent/report.md` |
| 5.1–5.5 | Native iOS навигация, cut-off, composer/actions, профили/альбомы существуют; нужны полный актуальный scope, Accessibility/VoiceOver, большие размеры/ориентация, точные missing media states. Build не является отсутствующей функцией | `qa/2026-10-28-ios-final-independent/report.md`, `qa/2026-10-29-ios-current-live/report.md`, `qa/2026-10-29-ios-sheet-independent/report.md` |
| 6.1–6.5 | Android реализация и обязательные инженерные проверки есть; полный current visual/functional gate отсутствует | `qa/2026-10-28-android-polish-summary.md`, `qa/2026-10-29-android-sheet-checkpoint.md` |
| 7.1 | Совместимость реализуется существующим контрактом и проверялась частями; полный свежий web→iOS→Android + поддерживаемые прежние сборки не завершён | `../gathering-activity-feed/cross-platform-verification.md`, `resume-verification.md`, `next-session.md` |
| 8.4–8.7 | Формы support, help/about/docs, корректный доступ из профиля и платформенный UI существуют; полная accessibility/UX и current acceptance остаются | `qa/2026-10-28-web-final-independent/report.md`, `qa/2026-10-29-ios-current-live/report.md`, `qa/2026-10-28-android-polish-summary.md` |
| 9.1–9.5 | Web форма до OS picker, сохранение draft/selection/cancel, карусель/batch, fullscreen contain, preload и click/drag реализованы; независимые live проверки частичные. Не переписывать эти функции как отсутствующие | `qa/2026-10-29-web-ci-independent/live-resume-3/report.md`, `qa/2026-10-28-web-media-independent/report.md`, `qa/2026-10-28-web-viewer-return-author/report.md` |
| 10.1,10.2 | Native picker-first/direct Share, карусель/remove/batch/dismiss, swipe/tap/preload/empty invite, iOS PDF/back реализованы | `qa/2026-10-29-ios-current-live/report.md` (13 XCUITest), `qa/2026-10-28-android-polish-summary.md` |
| 10.3,10.4 | Оставшаяся приёмка написанных путей: настоящий второй участник-получатель PDF, partial batch/failure retention, snapshot/EXIF/mixed/delayed, photo-avatar ACK вместо буквенного fixture и весь case scope | те же отчёты; не выдавать simulator PDF→свою ленту за реальную доставку второму участнику |
| 11.1–11.3 | Общие поверхности, logout bottom, hide delete/version, About и cover исправлены; матрица current приёмки не закрыта | current ProfileView/ProfileScreen.swift/ProfileScreen.kt; `qa/2026-10-28-*-final-independent/report.md`, `qa/2026-10-28-android-polish-summary.md` |
| 12.1,12.2 | iOS свайпы/компактное preview/support keyboard и validation исправлены; live simulator13 PASS включает support, PDF, back, swipe. Остались mixed/EXIF, вся доступность/приёмка и физическое устройство в заявленном scope | `qa/2026-10-29-ios-current-live/report.md`, `qa/2026-10-28-ios-native-usability-followup/report.md` |
| 14.1 | Android Back/media EXIF/размеры/support IME исправлены и адресно независимо проверены; полный gate открыт | `qa/2026-10-28-android-polish-summary.md` |
| 15.1 | Pointer focus, touch swipe и лишний outline после fullscreen исправлялись и выпущены; независимый desktop live подтверждает отсутствие рамки и drag cycle. Полный настоящий mobile touch/IME/keyboard/AT scope не закрыт | `qa/2026-10-28-production-owner-release/rc8-summary.md`, `qa/2026-10-29-web-ci-independent/live-resume-3/report.md` |
| 16.1 | Sheet no-X/no-refresh, readers stable viewport, pending timing реализованы; rc11 independent auto12+14+10 PASS, поздний live readers1→7 stable; вся ручная матрица не завершена | `qa/2026-10-29-web-rc11-independent/report.md`, `qa/2026-10-29-web-ci-independent/live-resume-3/report.md` |
| 16.2 | iOS sheets/readers/pending/emoji alignment написаны; независимые7 XCUITest и затем scoped13 PASS. Остались все panels/readers error/one/many/pagination, fast ACK/retry и accessibility | `qa/2026-10-29-ios-sheet-independent/report.md`, `qa/2026-10-29-ios-current-live/report.md` |
| 16.3 | Android то же; readers gap18→12 defect уже исправлен и независимый повтор7 PASS, pixel delta0/0/0 | `qa/2026-10-29-android-sheet-checkpoint.md`, `qa/2026-10-29-android-sheet-independent/followup-reader-spacing/report.md` |
| 17.1–17.3 | Outside click/tap blur реализован на всех платформах и адресно независимо проверен. Native настоящая IME, selection, Send/plus/emoji первым нажатием, scroll/longpress сохранены | `qa/2026-10-29-keyboard-outside-acceptance/report.md`, три `qa/2026-10-29-keyboard-outside-*-independent/report.md`; web release rc15 report |
| 17.4 | Остался полный current formal gate: scoped19 pass/3needs-fixes/2blocked не равен всему manifest. Не хватает mobile-web настоящей IME/touch, iOS отдельного actual возврата из формы и полного suites/run | `design-review-5.0.0.json`, `qa/2026-10-29-keyboard-outside-acceptance/report.md` |

### vibe-album-download

| ID | Статус | Evidence |
| --- | --- | --- |
| 1.1 | Подготовка сделана; формальная current приёмка не финализирована после последующих общих design revisions | `qa/2026-10-29-design-publication/report.md`, `qa/2026-10-29-web-actions-row-publication/report.md` |
| 2.1 | Backend уже реализован и узко прошёл independent feature-test/qa:ready; общий checkbox ждёт включения в общий manifest, не нового API-кода | `qa/backend-checkpoint-20261028.md` (подробности серверного audit отдельно) |
| 3.1 | Web native browser ZIP без Blob реализован, ZIP103 подтверждён, Chromium6/6 независимый, layout4.1.1 actual320/1024. Остались полный WebKit и manual state/access/snapshot/EXIF/large/TTLs/disk и current formal gates | `qa/2026-10-29-web-ui-independent/report.md`, `qa/2026-10-29-web-actions-row-independent/report.md`; `frontend/web/src/features/download-album/` |
| 3.2 | iOS полный UI уже подключён, PhotoKit сохраняет настоящие3 PNG без изменения bytes, независимые5/5 XCUITest. Старые фразы foundation «кнопка не подключена» устарели | `qa/2026-10-29-ios-ui-independent/report.md`, `qa/2026-10-29-ios-ui-author/report.md`; `frontend/ios/Somewhere/Data/Album/{AlbumDownloadService,PhotoKitAlbumLibrary}.swift` |
| 3.3 | Android UI/MediaStore/recovery реализованы;7/7 UI independent, реальные6 записей и SHA; lost-insert defect устранён8/8. Остались API26–28 permission/Settings, disk/save-error/partial, >100/EXIF/snapshot/access и full gates | `qa/2026-10-29-android-ui-independent/report.md`, `qa/2026-10-29-android-lost-insert-independent/report.md`; Android `data/album/MediaStoreAlbumOperation.kt`, `state/album/AlbumDownloadController.kt`, `ui/media/AlbumDownloadControls.kt` |
| 4.1 | Незавершён полный независимый scope/gates, а не написание download функции | три UI-independent reports выше |
| 4.2 | Backend rc6 и web rc14 (затем rc15) уже опубликованы; exact native release candidates/установка новой album/outside-keyboard на физический iPhone и полноценный release-test receipt не подтверждены | meeting keyboard checkpoint, `../deployment-and-store-release/qa/2026-10-29-web-rc15-tagged-deployment/report.md`, `tasks.md` |

### account-deletion

| ID | Статус | Evidence |
| --- | --- | --- |
| 3.1/3.2/4.2/5.2, историческая реализация | Исходные подтверждения/повторы/очистка и UI были сделаны и проверены25.10; код сохраняется. После28.10 доступ скрыт. Не надо повторно показывать кнопку ради старого task wording | `verification.md`, current `specs/account-lifecycle/spec.md`, последние абзацы `tasks.md`, текущие Profile исходники |
| 6.1 | Старый server/client совместимый путь был проверен; current hidden-profile acceptance нужно оформить под новым требованием, исходный v1 UX нельзя объявить новым pass | те же evidence; mapping на meeting11.1–11.3 |
| 2.5 | В старом report отсутствует фактический cloud SQL atomicity/upgrade прогон. Это integration acceptance, не отсутствующий deletion backend. Проверить у deployment/storage аудитора, не повторять облако по старой записи автоматически | `verification.md`, `backend/docs/account-deletion.md` |

### gathering-activity-feed client/auth

| ID | Статус | Evidence |
| --- | --- | --- |
| 5.3 | Web auth implementation есть; настоящий production вход/logout/повторный вход вернул собственное приглашение и тот же профиль. Полный приглашённый/отмена/401 и два реальных профиля не подтверждены | `auth-web-verification.md`, `production-client-verification.md` |
| 6.3 | iOS LoginSDK implementation есть; настоящий onboarding-вход на simulator подтверждён пользователем, production список встреч виден. Invitation/cancel/logout/process-death/installed Yandex-app path не доказаны полным real flow | `auth-native-verification.md`, `production-client-verification.md` |
| 7.3 | Android LoginSDK написан и локальный real onboarding через ngrok успешен. Production report25.10 фиксировал HTTPS handshake failure; актуальность этого старого сбоя в данном аудите НЕ проверялась. Не называть доказанным current bug без повторной проверки | те же два отчёта |
| 6.7,7.7 | Большой текст/клавиатура/Back/AX и builds реально проверялись. Полный VoiceOver/TalkBack ручной проход не выполнен. Старую композицию v0.7 заменяет current meeting design; доступность не superseded | `ios-accessibility-verification.md`, `android-accessibility-verification.md`, current meeting reports |
| 8.1 | Реальный сквозной multi-account auth→invite→RSVP→messages не завершён. Моки/собственное приглашение не заменяют его; это acceptance, не новое проектирование auth | `auth-native-verification.md`, `production-client-verification.md`, `app-links-verification.md` |
| 8.7 | Репозиторная подготовка App/Universal Links есть; системная verified-domain и холодный/тёплый запуск из другого приложения на точной подписи не подтверждены этим аудитом | `app-links-verification.md`; deployment artifact/settings нужно сопоставить отдельно |
| 14.5, client/auth часть | Финальная MVP приёмка, включая эти же real auth flows, не завершена; не дублировать как отдельные новые функции | `tasks.md`, отчёты выше |

## real-work (подтверждённая доработка, отличать от тестирования)

1. **P2-WEB-COMPOSER-GROW**: textarea `rows={1}` без autosize; CSS имеет только min/max-height, resize:none. Реальный independent actual desktop/320/390 фиксирует textarea44–46.5 при scrollHeight69–109. Требуется исправление роста до существующего max-height с корректным shrink, selection, IME/scroll и независимым review. Привязка: meeting4.5/4.9/17.4 либо отдельный follow-up. Evidence: `qa/2026-10-29-keyboard-outside-web-independent/defect.md`, `design-review-5.0.0.json`; код `frontend/web/src/features/send-message/ui/SendMessage/SendMessage.tsx`, `SendMessage.module.css`, `hooks/useComposer.ts`. В scope просмотренных исходников autosize нет.
2. **Несогласованность live reference error-color для album-download**: raw `ios-error.html`/общий styles.css назначает цвет самому p и перекрывает intended parent error; native использует published error token. Это исправление эталона/контракта и публикации, не подтверждённый native bug. Привязка vibe1.1/4.1. Evidence: `qa/2026-10-29-ios-ui-independent/report.md`, `qa/2026-10-29-android-ui-independent/report.md`. Не перекрашивать native в серый только ради screenshot match.
3. **Согласование/очистка SDD описаний**: поздние отчёты опровергают старые «foundation не подключена», «prototype не согласован», «production rc14» и «chat stage не начат». Сохранять историю, но добавить актуальную disposition; разделить готовую реализацию и QA tasks. Это документальная работа, не продуктовый scope.

Не считать открытыми bugs: Android lost-insert (повтор8/8), Android readers gap (повтор7/7 + pixel delta0), iOS PhotoKit MainActor crash (исправлен, real Photos5/5), прежний web React185 (rc11 independent12/12). iOS `Invalid frame dimension` warning пока не локализован и не дал наблюдаемого дефекта: диагностический риск, не доказательство сломанной функции.

## external-blocked / отложено владельцем

- meeting8.8: реальные реквизиты оператора/контакт/страны/сроки и окончательная правовая политика; не выдумывать данные. Технический UI уже есть. Требуется сверка с отдельным юридическим/deployment аудитом.
- meeting13.1: публичные metadata/картинка выпущены; проверку превью внутри Telegram владелец явно отложил («Проверю позже»). Не просить заново и не писать ещё одну реализацию. Evidence `qa/2026-10-28-production-owner-release/rc7-summary.md`, `tasks.md`.
- gathering8.7 iOS физический Universal Links/TestFlight: нет оплаченного Apple Developer membership/profile; Personal Team не даёт Associated Domains. Сохранить deferred до изменения внешнего условия, не делать условием остальных функций.
- Два настоящих аккаунта для полного real-auth/invite path и физическая мобильная web IME/touch: в evidence недоступны/не пройдены. Текущий доступ/готовность владельца не проверялись, поэтому это ограничение текущего аудита, не вечный blocker.
- Push отложены владельцем до активного Apple Developer. Не добавлять как prerequisite закрытия нынешнего outside-keyboard UI.

## superseded

- account3.1/3.2/4.2/5.2 в части **показать действие удаления в профиле**: отменено решением28.10 и current account-lifecycle. Новая нужная задача — проверить отсутствие входа на всех3 профилях, сохранив API, retry, credentials cleanup. Старые confirmation UX/test evidence оставить историей.
- meeting/gathering старые привязки к full-page mobile operations, старому v0.7/2.0.0/1.3.0 raw, лишней desktop emoji-delete кнопке: заменены поздними опубликованными требованиями. Не восстанавливать старый UI.
- vibe старый паузный foundation checkpoint и размещение secondary ниже primary: поздние4.1.0/4.1.1 + полноценные native UI tests заменили этот план. Не восстанавливать patch поверх current кода.
- Старое «Mac locked» не является актуальной причиной неготовности: поздние live-resume-3 и current-iOS уже выполнены после разблокировки. Остался неполный scope и inputHash, а не доказанная сегодняшняя невозможность UI-доступа.

## Что можно отметить прямо сейчас без фальшивого PASS

Зафиксировать выполненными отдельные implementation/publication/deployment подзадачи из таблиц, выполненную owner approval5.0.0/rc15, устранённые bugs и сохранение hidden delete. Если parent сохраняет старые комбинированные checkbox дословно, оставлять их открытыми с явным «реализация готова, acceptance missing». Не делать `[x]` на0.3/17.4/vibe4.1 и других gates без фактического current результата. Архивирование этих product changes пока не обосновано.
