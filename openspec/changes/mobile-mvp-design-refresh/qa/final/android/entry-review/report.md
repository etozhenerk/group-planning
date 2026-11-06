# Android R9 — знакомство 3.4/3.9

Пять кейсов выполнены независимо на текущем R9 (source7f4f7abb…fade9fe, APK a0dd600c…05376c4e),36declared design states проверены по actual/reference/interaction. В `run.json` теперь8manualchecks: прежние3launch сохранены, добавлены5entry; обе official suites с202unit/99UI+2persistence сохранены без повторного запуска/изменений. Аудит в run-preservation-audit.json.

Пройдены8страниц на360x800/320x568, Next/Back/Skip/range/swipe/rotation/recreate/systemBack, полный scroll/инертные примеры и единственный локальный calendar/list toggle с requests=[], font1.8/scale0/реально bound TalkBack без свайпов. Busy сохраняет геометрию и disabled CTA/range/Back, doubleNext не авторизует. Synthetic SDK cancel и invalid-token boundary дали настоящий HTTP start/exchange отказ; повтор full-token — реальные me/meetings и личный экран.

Два direct-return прогона используют отдельный разрешённый Go QA wiring overlay5faf: memory.Store InvitationExists вместо constantfalse. После syntheticSDK+реальных HTTP возвращается исходное invitation2222; no PUT RSVP, «Приду» остаётся явным. Это не проверка настоящего OAuth provider или verified OS Universal/AppLinks.

Initial cancellation/invitation screenshots попали на предыдущие Surface frames при уже обновлённом AX. Они сохранены и не засчитаны итоговыми state passes. Только targeted settled captures через тот же helper подтвердили готовые состояния; source/app/canonical/plan не менялись. Подробности capture-timing-note.md, исходные и уточнённые helper sources/логи сохранены.

Root выполняет финальные scoped gates перед checkbox/push. Остальные275cases и другие design manifests здесь не приняты.
