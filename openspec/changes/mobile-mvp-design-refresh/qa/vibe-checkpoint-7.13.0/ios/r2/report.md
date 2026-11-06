# Вайб iOS 7.13 — targeted R2

Вердикт: **partial**. F1 fixed-height deck исправлен в проверенном окне402×874; один swipe/viewer-return и новый upload-title подтверждены. Последняя QA-попытка закрыть sheet свайпом по Text не удалась; общий тест failed, exit65, 35.922s. Это не pass всего checkpoint и не доказанный дефект native dismiss. Gates/checkbox не закрывались.

Точный frozen artifact `d7fd062ab0debebefbae0dd32f533e38af4dee518493f63f68069eddf0ed257a`, source `56c916982de5409acf3139a604edbf5936f226129838b5839ff9001fce5e5080`, input `12bb684904ff29c70394a93761fab4771a4a674ef62a5b7f3a29c169df09e43a`. Все20 файлов frozen app проверены SHA до и после подстановки в существующий QA runner: [candidate](candidate.json), [binding](artifact-binding.json). Выполнен только R2 delta; старый pass не переносился.

## Факты

- Settled deck `(12,260,378,548)`, bottom808. Native window402×874, safeTop62/bottom34; bottom808 =874−34−32. Свежий approved raw на402×874: `(12,265,378,577)`, bottom842=874−32. Разница deck29pt полностью соответствует native safeBottom34 и headerΔ5; колода теперь заполняет доступный остаток, прежнего пустого низа нет. [Actual](actual/ready-effective-deck.png), [geometry](actual/ready-effective-deck.geometry.json), [environment](actual/ready-effective-deck.environment.json), [metrics](actual/effective-layout.json), [raw](reference-402.png), [raw metrics/SHA](reference-402-metrics.json).
- Один реальный свайп влево переключил1→2. Тап открыл второе фото fullscreen contain; «Закрыть просмотр» вернул колоду с выбранным2. [После свайпа](actual/after-one-swipe.png), [viewer](actual/viewer-contain.png), [возврат](actual/viewer-return.png).
- «Добавить фото» открыл собственную форму с точным утверждённым заголовком «Добавить фото». [Actual](actual/upload-title.png), [AX](actual/upload-title.ax.txt).
- Затем QA `header.swipeDown()` не скрыл `media-picker-header` за6s, assertion line77 failed. Заголовок Text не обязан обеспечивать native dismiss. Отдельного воздействия на настоящий grabber/Back не было, поэтому upload-close **не подтверждён**. Факт ошибки сохранён в [логе](smoke-independent.log), [driver](VibeCheckpoint713Tests.swift) и [автоматических attachments/видеозаписи](failure-attachments/manifest.json). Capture-before-assert использован для предыдущих actual; при последней неудаче есть автоматические failure attachments. Новых повторов после неудачи не выполнялось.

## Границы и release

Собственная memory+TLS fixture и тестовый identity provider; реальные native/API операции, без внешнего OAuth proof. Не проверены другие gestures/матрица/0–1photos/export/privacy/partial/retry/320/large. VoiceOver не читался и не включался. Последующий targeted upload-error/partial должен проверять dismiss через настоящий grabber/Back с capture до assertion. Это отдельный будущий frozen candidate, не перенос pass.

App уже отсутствовал среди запущенных при cleanup (`simctl terminate`: found nothing to terminate); собственная fixturePID45494 остановлена, lock освобождён trap. Source/device **RELEASED**, root fixtures не затронуты: [cleanup](cleanup.json). Продукт, макеты, кейсы, manifests, tasks и Git не менялись.
