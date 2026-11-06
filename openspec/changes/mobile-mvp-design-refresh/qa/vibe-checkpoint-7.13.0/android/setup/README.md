# Android Vibe7.13 — подготовка независимого checkpoint

**Prepared only.** Ни устройство, ни app/fixture/build не запускались этой подготовкой. Нет runtime verdict/pass. Scope — короткий экранный design-review + feature-smoke, без полной матрицы/final gates/VoiceOver/TalkBack/карт.

Источники: approved `vibe` → assets/vibe-r3/frame.html, normalized preparation/references/vibe/frame.html; navigation-r2; design/vibe-android.json (DS7.13/checkpoint, 62 states — этот smoke не закрывает их все); UX и docs/design/components/memories.md. Последняя authority важнее исторических previous/clamp-комментариев: оба направления стопки дают next, последний собирает цикл; fullscreen выбранного фото и возврат отслеживаются отдельно.

## Готовые части

- `check-candidate.mjs`: только читает exact APK и вычисляет текущий sourceHash(['android']); сохраняет before/after binding, при несовпадении останавливает запуск.
- `build-driver.sh`: guard RUN_FROZEN_VIBE=1 + candidate binding; после handoff создаёт отдельную COW temp-copy Android, добавляет **только** QA-драйвер и собирает test APK. APK приложения из temp никогда не устанавливается.
- `VibeCheckpointSmoke.kt`: два подготовленных, пока **не скомпилированных** QA-only метода на существующих InvitationUiFixture/ChatReadLiveApi/QaTestPhoto/QaPhotoBatchProbe. Deck both directions/cycle/slow rollback/flick/grid→viewer→tracking и новая собственная upload-форма→picker→cancel→2 own photos→partial lost publish reply→retry only retained item. Устаревший NativeVibeUploadUiTests без адаптации не запускаем: он требует автоматического picker до формы.
- Реальные save/privacy — переиспользование точечных AlbumDownloadUiTests (original bytes/MediaStore rows и revoke-before-gallery-commit), с их cleanup только своих строк. Privacy использует удаление **изолированного fixture** actor album-revocation-owner, реальные аккаунты не затрагивает.

## Входы от root перед первым runtime

1. Frozen candidate.json + immutable app-qa.apk, SHA256 APK, sourceHash Android; текущая publication/designInputHash и manifest. Root source должен оставаться замороженным до after-binding.
2. Подтверждение свободного emulator-5554/API36 и доступного root raw HTTP (обычно8875).
3. Совместимый verified fixture binary + SHA/provenance. Прежний `/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test`, SHA140b015239bf1a35bce274171ef113add3e9cd0b4b7147986a6494c9cfbd41d7, содержит memories3, album-revocation-owner, config cases и media API. Если root даёт новый binary — привязать новый SHA, не молча наследовать старый environment pass.
4. Подтвердить сохранённые selectors: photo-stack, memory-gallery/memory-fullscreen, album-add/album-save, upload-sheet, media-batch-send/media-upload-error, «Все фото», «Выбрать фото». Сейчас read-only порт уже содержит эти роли; source ещё не frozen.
5. Для raw comparison допустимы seeded fixture PNG (3 различимых градиентных фото), это не demo-фотографии raw. Не требовать одинакового контента ради pass: сравнивать композицию/геометрию/поведение, сохранять actual фотоIDs/bytes/bounds. Полезны также исходники разных пропорций/EXIF, но в коротком smoke без новых fixture сценариев это ограничение.

## Команды после handoff (из корня)

```sh
export RUN_FROZEN_VIBE=1
vibe_qa=openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/android/r1
vibe_candidate="$vibe_qa/candidate.json"
mkdir -p "$vibe_qa"
node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/android/setup/check-candidate.mjs "$vibe_candidate" "$vibe_qa/source-artifact-before.json"
sh openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/android/setup/build-driver.sh "$vibe_candidate" "$vibe_qa"
```

