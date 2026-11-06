# Уточнение motion среды после R4

Исходные отрицательные reports/evidence не переписаны. Capture metadata показывают:

- R1: setting animator_duration_scale=null, фактический animatorsEnabled=false.
- R2: явно1.0, фактический animatorsEnabled=true.
- R3/R4: после восстановления исходного null фактический animatorsEnabled=true.

Следовательно R1 pass не подтверждает animated close. Наблюдение R3/R4 — реально
оставшаяся открытой sheet после retry под Compose instrumentation, но одной
картинки/timeout недостаточно, чтобы установить причину внутри Material/clock.
Исполнитель сообщил о проверке локального Material3 и изменяемом callback как
ключе rememberSaveable; это его рабочая гипотеза, до нового runtime не вердикт.

R5 проверяется в явном animated1.0 тем же driver. Отключение motion ради pass
не выполнялось. Окончательная причина/исправление подтверждаются новым проходом.
