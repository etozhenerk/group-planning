# Place web7.10 r3 — ограниченный delta-checkpoint

Обе R2 находки исправлены; новых в запрошенной дельте нет.

- Date dirty browser Back→Stay сохраняет anonymous=true, открыт один Dialog; повторный Back→Leave возвращает в тот же chat, composer виден, Dialog0.
- Place Back→Stay сохраняет текст/один Dialog; Back→Leave и Escape→Leave возвращают в тот же chat; повторное открытие после discard пустое.
- Active/selected vote height48px=published raw48px. Font14/line21/radius12/padding12/space-between, count inheritance и selected #e0dce8/#27252d также совпадают.

390×844 Chromium. Actual/reference PNG и computed сохранены; raw clock только в isolated reference page=2026-11-05T10:00Z, selected сравнен после ACK. API meeting/poll/vote использованы только для изолированной подготовки нужного состояния; прежние create/retry/vote API flows не принимались повторно. 8 наблюдений, errors=[].

Source before/after=candidate: `3569dabc1a2394d550212bb7c7851fe7ed72f1d029fb56bf95e20a2f59b3ef4b`. Artifact: `7ef4a22160307501c2fc6b6bc4979228ad20f1e24478b82bf930f82b4aab38ee`. Binding261 disk/38 live assets без расхождений; backend HTML metadata transforms учтены. Оригиналы и SHA в evidence-sha256.json. Нет полного manifest pass/gates/новых матриц. App/code/tasks/Git не менялись. Runtime завершён; source освобождён.