Это ровно одна test-only сборка после freeze, существующие helpers не копируются заново в repo/app. Если готовый root test APK уже содержит новый QA-драйвер, отдельная сборка не нужна.

Отдельной собственной exec-сессией fixture:

```sh
env SOMEWHERE_ANDROID_FIXTURE=1 SOMEWHERE_ANDROID_FIXTURE_SCOPE=calendar \
SOMEWHERE_ANDROID_CHAT_REALTIME=1 SOMEWHERE_ANDROID_CHAT_READ_STATE=1 \
SOMEWHERE_ANDROID_FIXTURE_CONFIG=/private/tmp/vibe-checkpoint713-config.json \
/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test \
-test.run '^TestAndroidFixture$' -test.v -test.timeout 0
```

Перед install: снять wm size/density/font/animation/rotation, проверить serial; создать свою namespace/pref как в Preparation7.12, push private config `/data/local/tmp/somewhere-android-ui-713841.json`, reverse **свой** config origin port. Не печатать credentials/certificate в QA/Git. Установить только candidate.artifact и test APK из driver-apk-path.txt; проверить installed bytes.

Instrumentation каждый метод отдельно, чтобы порядок был явным:

```sh
vibe_adb=/Users/misha/Library/Android/sdk/platform-tools/adb
vibe_test=dev.groupplanning.android.VibeCheckpointSmoke#deckBothDirectionsCycleRollbackFlickAndViewerTracking
"$vibe_adb" -s emulator-5554 shell am instrument -w -r \
-e fixturePath /data/local/tmp/somewhere-android-ui-713841.json \
-e frozenVibeCheckpoint true \
-e additionalTestOutputDir /data/user/0/dev.groupplanning.android.uitesthost/files/vibe713-deck \
-e class "$vibe_test" \
dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner
```

Следующие отдельные class аргументы **в этом порядке**, с отдельными output dirs/logs:

1. `dev.groupplanning.android.AlbumDownloadUiTests#adjacentActionSavesAllOriginalsAndKeepsSelectedPhoto`
2. `dev.groupplanning.android.AlbumDownloadUiTests#revokedAccessRejectsHeldSnapshotBeforeGalleryCommit`
3. `dev.groupplanning.android.VibeCheckpointSmoke#ownUploadFormPickerCancelAndPartialRetry`

Upload последним: добавляет2 фото в memories fixture, тогда как legacy save helper ожидает исходные3. Все методы используют тот же remote fixturePath; custom методы требуют frozenVibeCheckpoint=true. Два недавно созданных solid-color QA фото должны быть визуально опознаны в picker capture. Если «последние2» не совпали с собственными QA изображениями — precondition blocked, не pass и не использовать чужие фото для доказательства.

## Реальный visual/motion проход агента

Counter-only assertions не подтверждают физику. На frozen APK короткая screenrecord/последовательность actual mid-drag→release→settled при включённой обычной анимации; оба направления, rollback/flick и cycle должны быть просмотрены агентом. ADB input/swipe только по bounds реально увиденного photo-stack. После отпускания проверить фотоID/размер через0/500/1500ms, отсутствие tap viewer при drag и стабильную шапку. Raw vibe-r3 отдельно прокликать при том же viewport; не переносить авторские screenshots/pass. При необходимости сделать один320/font1.8 spot, не новую full matrix.

## Результат и cleanup

Сохранить короткий report с отдельными design/feature observed outcomes, actual/reference hashes, source/artifact before/after, interactions и ограничения. Любая недоступная фаза blocked, а не screenshots-only pass. Ни финальный62-state manifest, ни qa/design ready этим smoke не закрываются.

После прохода: release QA gates; удалить только свои inserted/saved MediaStore rows (проверка own package/до-после), private config/namespace, свой reverse/remote files/video; restore globals; force-stop QA app; stop только свой fixture listener; installed hash/source after. Root fixtures и исходники не менять. Перейти к account-service/final только после release и отдельного frozen handoff; прошлый candidate не подтверждает следующий пакет.
