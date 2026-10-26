# Предварительный web review: дополнительные состояния

Source pre-run hash `36fb296bafd5bb1f59343a2beddc6650ba5c2492c46a07c7f86ded7789b94a88`.
Production dist собран исполнителем после исправления трёх предыдущих замечаний;
независимый reviewer запустил отдельный test-only API и свои Playwright-сценарии.
Это не окончательная freeze. Metadata и журнал записаны рядом со снимками.

## Поведение

На всех четырёх ширинах выполнены owner/member info, settings close/reopen,
share copy (сверено фактическое содержимое clipboard), reaction-people open/close,
photo draft close/reopen, controlled503 и retry, settings lost-response error/retry,
task accept failure/retry. Повтор settings/task проверен на равенство request key
и body; реальные секреты/ключи в журнал не записаны. Для мутаций созданы отдельные
QA-встречи. Общая визуальная fixture чата не менялась. Список аккаунта после
создания QA-встреч уже не исходный seed: перед следующей базовой серией runtime
необходимо перезапустить для чистого memory.Store.

Первый file-preview сценарий на всех четырёх ширинах завис на ожидании hidden
после первого крестика. Файл был выбран сразу при filechooser event. Повтор
`web-file-stable-36fb296` дождался `action=file` и окончания opening до выбора:
close/reopen с подписью и503→retry прошли на всех ширинах. Следовательно, найдено
условие гонки при очень быстром возврате file chooser; обычный сценарий после
стабилизации панели работает. Возможный источник — два navigate и устаревший
location при проверке replace в useUploadSelection.begin; это гипотеза по чтению
кода, а не доказанное измерение истории. Первый сбой и успешный контроль сохранены.

Два desktop failures profile-link были ошибкой harness: глобальный selector видел
ссылки sidebar и профиля. В контрольном прогоне selector ограничен main;
переходы/снимки service-links успешно выполнены. Это не дефект приложения.

## Лично просмотренное и расхождения

Точный список лично просмотренных PNG — `image-inventory.json` (true/false).
Сохранение снимка не равняется его просмотру.

- `settings-open-320.png` / `settings-320-reference.png`: фон sheet — color.background,
  а raw create panel и `chat-actions.md` задают color.surface. Обычный Dialog
  использует var(--background); action Dialog отдельно получает surface.
- `info-organizer-320.png` / `info-320-reference.png`: actual не показывает название
  текущей встречи и действие «Пригласить друзей». Оба есть в meeting-details.html;
  UX-коррекция удаляет сервисные ссылки, но не эти данные/действие. В actual видны
  обложка, когда/где, шесть участников и настройки, позади чат размыт.
- `share-open-320.png` / `share-320-reference.png`: подпись CTA regular, raw .button
  имеет font-weight600. ShareForm CSS не задаёт weight, base button наследует
  body. Подобное отличие видно у settings CTA. Передано исполнителю.
- **Двойной desktop panel/inset у file/share.** `web-file-stable-36fb296/upload-file-open-1440.png` начинает карточку файла наx582 противx555 в raw при одинаковом outerx529. `share-open-1440.png` имеет тот же дополнительный отступ26px (x581 противx555). Dialog.page .panel добавляет26px поверх собственных26px MediaUpload/ShareForm. Raw имеет один panel/inset; передано как геометрическое расхождение.
- File/photo preview на320 сохраняют структуру карточки файла/миниатюры, удаление,
  подсказку видимости и кнопки; фото не получает подпись. Одна QA-фотография вместо
  двух в raw — заданный сценарий, не потеря выбранного элемента.
- Share button системной отправки не показана при недоступном navigator.share;
  копирование работает. Это платформенная доступность API, не UI-дефект.
- `settings-open-1440.png`: CTA частично ниже viewport. Само по себе это не дефект;
  runner доскроллил и сохранил. Отдельно требуется проверить header/close при scroll
  на высоте844/крупном тексте. Нельзя принимать эти состояния по кадру1000px.

Три предыдущих замечания устранены в лично просмотренных новых basic кадрах:
`web-basic-36fb296/menu-320.png`, `list-320.png`, `action-place-390.png`.
Остальные новые basic кадры пока не помечены просмотренными.

Окончательного pass нет, pixel regression не запускалась, реальные mobile IME,
large-text, access-revoked и reduced-motion этими сценариями не покрыты.

Дополнительно просмотрены task-details open/error на320: inline-действия соответствуют явному исключению контракта для существующих inline task buttons, ошибка видна и сохраняет состояние. Reaction people на320 показывает два имени с emoji и крестик; её raw chat-reacted показывает контекст реакций, но не отдельный список, поэтому pixel-identical сравнения списка нет.

Дополнительно лично просмотрены basic пары date1440, task768 и list768. В list768 полностью видна карточка без обложки; роль цвета/плашка даты/аватары сохраняются. Две даты и отдельные дата/время дедлайна в actual date — сохранённые бизнес-поля по latest UX, старый raw с одной датой не отменяет минимум двух вариантов. Колонка date1440 и task768 имеет один panel/inset, в отличие от описанного выше старого upload/share. Новых расхождений в этих трёх парах не найдено; это всё ещё предварительное наблюдение текущей волны.
