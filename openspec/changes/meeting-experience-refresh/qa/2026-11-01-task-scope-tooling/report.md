# Task-scoped functional gate · 01.11.2026

Исправлена учётная ошибка общего feature-плана: текущий checkpoint принимает
полный case/platform/environment scope конкретных задач, сохраняя остальные
pending/failed в outsideScope и wholeReady=false. Проверяются все required
suites каждого исходного плана; source/catalog/time/evidence/executor validators
не менялись. Планы, время и raw-статусы не переписываются.

Optional task.acceptance привязывает независимый текущий plan/run каждой
платформы; прежний manifest.plan/run остаётся fallback. Все mappings и distinct
platform валидируются даже у полностью открытого checkpoint. Review/complete,
обычный global ready и release требуют прежний полный набор, partial receipt
запрещён. CI/workflows, runners, каталог415 и runtime приложений не менялись.

Авторские23tests PASS. Независимый sdd_chat_audit исполнил16 controls PASS:
[финальный отчёт](review-v3.md), [raw](independent-v3/negative-controls.log).
Исходные4RED и промежуточный platform-validation RED сохранены в v1/v2.
Неблокирующее замечание CLI registry binding отражено в независимом отчёте;
для закрытия используются канонические task mappings, не их урезанные копии.

qa:check415/gaps[], agent:check и git diff --check PASS. Catalog hash сохранился
84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e;
параллельные native plans не переиздавались. Этот технический результат не
закрывает автоматически ни одного продуктового checkbox и не заявляет релиз.
