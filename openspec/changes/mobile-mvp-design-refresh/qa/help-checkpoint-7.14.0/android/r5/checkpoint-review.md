# Android help/support R5: visual delta подтверждён

Frozen APK:bfc0d095e4ce23713d28c1d54e123085fb2a600660e268cb5e56ea59e0982a37;
source:5800192cacbf9ccd0132e1f08c72cb9241d6f9baba422db9d75cf4c717164b95.
Before/after binding совпали. emulator-5554,720×1600,density320,font1;
прежний изолированный memory fixture. Настройки motion/размера не менялись.

**Pass только запрошенного visual delta**, не общий screen/gates pass:

- Actual empty-attachment.png/xml просмотрены рядом с опубликованным
  empty-attachment-reference.png. Paperclip21 и текстовая группа теперь
  центрированы внутри dashed button, пунктирная граница видна поверх Surface.
  R4 centering finding устранён в проверенном размере. Нативная подпись форматов
  и системный font могут менять локальную ширину группы, не сдвигая её к leading.
- Через настоящий system picker один раз выбран собственный synthetic MAGENTA
  PNG128×128. Actual selected-attachment.png/xml просмотрены вместе с
  selected-attachment-reference.png: preview имеет явно видимые8dp углы,
  соответствует локальной композиции reference. Reference получил тот же PNG
  через обычный file input прототипа, эталонный код/стили не менялись.
  Android picker переименовал отображаемый файл в1448.png; это не расхождение
  формы превью и не выдуманная продуктовая fixture.

actions.json фиксирует реальные действия. Ни canonical runner, ни boundary,
cancel/bytes/removal acceptance повторно не запускались. После capture выполнена
только очистка собственного attachment через UI и своего Download-файла.
Ничего поддержке не отправлялось. App force-stop, source/device освобождены
сразу после снимков. Отдельный reference capture выполнен уже без устройства.

Прежние R3/R4 функциональные результаты сохранены со своими hashes и здесь не
объявляются pass нового общего кандидата. Полная матрица/актуальные gates остаются
финальному этапу. Продукт/тесты/кейсы/эталоны ревьюер не менял, только QA/tmp.
VoiceOver/TalkBack не запускались.
