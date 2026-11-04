# Готовая функциональная часть web9.4

Сверка04.11.2026, без повторного запуска уже успешных проверок.

| Case | Фактический результат | Исходные подтверждения |
| --- | --- | --- |
| TC-MEDIA-WEB-FORM-FIRST | Фото/файл сначала открывают форму, без автоматического OS picker | 2026-11-02-sequential-native-cancel/9.1.md; 2026-11-03-visual-hour/result.md |
| TC-MEDIA-WEB-PICKER-CANCEL |24 настоящие OS Cancel, выбор/подпись/форма не теряются | 2026-11-02-sequential-native-cancel/9.1.md |
| TC-MEDIA-WEB-FORM-FOCUS | Space/Enter, возврат focus, Tab против pointer, черновик/selection | тот же9.1; 2026-11-03-web-final-surfaces/result.md |
| TC-MEDIA-WEB-COMPACT-DIALOG |320/390/768/1440, low-height/zoom300%, доступная отправка | тот же9.1; 2026-11-03-visual-hour/result.md |
| TC-VIBE-WEB-DIRECT-UPLOAD | Прямая форма из баннера, одна запись истории, без промежуточного экрана | 2026-11-02-sequential-native-cancel/9.2.md |
| TC-VIBE-WEB-UPLOAD-CANCEL |12 настоящих OS Cancel, выбор сохраняется, возврат восстанавливает чат/черновик/selection | тот же9.2 |
| TC-VIBE-WEB-FULLSCREEN-CONTAIN | Полное фото, portrait/landscape/square, узкий/низкий viewport, возврат индекса/фокуса | 2026-11-03-web-vibe/result.md; 2026-11-03-web-final-surfaces/result.md |

Все пути относительно родительского qa/. Это исходные результаты с их датами,
не новый прогон04.11 и не новые source/capture hashes.

Обязательные suites сохранены в2026-11-02-web-completion-independent/report.md
и последующем2026-11-02-sequential-web-completion/result.md: web-check/build,
основной browser-набор, chat/read/window; адресные повторы только исправленных
или изолированных сценариев. Поздние UI-уточнения проверены03.11. Текущая работа
04.11 не меняла web-продукт, media-формы или их утверждённый дизайн.

Общий design:ready/qa:ready остаётся незавершённым: соседний новый редизайн
без manifest и устаревшие глобальные acceptance plans. Зелёного gate нет.
04.11.2026 пользователь явно разрешил закрыть9.4 по этой сводке с разовым исключением из требования
feature-test «До checkbox выполни qa:ready, для UI также design-review/design:ready»;
общая0.3 остаётся открытой. Независимый reviewer и новый PASS не выдумываются.

Решение пользователя: «Да, исключение только для 9.4». На другие задачи и выпуски не распространяется.
