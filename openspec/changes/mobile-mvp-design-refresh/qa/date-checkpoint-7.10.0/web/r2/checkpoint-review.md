# Date web7.10 r2 — targeted D1–D3

D1–D3 исправлены, findings нет. Copy-наблюдение: при неразрешимом deadline time25:99 inline hint говорит «Проверьте дату и время встречи.». Approved `assets/date-r1/source/useDateForm.ts` также передаёт `error.message` из shared resolveTime (собственный fallback только «Проверьте время окончания»). Следовательно, это принятая общая копия, а не расхождение переноса; новый copy/design цикл не требуется. Hint единственный, invalid/association/focus работают.

- **D1:** одна API-seeded mobile card: neutral background совпал с raw, «Опрос / Когда встретимся?», h3 20/26/700; option60/radius12, date14/weekday11, тип «Неанонимный опрос», actor/time вне card. Card radius4/18 и цвета совпали. Разные дни/счётчики с демо обусловлены fixture, голосование не повторялось.
- **D2:**390 deadline169+169,320 deadline134+134, gap12; switch rows44/font13/line19.5 совпали с reference. Horizontal overflow нет.
- **D3:** пустые Date/Time, прошлый deadline и resolve error получают inline hint, aria-invalid/error describedBy и focus соответствующего поля. Сеть при этих локальных ошибках: POST0. Дублирующего footer error нет.

`targeted-probes.json`:10 наблюдений/errors=[]. Actual/ref: `card390`, `deadline{390,320}`; inline states: `inline-date-error-actual.png`, `inline-time-resolve-actual.png`. API meeting/member/poll использованы только для установки одного card state. Create/retry/dirty/vote/happy/error flows R1 не повторялись; новых матриц/gates нет.

Frozen source `5cae5f0f0fbd60d435c4c61dae6137d1c81c4b457efdb2d6d2943da041fb40ba`, artifact `2fe5bb2141d42746f83c40fe2b5a180b446378ebf44dd471e78eb3b523430680`,8906. Source before/after=candidate;261 disk/38 live assets совпали (`artifact-binding.json`). SHA — `evidence-sha256.json`. App/manifests/tasks/Git не менялись. Это checkpoint, не финальная приёмка; source освобождён.
