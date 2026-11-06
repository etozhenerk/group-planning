# Help iOS R6 — целевая независимая проверка

Вердикт: **pass в узком объёме checkpoint**, не итоговая приёмка экрана. Единственный тест `testRealServerEmail422ShowsHumanCopyAndFocus` прошёл за 28.491 с; `TEST EXECUTE SUCCEEDED`.

Проверено на frozen R6, iOS 27.0, существующий Simulator 31262733-50DC-46A5-938E-4C462D70F109, окно 402×874. `a@@example.test` с действующим описанием дошёл до реального изолированного memory API: POST вернул **422**. ResponseGate удерживал настоящий ответ и затем выпустил его, статус не подменялся. Нотификатор nil, реальных обращений внешним получателям нет.

После release ответа приложение само прокрутило ошибочное поле. Actual снят **до assertions**, после стабилизации пяти геометрических отсчётов (1.83 с). Поле y166.17–215.17 и человекочитаемая подсказка y222.67–237.00 полностью видны над границей scroll/footer y340; email сохраняет keyboard focus и значение, описание сохранено. CTA y405–453 выше Done y531 и клавиатуры y590. Actual просмотрен визуально: подсказка не перекрыта. Receipt/номер SW отсутствует. Исправление overlap R5 подтверждено на этом trigger.

- [Actual](actual/server-email-error-focus-before-assert.png), [AX](actual/server-email-error-focus-before-assert.ax.txt), [settled geometry](actual/server-email-error-focus-before-assert.geometry.json), [visible bounds](actual/visible-error-geometry.json).
- [Реальный статус](actual/server-422-held.json), [проверяемые факты](actual/server-field-error-proof.json), [лог](server-email-independent.log), [QA driver](HelpCheckpoint714R6Tests.swift).
- [Binding](artifact-binding.json): artifact `b03b37587885b0390286d202b5564e852d543795d6190d3e1958d4b7898b2215`; source `70abd8f2229bbded7bbbafdbb82b62c082324042222bab1322cfbcfbd44e34e0`; input `1eaaf354541fc9e878f6d85a403608d9ddece566f0b4e533542096ea6165e563`. Все 20 файлов immutable app проверены до и после подстановки в host независимого runner.

201/correction, privacy/keyboard flow, другие server field errors, compact/large, полная регрессия и gates не повторялись. VoiceOver не запускался и не проверялся. Старые pass к R6 не переносились. Приложение завершено test defer, собственная fixture остановлена; исходная настройка software keyboard 1 восстановлена, lock освобождён ([cleanup](cleanup.json)). Source/device свободны.
