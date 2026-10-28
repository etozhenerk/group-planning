# Независимый повтор · Android reader spacing

**ANDROID-SHEET4-READERS-GAP исправлен в проверенном кандидате.** Полная функциональная и дизайн-приёмка остаётся blocked; прежние непроверенные состояния не закрывались.

- Source550: `4a21b8c99e905e4640473a2f2d792da8af5da019d068e5ad7220f0b51e463865`.
- QA APK: `a04f1bd6d2d85dfea839421df57d3ab7a5f4d2c3fa8cc80381959714b68cfc61`. Installed APK отдельно прочитан и захеширован.
- Все550 файлов совпали до и после прогона. Старые135 файлов отчёта/evidence сохранили hashes.
- На emulator-5554 запущены прежние7 tests из нового exact instrumentation APK, `OK (7 tests)` за53.363s. Собственный memory fixture завершился PASS. Кандидат не пересобирался.

Независимый анализ PNG, отдельно от authored geometry assertion: центры трёх аватаров loading и ready теперь одинаковы — **1180.5 / 1314.5 / 1448.5px**, delta **0 / 0 / 0px**. При density2 шаг67dp равен rowHeight55+gap12. Верх панели910px одинаков во всех пяти состояниях; pixel hash области заголовка также идентичен. Изображения просмотрены непосредственно. Исходный тест дополнительно проверил equality внешнего body bounds и внутреннюю прокрутку до Участник7/more.

Evidence: `evidence/instrumentation/readers-loading-fixed.png`, `readers-fixed-3.png`; независимые измерения и воспроизводимый decoder — `evidence/reader-geometry.json`, `measure-readers.py`. Raw result всех7 tests — `evidence/instrumentation.log`. Это controlled Compose state tests на точном APK, а не новый полный ручной сетевой проход.

Full acceptance по-прежнему blocked: live raw недоступен при locked Mac; large-text/small-height/landscape и normal/reduced comparison не выполнены; не пройдена полная новая manual матрица upload/invitation/body/busy и actual reader pagination/error-next-page. Старые manual passes не перенесены на новый APK. Device metadata сохранены с screenshots: Android16/API36,720×1600px,360×800dp,density2,fontScale1,ru-RU/en-US,Europe/Moscow; current animatorsEnabled=false. Глобальные настройки не менялись.

Own origin60288 data/config/evidence удалены, QA процесс остановлен, собственный reverse удалён; остальные reverse сохранены. Изолированный fixture завершился PASS, временный каталог с credentials удалён. Продукт, тесты, эталоны и expectations ревьюером не изменялись.

Проверки отчёта: `design:inspect-report` — structure valid, currentAcceptance=false; `agent:check` и `git diff --check` прошли.
