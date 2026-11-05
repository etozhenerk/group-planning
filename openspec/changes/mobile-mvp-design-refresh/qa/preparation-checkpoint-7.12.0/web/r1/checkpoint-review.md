# Preparation7.12 web r1 — corrections delta

Главные исправления подтверждены; остались два P3 формы.

- **F1 / P3:** recipient people SVG32×32 против raw20×20; chevron actual accent #d6cce9 против raw muted #b9b9c2. Recipient control64/r14/font14/400 уже совпал. Наблюдается при390 и320, form-390/fieldhint-320 actual/reference и computed в probes.json. Это остаток прежнего icon finding.
- **F2 / P3:** после выделения TaskTitleField textarea наследует weight500 от .field вместо raw400. Actual16/24/500 против raw16/23/400; bold placeholder виден при390/320. Height86/r12/padding12 совпали.

Фактически: обычный POST201→через650ms тот же chat; отдельный lostACK после real commit→exactretry с тем же key/body также тот же chat. Два разных create-events соответствуют двум намеренным задачам; неизвестный результат не создал дубль. API known-error/accept/complete/Date/desktop из предыдущего checkpoint не повторялись и pass новогоhash им не присваивается.

Card action теперь занимает100% content width (actual296px при390; raw288px внутри собственной карточки), height44/r10/font13/600 сохранены; status icon19 совпал. Form submit48/r14 совпал. Decorated FieldHint12/18/400 muted, отдельный error icon14 и gap7 совпали; required focus на textarea.

Confirmation320: task title, принятой raw consequence copy, body/footer, action48/r14, Keep44/font13/muted, одна modal-панель, без горизонтального overflow. Browser Back из actual cancel-confirm возвращает в details; API offered/revision1 неизменны. Raw confirmation получен настоящими кликами self card→details→cancel, не URL-only selector. Прозрачный Keep имеет actual radius12/raw14; это сохранено в computed как малозаметное наблюдение, не отдельный существенный дефект. Короткая форма с действием в потоке без отдельной тени соответствует текущему пользовательскому правилу.

8 records/errors=[]. Chromium390×844/320×760; только запрошенная дельта. API fixture meeting setup изолирован, production/реальные адресаты не используются. Реальная IME/VO/WebKit/полный каталог/200%/RM не проверялись.

Source before/after=candidate `d852f82b73acf377f2ddfa5d055cefdea1dc56e66d2df7fd9bae1c011332df83`; artifact `91fa40f11c6d393ed4451d491852da04d627101330955c864dc52b80ee7d0ef4`; designInputHash `3e2bf121ccda2981b62ca7f1b070d709a4349ab5d3a0e648a7df50b73dfce66e`.261 disk/38 live hashes совпали; backend HTML metadata transforms учтены. Fresh design:context сохранён; design:check ok, только структурная проверка. SHA originals/report/driver в evidence-sha256.json. Нет final gates/checkbox changes. App/code/tasks/Git не менялись; source released, браузеры закрыты, сервер не остановлен.
