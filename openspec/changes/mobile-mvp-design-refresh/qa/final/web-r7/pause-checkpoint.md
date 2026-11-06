---
phase: paused
---
# Web · пауза 06.11.2026

По явной просьбе пользователя новые suites/manual остановлены. **R8 freeze, официальный план, targeted и suites не начаты.** Новая сборка автора только прочитана как metadata: source `1e23e394ef003c373cfa327e2ccfd90f2cc933ccb10d3c14e01e96bb884ee7da`, `.cache/web-demo`260файлов/hash `ec2d08f1b2ccc7797f4ce308819a093d45abf18e857daab76105101916d59c0d`; это не frozen candidate и не приёмка.

R7 сохранён отрицательным: официальный план305кейсов создан2026-11-06T20:43:03.851Z, source `95314f6bed262d9305b4072bc3f809b629af44db8d242cb992ae4561108a410d`, frozen `/private/tmp/mobile-final-web-r7/dist`,260файлов/artifact `be38a68b16cb6b6c476843fbd201521d3dc01198d33633fd3d5e889a3df5fd74`. Run пустой: ни одного принятого check/suite. Наблюдения C5/C7 совпали с эталоном, но C6 actual1100 Date/Time остался13/19.5/400 против historical15/22.5/650. Это не partialPASS. Перед targeted livebinding260 был valid; после исправления root все260R7байтов остались прежними, source изменился — afterbinding корректно false.

Точная причина C6: generic`._form-fields_h4lqf_9 label`13/400 переопределял собственные DateInput/TimeInput rules. Разрешённая изолированная CSSOMгипотеза заменила только selector на`:where(label)` и дала1100Date/Time15/650 при сохранении обычного label13/400 и mobile14/500. Это не изменение продукта и не приёмка R8.

Свои9153/9154/9155/9156 остановлены по проверенным PID; все четыре порта закрыты. Чужие/native/production процессы не тронуты. Playwrightконтексты завершены. Chrome loan отменён до начала; adb/device/appQA/data не трогались, установок/clear/force-stop не было.

После возобновления: freshR8freeze/healthyHTTPS/official305-caseplan; три actualtargeted; затем6requiredsuites и свежие entry52/RSVP144/invitation64/Create40+31mappedcases, остальные webcases/11manifests. Не переносить R6/R7pass. Для настоящих ChromeIME/zoom — только согласованное exclusiveокно у Androidвладельца. Старые R6 доказательства и негативный Create отчёт сохранены; сегодняшний малый allowlist относится только к этому pause checkpoint.
