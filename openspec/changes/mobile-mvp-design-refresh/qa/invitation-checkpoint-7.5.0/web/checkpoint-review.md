# Независимый checkpoint web · 7.5.0

Checkpoint pass. Открытых замечаний в проверенном объёме нет; это не финальный design/qa gate и не основание закрывать продуктовые checkbox.

- F1: guest CTA280×48/350×48/699×48 на320/390/739 Chromium;350×48 на390 WebKit.
- F2: desktop loading740/1100/1440 совпадает с заново открытым historical8878: surface-card, padding32 и About возвращены. Unavailable сохраняет прозрачный wrapper/padding0 и прежние heading/State/About rect. Прямое сравнение всех DOM ancestors давало ложный false из-за дополнительного прозрачного article; визуально и по фактической геометрии расхождений нет, исходные probes сохранены.
- Chromium+WebKit390: реальное Приду→чат, Возможно→приглашения, Не смогу→подтверждение. Повтор после transport abort через Enter сохраняет idempotency-key и приводит в чат той же встречи.
- Before/after: source и artifact соответствуют frozen candidate, все261 disk/live файла совпали. Собственные OAuth/memory fixture; production не затронут. Полная матрица, VoiceOver и финальные gates не выполнялись.

Детали, действия, actual/reference screenshots и SHA: checkpoint-review.json; исходные измерения: checkpoint-probes.json. Приложение/manifests/tasks/Git не менялись.
