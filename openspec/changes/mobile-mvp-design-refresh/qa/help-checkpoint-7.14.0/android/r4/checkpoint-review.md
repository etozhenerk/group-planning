# Android help/support R4: picker pass, небольшой visual finding

APK/source привязаны candidate.json и совпали до/после (binding JSON).
APK:d14425eba4d73be91be4571465707722bfcb5f49f0f751c3a5d416e2028599d2.
Source:74161474e27524be8c278cf2d26b7d30dd548a9f5f3888ce042c9c463ab167ea.
TestAPK:2bb1c1af98f94a8b9064aed275e5204f2a3d58450fae289c3c783fb188b51253.
emulator-5554,720×1600,density320,font1,animator explicit1.0; прежний изолированный
memory fixture127.0.0.1:64284,nil notifier. Поддержке не отправляли сообщения.

## Функциональный targeted результат

**PASS19.014s:** единственный canonical
SupportServiceUiTests#systemScreenshotCancelSelectionAndRemovalPreserveDescription.
picker.log: OK(1test). Дождались ready формы, ввели и подтвердили реальный текст;
две отмены настоящего picker сохранили описание; системный выбор вернул synthetic
PNG128×128/MAGENTA, decoded bytes/pixel проверены; новый remove content description
удалил screenshot и сохранил сообщение. Evidence извлечены в evidence/.
Три boundary R3 не повторялись и не объявляются pass нового общего кандидата.

## Дизайн spot

Перед picker через реальный профиль открыт support. На старте восстановился
собственный synthetic screenshot, оставшийся после failed-remove R3; он удалён
настоящей кнопкой без правки модели. Поэтому initial empty-attachment.png фактически
показывает этот остаток и **не является empty evidence**. Правильные actual:
empty-attachment-glyph.png/xml; действия записаны в actions.json.

Ревьюер просмотрел actual и empty-attachment-reference.png, снятый с опубликованного
normalized help-r2 через обычный переход contact. Paperclip21 соответствует raw
FeedbackAttachment.tsx. Есть небольшой **needs-fixes visual finding**: raw dashed
attachment центрирует группу icon+text внутри кнопки (reference icon≈x86dp,
text≈116dp при360), Android группа начинается с leading inset (icon≈35dp,
text≈67dp). Передано root; это не препятствие успешному функциональному picker.
Reference и actual имеют разный scroll/native safe area; сравнивается локальная
композиция attachment, pixel-identical всего viewport не заявляется.

Два первоначальных reference capture ожидали точный текст span, включавшего
подпись форматов, и истекли; corrected accessible button locator дал reference.
На Android это не повлияло. Никаких новых runtime matrices не запускалось.

## Release

Приложение остановлено, animator возвращён к исходному null; source/device
освобождены. Ревьюер менял только QA-папку и собственный tmp. Full matrix,
актуальные design/QA gates и закрытие задач остаются общему финальному кандидату.
VoiceOver/TalkBack не запускались.
