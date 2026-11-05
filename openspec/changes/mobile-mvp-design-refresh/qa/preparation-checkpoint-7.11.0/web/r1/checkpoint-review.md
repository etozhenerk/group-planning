# Preparation web7.11 r1 — короткий независимый checkpoint

Нужны исправления; это ограниченный экранный проход, не финальный design/feature gate.

- **P1 / P2 — переход после создания.** Как обычный POST201 без fault, так и successful exact retry уводят в `/meetings`, хотя задача создана и должна остаться в исходном чате. Обычный запрос проверен повторно отдельно; URL через650ms и actual — plain-create-destination. Первый проход остановился на последующей попытке открыть исчезнувшую карточку; оригинальный probes.json сохранён. В remaining.mjs карточка открыта явным переходом в уже созданную встречу.
- **P2 / P2 — ширина inline-действия.** В мобильной карточке «Взять на себя» осталось compact/auto-width примерно122px вместо полной ширины содержимого; published raw —288px при390 viewport. Высота raw **44**, font13/r10: actual44 здесь верно, прежняя предварительная оценка48 отменена. Actual compact также у «Отметить выполненной» по тому же стилю.
- **P3 / P3 — точечные bindings формы/подтверждения.** Submit actual46/r12/padding11×16 против raw48/r14/11×18. Recipient actual64/r12/font500 против raw64/r14/font400; people-icon32 против raw20 внутри32-slot. Cancel/decline confirmation actual46/r12 против raw48/r14; «Оставить как есть» actual46/font14 против raw44/font13. **Details-кнопки raw46/r12 совпали**, finding на них не распространяется.
- **P4 / P3 — inline field feedback.** Required error actual — красный13px без значка, наследует weight500 от label. Published FieldHint —12/18 muted copy с отдельным error-colored TriangleAlert14. Копи совпала, focus установлен на textarea, POST не выполнялся.

Короткая форма с кнопкой в потоке без отдельной тени/подложки соответствует последнему пользовательскому правилу AGENTS/UX; отличие от always-sticky raw не считается дефектом. Смещение формы само по себе также не отдельный finding.

## Фактически проверено

390×844 и320×760 Chromium: required/focus; search по реальному Олегу, empty search, browser Back и close/cancel без замены адресата, выбор себя — одна modal-панель и сохранённый title; dirty Back→Stay сохраняет title+recipient, Leave возвращает в тот же chat.

Known429→retry real commit с потерянным ACK→exact retry: три request с одним key/body, один create-event, API state offered/self, assignee=null. Unknown блокирует поля и close, кнопка повтора доступна. Реальные API/UI accept→accepted→complete→completed; cancel/decline сначала «Оставить как есть» сохраняет state/revision, затем подтверждение сохраняет cancelled/declined. В карточке и подробностях видны реальные имена/время и нейтральный fallback, потому что fixture не отдаёт avatar_url. Наличие реального фото отдельно не доказано.

Один shared Date dirty browserBack→Leave возвратился в тот же chat. Desktop1100×900: прежний input+select сохранён. Реальная IME, WebKit, VO, полный каталог/матрица,200%/RM здесь не прогонялись и pass не получают. OAuth/RSVP/meeting API использованы только для изолированной подготовки данных.

## Evidence и binding

25 записей в probes-complete.json, errors=[]. Состояния reference details/cancel-confirm/decline-confirm в URL не открыли панель сами: ранние reference PNG сохранены, но для panel comparisons используются **self-details-live-reference.png**, **cancel-confirmation-live-reference.png**, **decline-confirmation-live-reference.png** и reference-panels.json; они получены кликами опубликованного raw. Raw self-card-live-reference.png — источник ширины. Данные raw и app различаются по тестовым людям/датам/числу карточек; геометрия сравнивается по одному элементу.

Source before/after=candidate `8bdad91cf888997555628b463bcafe6a0b07cbc90ed72b04d1018051806b3ded`; artifact `cf271a44520f42ef24c83c58cf63accd4250dd38d6a565fd16f4d58e64f82ef8`. Design context inputHash=25e8edd73c6c03dff56bb2a2854905b7d54699df2259d5a4b9d79d098c2df132; design:check ok (только структура).261 disk/38 live assets совпали, backend HTML metadata transforms учтены. SHA originals/driver/reports — evidence-sha256.json. Source освобождён, браузеры закрыты, fixture server не остановлен. App/code/manifests/tasks/Git не менялись; git diff --check clean.
