# Изоляция разрушительного теста

Финальный experience-revocation PASS 8.366 с. QA запускает отдельный
vibe-revocation-owner с собственным альбомом, удаляет только его аккаунт
и проверяет переход на онбординг/отсутствие фотостопки.
Настоящий GET /me после удаления остаётся успешным для design/feed-owner.
Общие профили полного UI-набора не повреждаются. Система/production не менялись;
новый scenario разрешён только в QA RuntimeFactory. FormatApply и QA compile PASS.
