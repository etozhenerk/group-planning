# Android help/support R3:3 boundary pass, picker remove locator pending

Приложение побайтно совпадает с R2: APK SHA256
42586a87b0862bdc610a10257de840c7096ba66a8cc0c340f010b5058be44720.
Текущий source a67cb943b566ead69a93b3fb416a82c1cdc08514689f9db5f0e653b49201d732;
before/after совпали. TestAPK SHA256
6fe092e037f231b79484417c5fb3a62f07e4ac04379f822317ed06209889ce27.
emulator-5554,720×1600,density320,font1, explicit animator1.0.
Изолированный memory fixture127.0.0.1:64284,nil notifier.

Один targeted запуск4 tests37.809s: **3 pass,1 failed**. boundary-picker.log.

- **PASS** lostAcknowledgementRetriesTheSameBodyKeyAndActualReceipt: existing
  QA transport пропустил реальный201 от изолированного API, сохранил его receipt
  и намеренно бросил IOException до отдачи клиенту. UI показал unknown/frozen,
  receipt отсутствовал; UI retry повторил nonblank Idempotency-Key и body SHA,
  получил тот же id/reference. После retry actual показал этот reference.
  Проверено canonical assertions, не обычным outage. Screenshot
  evidence/support-lost-ack-same-receipt.png просмотрен ревьюером.
- **PASS**10/3000 Unicode codepoints: два разных реальных accepted/id/reference,
  новый чистый form через receipt→help→support, POST counts1/2, idea/meeting_chat.
  evidence/support-boundary-10.json и3000.json, PNG и capture metadata.
- **PASS**9/3001 после trim: видимый правильный field error, сохранение ввода/
  context, нулевое количество POST и отсутствие receipt. JSON/PNG evidence.
- **PARTIAL/FAIL** screenshot canonical: ожидание busy=false и assert ввода до
  picker прошли, две реальные отмены сохранили текст; настоящий system selection
  вернул bytes128×128/MAGENTA, verified decoded pixel. Actual selected attachment
  и текст сохранены в evidence/support-system-screenshot-selected.png и просмотрены.
  Финальное удаление не выполнено: locator ищет старое видимое «Убрать»
  (SupportServiceUiTests157), тогда как current approved UI имеет icon content
  description support_remove_attachment. Нужна только адаптация этого locator,
  затем один targeted picker повтор; pass за удаление не выдан.

R2 ручной scope не повторялся. Полный дизайн/функциональный matrix и gates пока
не закрыты; failed locator не замаскирован под pass. Ревьюер не менял продукт/
тесты/кейсы. Evidence только QA. App force-stopped, animator restored null;
source/device освобождены для последней test-only правки.
