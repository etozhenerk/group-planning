# Vibe7.13 — delta canonical UI assertions перед push

Read-only audit06.11.2026. Продукт и canonical tests не менялись; runtime/CI не запускались. Только assertions вайба, без общей реорганизации/нового runner. Authority: approved vibe-r3 + navigation-r2, ux.md (вайб/общий возврат), design/vibe-web.json7.13. Legacy desktop UI сохраняется. Исполнитель может обновить эти selectors одним тестовым patch, сохранив business assertions ниже.

## Native upload: form-first

| Файл/точные строки | Нынешнее несовместимое ожидание | Точечная замена |
| --- | --- | --- |
| `frontend/ios/SomewhereUITests/NativeVibeUploadUITests.swift:32–35` | album-add сразу запускает OS picker, media-picker-header отсутствует | После album-add дождаться media-picker-header («Добавить фото»), проверить empty form/disabled media-batch-send, затем app.buttons[«Выбрать фото»].tap(), и только после этого ждать PXGGridLayout-Info. OS Add/выбор фото34–39 оставить. Header40–41 остаётся после возврата. |
| Тот же файл:51 | Старый media-batch-progress принадлежит chat MediaPickerPanel, в новом MemoryAlbumUploadPanel этого id нет | Оставить delayed preview.exists49 и send disabled50; вместо чужого progress-id проверить send.value=«Выполняется»/busy ProgressView новой кнопки. ActionFormButton.swift:25–27 уже даёт spinner и accessibilityValue. Gate/requested/commit-before-display нельзя удалять. |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/NativeVibeUploadUiTests.kt:57–60` | album-add сразу открывает systempicker, upload-sheet отсутствует | После album-add дождаться upload-sheet/«Добавить фото», затем нажать «Выбрать фото» и ждать OS picker. Не требовать отсутствия формы, пока поверх неё открыт picker. Системный выбор61–76 сохранить. |
| Тот же файл:79,83 | В memory form submit «Отправить» | Нажать существующий tag media-batch-send /текст «Добавить в альбом»; busy assertIsNotEnabled — по tag, а не старому contentDescription. Tag уже существует в MemoryAlbumUpload.kt:177. |

Сохранить без ослабления iOS18–19,24,45–48,52–62,68–71 и Android44–47,81,84,88,90–104: до3/после4, gate held после реального commit, прежние IDs являются subset, ровно один новый ID, pending не закрывает форму/не разрешает duplicate-send. NativePickerSelectionUITests.swift:40–63 относится к **чатовым фото**, его form/picker последовательность этим патчем не менять.

## Counter: Android header split; iOS accessibility сохраняется

Android GalleryCounter.kt:37–48 теперь содержит отдельные Text(index) и Text(«/ N»), не единый Text(«1 / 3»). Поэтому header waitText/onNodeWithText ниже нужно заменить небольшим assertion helper внутри существующей QA-обвязки: ждать index Text и sibling «/ N» в header counter (например hasText(index) + hasAnySibling(hasText(«/ N»))). Числа/порядок переходов **оставить прежними**. Не расширять matcher до любого числа во всём экране.

| Файл | Header counter строки |
| --- | --- |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/NativeVibeUploadUiTests.kt` |  |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/VibeStabilityUiTests.kt` |  |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/ExperienceUiTests.kt` | 52, 55, 58, 62, 66, 68, 72, 104, 114, 116, 157 |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/ProfileVibeAccessibilityUiTests.kt` |  |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/AlbumPreloadFailureUiTests.kt` | 54, 60, 78, 87 |
| `frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/AlbumDownloadUiTests.kt` | 195 |

Fullscreen combined counter Android не split: AlbumDownloadUiTests.kt:73 и AlbumPreloadFailureUiTests.kt:69 — сохранить. Image contentDescription на R.string.memories_count («Фото N из M») также не менять: VibeStability photoExists/sampleSettled и TalkBack image custom-next checks остаются.

iOS AlbumViewControls.swift:12–20 визуально показывает N / M, **но намеренно сохраняет accessibilityLabel N из M**. Поэтому NativeVibeUploadUITests.swift:31,58; AlbumDownloadUITests.swift:14,20,108; AlbumPreloadUITests.swift:25,51,75,92 и AlbumOfflineSweepUITests header counters не требуют blanket replacement. Они остаются валидными semantic assertions.

## Viewer: scoped selectors, не менять бизнес-навигацию

Новый iOS MemoryFullscreen.swift:52–54 имеет id memory-fullscreen/value «N из M», header Text N / M на74, close label **«Закрыть просмотр»** на90. Следующие **только вайбовые** «Закрыть» заменить на «Закрыть просмотр»:

- `frontend/ios/SomewhereUITests/DesignExperienceUITests.swift:252,254`.
- `frontend/ios/SomewhereUITests/ExperienceUITests.swift:175,185`.
- `frontend/ios/SomewhereUITests/CrossPlatformUITests.swift:70,72` (не затрагивать28/30/34/38/40 — другие surfaces).
- `frontend/ios/SomewhereUITests/AlbumPreloadUITests.swift:41,44`.
- `frontend/ios/SomewhereUITests/AlbumPreloadFailureUITests.swift:53`.

