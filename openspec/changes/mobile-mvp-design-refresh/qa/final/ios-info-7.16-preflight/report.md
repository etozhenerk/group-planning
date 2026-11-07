# Info/Roster7.16: независимый bounded preflight

**Пройден targeted scope:3метода PASS17.123/15.975/36.258s, exit0.** Просмотрены actuals6состояний на402×874: detailsloading/error/ready и rosterloading/error/ready. Это preflight до нового formalplan; старый R11 не превращается вPASS.

Source `ff9a21ec38f833f0cf60488d0df8d45124400de96544ae3052c6fb2cae9ea4e6`; отдельный QAhost `7de558dc1c9102185c78d2194b4cf8e5b13e3638206fefbc213f711694930750`/20files, установленный bundle совпал20/20. Продукт/UI-host support скопирован из актуального root с per-fileSHA в product-source-snapshot.json; отдельный QAoverlay — drivers/Info716PreflightTests.swift. Rootproduct/canonicaltests/каталог не менялись ревьюером.

- Details loading показывает skeleton с «Загрузка встречи», вместо прежних cover/facts; рольfooter отсутствует целиком. Error показывает отдельную принятую карточку «Встреча не загрузилась»/пояснение/retry без stale readybody/rolefooter. После снятия503gate и retry возвращается ready.
- Roster loading показывает три skeletonrows; header/count остаются. Error «Не удалось получить ответы.» имеет доступный retry; retry реально возвращает roster.
- Expanded member roster→responsechild→«К деталям встречи» сохраняет раскрытие и позицию: collapseanchorY710.1666666667→710.1666666667. Риск обычного child-return в данном проходе не воспроизвёлся.

Actual PNG/AX/capturecontexts — actual/; runtime.log и groups/info716/runtime.xcresult сохраняют действия/проверки, candidate.json/installed-binding.json — точный runtime. Состояния normal402 memberrole; narrow/AXlarge/reduced/revoke-during-load/organizer-вариант и весь284/821 набор не повторялись. Не заявляется pixelregression или готовность mandatorysuites этой ревизии. Off/onVoiceOver/activation и policy/logout не затрагивались.

Своиfixture/lock завершены, keyboard восстановлена; app закрылся вdriverdefer, source/device освобождены. Новых runtime не требуется до следующего handoff.
