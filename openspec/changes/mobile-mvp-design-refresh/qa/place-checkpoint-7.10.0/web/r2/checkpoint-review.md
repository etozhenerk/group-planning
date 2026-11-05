# Place web7.10 r2 — targeted exit/vote delta

Place-выход исправлен. Остались два finding:

- **R2-DateGuard/P2:** shared Date regression: при новом входе в «Предложить дату» anonymous=false→true, затем после400ms browser Back закрывает форму без dirty-confirm. Фактический URL возвращается в chat, Dialog0, но подтверждение/Leave выполнить нельзя — правки уходят без вопроса. Адресное стабильное наблюдение: `targeted-probes-complete.json` → date-dirty-before-back/date-after-back-observed; `date-back-observed-actual.png`. Первое немедленное наблюдение дало тот же исход. Date/Place используют одновременно смонтированные blocker hooks; возможный конфликт регистрации требует исправления/проверки.
- **R2-VoteHeight/P3:** active и selected actual height47px против published48px. Остальные bindings совпали:14/line21/radius12/padding12/space-between; count наследует14 и цвет. Selected background#e0dce8/text#27252d совпал с raw. Root подтвердил, что текущая minimum-height роль46 требует замены на48.

Подтверждено: Place Back→Stay сохраняет draft/один Dialog; Back→Leave и Escape→Leave возвращают именно `/meetings/<тот-же-id>`, composer виден, Dialog0. Повторный вход Place пустой. Vote active/selected styles сняты с одного API-seeded card; API vote использован только как fixture state setup, прежние create/unknown/vote API flows не принимались повторно.

`targeted-probes-complete.json`:8 наблюдений/errors=[]. Первое продолжение ожидало отдельный poll GET, которого feed projection не требует; QA прочитал id из feed. Это tooling, не продукт. Reference clock только в isolated raw page=2026-11-05T10:00Z; app clock неизменён. Для selected сравнения используется `reference-selected-settled.json`/`vote-selected-reference-settled.png`; ранний reference screenshot застал локальный demo pending и сохранён отдельно.

Frozen source `2dc013ac38f47a78b6ad6599f1e5e855dff6d996b4566f6f8cbbfe6b8a964a82`, artifact `038f528450a02fb15a73dc4e10a44aeb1dfc33410c462715bfa0fb4c486e0063`,8909. Source before/after=candidate;261 disk/38 live assets совпали (`artifact-binding.json`). SHA — `evidence-sha256.json`. App/manifests/tasks/Git не менялись. Нет новых матриц/gates; source освобождён, app runtime завершён.