Viewer-only counters заменить semantic locator на memory-fullscreen.value или slash header: ExperienceUITests.swift:177,179,181,183; AlbumPreloadUITests.swift:40; AlbumPreloadFailureUITests.swift:47. Header counters после закрытия остаются «N из M». Не менять числовые boundary/business expectations только из-за косметики: текущий MediaPhotoNavigation.swift:10–12 сохраняет clamp полноэкранной навигации; deck cycle3→1 — отдельное правило. Если будущий UX действительно меняет boundary policy, нужен отдельный behavioral change, не этот assertion-only patch.

Android `VibeStabilityUiTests.kt:78`: PageBack теперь icon-only, поэтому onNodeWithText(«Назад») заменить на onNodeWithContentDescription(«Назад») (PageBack.kt description=experience_back). Ожидание возврата в message-composer79 сохранить. Android «Все фото» selectors не переименовывать автоматически: GalleryCounter.kt:50–55 всё ещё использует memories_grid, experience_strings.xml:71=«Все фото». Back из full→grid→stack сохраняется в MemoriesGallery.kt:75–82; двойной Back в preload tests не удалять.

## Web: только mobile memory variant

Current MemoriesView mobile title=«Добавить фото», desktop=«Добавить фото в альбом». Mobile AlbumUploadControls input aria-label=«Файлы для альбома», desktop UploadActions остаётся «Выбрать фото». Обновлять по текущему viewport<740/варианту memory, не глобальной строковой заменой. `playwright.config.ts:37–59` включает соответствующие specs в mobile-webkit, поэтому desktop-only success не закрывает совместимость.

| Canonical spec/строки | Изменение UI selector |
| --- | --- |
| `frontend/web/tests/08-cross-platform.spec.ts:97` | Memory dialog title по viewport; button «Выбрать фото»98 и filechooser event оставить. Строка75 — чат, не менять. |
| `frontend/web/tests/29-media-refresh.spec.ts:171` | Memory dialog title по viewport. Form-first/choose button200 и business Back/draft checks174–176 сохраняются. |
| `frontend/web/tests/48-media-batch.spec.ts:22,45` | Memory dialog title/input label по viewport. Partial success/failed-onlyretry/puts3/reserves2/confirmed images91–104 сохранить. |
| `frontend/web/tests/51-album-stack-cycle.spec.ts:21,40,170,172` | Memory dialog/input labels по viewport; motion/cycle/real frame/size invariants не ослаблять. |
| `frontend/web/tests/52-album-touch.spec.ts:26,45` | Этот spec принудительно402px/mobile: title «Добавить фото», input «Файлы для альбома». Trusted touch gesture assertions сохранить. |
| `frontend/web/tests/53-pointer-focus.spec.ts:83,85` | По viewport. Focus restoration/input modality assertions сохранить. |

Не затронуты этим change: chat-upload46-upload-sheet-layout.spec.ts и47-upload-picker.spec.ts, cover24-meeting-covers.spec.ts, helpers.ts:88. Их «Выбрать фото»/«Отправить фото» относятся к другим формам.

Mobile viewer теперь **3 slide slots**: PhotoSlideTrack.tsx:33–38 помечает inactive aria-hidden=true. Поэтому CSS `viewer.locator('img')` больше не one-element selector:

- `frontend/web/tests/29-media-refresh.spec.ts:255` → active image (например viewer.getByRole('img') без hidden); DOM geometry query261 также active [aria-hidden=false] img с desktop fallback img. Сохранить contain и frame/no-overflow проверку256–272.
- `frontend/web/tests/48-media-batch.spec.ts:109` → active accessible image, сохранить object-fit=contain.
- `frontend/web/tests/52-album-touch.spec.ts:168,170` → gesture target viewer.getByTestId('full-photo') (real slide viewport), а не все3img. Counter/direction/focus semantics сохранить.

## All-photo download: менять только mobile action locator

Web mobile accessible name теперь «Сохранить все фото», desktop «Скачать все фото». Эти specs идут и в mobile-webkit:

- `frontend/web/tests/59-album-download.spec.ts:35,86,155,174,182,200`.
- `frontend/web/tests/60-album-download-access.spec.ts:56,65,100`.

Нужен небольшой viewport-aware save locator (или strict regex для resize + отдельная assert accessibleName в каждой width): width<740→«Сохранить все фото», иначе старый desktop name. В59:86 locator используется через resize-loop90, поэтому не захватывать имя только один раз до цикла. Negative empty/denied checks155/65 должны проверять отсутствие **обоих вариантов**, иначе ложный pass наmobile. Retry name «Повторить скачивание всех фото» не менялся.

**Сохранить весь all-photo business contract:**59 полный103-photo export независимо от недоступных страниц, native download event, filename/ZIP Store/CRC/SHA originals и отсутствие fetch-download; cancel/delete export без late navigation, one retry;60 real revoke/session/outsider/retention cleanup/no download. Native AlbumDownloadUITests.swift и AlbumDownloadUiTests.kt сохраняют PhotoKit/MediaStore permissions, bytes/hash/all103, pending cleanup, snapshot/revocation и selection invariants. Android header locator заменяется как выше, числовые count/assertions остаются. Unit/integration album download API/manager/journal/temporary-files не затронуты.

Статический аудит не выдаёт runtime pass. После assertion patch достаточно затронутых canonical tests по согласованному процессу; новый runner/массовая замена UI строк не требуется.
