# Settings web7.9 r2 — targeted S1–S3

S1–S3 исправлены в этом ограниченном проходе; новых findings нет.

- **S1:** PATCH403 оставляет forbidden-содержимое Settings, editable fields0, «К информации о встрече» доступно. Protected GET=200. Возврат открывает Info в одном Dialog; GET остаётся200.
- **S2:** review390/320 без cover/image slot; H3=12/13.8/500/muted, H4=23/30/700/text, P=14/22/400/muted с точным published пояснением. Margins24-0-8/0-0-24/28-0-0 совпали с raw. Resume сохраняет local title и принимает untouched remote date08.11.2026. Horizontal overflow нет.
- **S3:** после пустого title focus реально переходит на первое invalid поле Title.

Доказательства: `targeted-probes.json`,6наблюдений/errors=[]; `first-invalid-focus-actual.png`, `mobile-review{390,320}-actual.png`, `forbidden-settings-actual.png`.

Frozen source `07d7eddaefe260dc0233bd3b77786ea5ce7572164bd2724c9d4b7b32c56d0e07`, artifact `bb9cb750ba9726603fe2a8f4a1739e151602bc8e326d632437517002b1ebcdcf`,8904. Source before/after=candidate;261 disk/38 live assets совпали (`artifact-binding.json`). SHA — `evidence-sha256.json`.

Только S1–S3; успешные dirty/PATCH/unknown/WebKit/прочие flows r1 и gates не повторялись. App/manifests/tasks/Git не менялись. Это checkpoint, не финальная приёмка; source освобождён.
