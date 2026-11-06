# Help/support source audit —06.11.2026

Read-only audit текущей реализации перед runtime; source/tests не менялись, сборка/браузер на этапе этого аудита не запускались. Root затем передал frozen R1 candidate7496378e…; выводы ниже ещё требуют actual подтверждения. Это не pass UI/behavior.

## Конкретные source-проблемы / ближайшие runtime probes

1. **Email feedback — P2, высокая уверенность.** `frontend/web/src/features/support-feedback/ui/MobileFeedbackFields/MobileFeedbackFields.tsx:75–77` выводит `m.fields.email` буквально. Backend `support/validation.go` возвращает machine code `invalid`, shared API parser не переводит field values. В mobile form `noValidate` (`MobileFeedbackPage.tsx:41`), `useFeedback.submit` проверяет только description, в отличие от approved help-r2 `useHelpPreview.ts` с `emailProblem="Проверьте адрес почты."` и focus. Поэтому malformed email должен дать422 и текст `invalid` вместо понятной inline-копи. После freeze проверить реальный422, focus и correction; не менять контракт/требовать новый email policy.
2. **Footer/attachment glyph — source UI probe, P3 после DOM.** `MobileFeedbackFooter.tsx` создаёт TriangleAlert без size, `.error > svg` в его CSS:40–43 не задаёт width/height. Lucide default24 против approved FeedbackFooter TriangleAlert19. `MobileFeedbackAttachment.tsx` использует ImagePlus без size, raw FeedbackAttachment — Paperclip21; local CSS.choose>svg также без размеров. Снять actual computed до finding; glyph copy/geometry не подменять новым эталоном.
3. **Privacy return ancestry — условный риск, не объявлен actual дефектом.** `MobileFeedbackOptions.tsx:30–32` передаёт обратно support URL и только immediate returnTo. Исходный nested returnState из Help теряется; `shared/lib/navigation/returnLocation.ts:16–18` допускает/сохраняет лишь один nested уровень. Обычный profile→help→support→privacy→support→help может визуально работать за счёт Help fallback/profile; нестандартный разрешённый первоначальный returnTo рискует замениться fallback. Сначала проверить согласованный типовой путь и draft/file/scroll, не расширять navigation contract в source-аудите.
4. **Поздний session resolve — условный риск.** `useFeedbackDraft.ts:47–50` меняет queryKey anonymous→userId после загрузки session. Если уже вводили anonymous draft при медленном me и затем пришла авторизация, включится другой cache entry. Аналогичный key в MobileHelp. Это задача целевого runtime при наличии места в short scope; не выдано за воспроизведённый data-loss.

## Что по чтению сделано правильно и сохранять

- `useFeedback.ts:45–64,75,79–98`: pending сохраняет **content snapshot+key** в query cache; retry после privacy/remount использует его, включая прежние diagnostics.viewport. client_request_id==Idempotency-Key. Это устраняет пересчёт payload/key при resize и даёт основу exact lostACK replay. Реальный receipt ещё надо пройти через isolated server, не мокать его.
- `useFeedbackDraft.ts:66–85`: draft/file/receipt/error/busy/scroll живут в user-scoped query key и gcInfinity наmobile; patch проверяет существование записи. `entities/session/model/resetSession.ts:12` удаляет все non-session queries: draft не остаётся после logout; late callback не создаёт удалённую запись заново.
- `MobileFeedbackOptions.tsx` содержит return URL c query; draft не хранится в URL/history state, там только маршрут. При privacy remount поля берутся из cache. Screenshot FileReader result хранится в draft, а не в route state.
- `sectionKey.ts`: Arrow/Home/End preventDefault и меняют focus; Enter/Space preventDefault+apply. `MobileFeedbackSection` сохраняет selected до явного apply, Dialog returnFocus наtrigger; inputradio не submit. Все8sections совпали с API. Actual cancel/Back/file/scroll всё ещё требуется.
- `useFeedbackLayout.ts`: ResizeObserver(root/content/footer) сравнивает натуральный content+footer с реальным root.clientHeight; Workspace actual visualViewport меняет rootsize. MobileFeedbackPage:23–27,47–53 хранит/восстанавливает body scroll при pinned/remount. Footer radius/shadow толькоdata-pinned=true. Проверить RO transition на реальных short/large условиях; наблюдение из CSS не заменяет scrolling pass.

## Канонические selectors: адаптация по фактической ветке

- `49-service-navigation.spec.ts:26`: mobile «Написать в поддержку», desktop прежний «Задать вопрос ↗». FAQ aria-expanded/hidden/focus и route/back checks сохранить.
- `62-support-boundaries.spec.ts:22–34` и `32-refresh-resilience.spec.ts:120–128`: mobile textarea «Сообщение», submit «Отправить обращение»/retry «Повторить отправку», section trigger «Раздел приложения: Профиль» вместоcombobox. Desktop прежние selectors. Boundary9/3001→POST0 и10/3000→реальные201,kind/screen/trim, samekey/samereference не ослаблять.
- Receipt mobile отображает «Номер обращения» и отдельный exact server reference; не искать старое единое «Номер <ref>», не принимать DEMO-01.
- **Уточнение к prep:** текущая реализация сохранила file input label «Прикрепить скриншот», а не prototype «Файл скриншота». До freeze нельзя было предполагать новый selector; в R1 использовать фактический input/real chooser и отдельно оценить keyboard semantics. Canonical tests не менять ради заранее угаданного имени.

Большой runner/матрица не добавлялись. Root исправляет app; независимый actual checkpoint и новый binding будут отдельными evidence.
