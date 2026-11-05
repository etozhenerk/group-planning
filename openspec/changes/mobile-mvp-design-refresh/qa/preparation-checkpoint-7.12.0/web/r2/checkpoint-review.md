# Preparation7.12 web r2 — два visual bindings

Textarea исправлена: actual/reference16px/23px/400 при320 и390. Recipient wrapper32×32 и chevron18px/muted #b9b9c2 также совпали.

Остался **F1/P3: people glyph22×22 вместо raw20×20**. Внутри32-slot actual inset5px против raw6px; источник actual — componentMobileChatIconSize22. Accent цвет glyph совпал. Computed DOM: probes.json, computed-bindings-390/320; actual/reference PNG обеих ширин сохранены.

Только visual delta:4records/errors=[]. Для открытия пустой формы создана изолированная fixture meeting через API; task create/unknown/API/navigation acceptance не повторялись. Прежние passes не переносятся на новыйhash. Общий structural design:check67 не повторялся: используется текущая root запись /tmp/preparation-design-check-7.12.log; собственный fresh design:context сохранён.

Source before/after=candidate `6da9c6649c47c3a7f6ea6754ddbab2ac0d45be1e006ea848a9645c2d0eae0a09`; artifact `0a0ffff696da1f42e2204ae1a2d891d73a4d3a106f258ae8cb6255849cb0d1ed`; designInputHash `0610a438ab01e325b3e216d983741c767e9f2d851c04b3779137bc220a367243`.261 disk/38 live assets совпали; HTML backend metadata transforms учтены. SHA originals/report/driver — evidence-sha256.json. Source released, браузеры закрыты, сервер не остановлен. App/code/tasks/Git не менялись; final gates не заявлены.
