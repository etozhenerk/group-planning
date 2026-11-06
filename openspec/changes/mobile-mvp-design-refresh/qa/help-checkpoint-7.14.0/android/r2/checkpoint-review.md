# Android help/support R2: ручной checkpoint, canonical adaptation pending

Frozen candidate: candidate.json. Source/APK совпали до и после (binding JSON).
TestAPK SHA256:5c5989599f035c0dc605cd441f9b363c719834a998497aa9639cb6240ee14a01.
emulator-5554,720×1600,density320,font1, animator1.0; memory fixture127.0.0.1:64284,
nil notifier. Реальных сообщений поддержке нет, принятого POST в этом проходе нет.

## Выполнено

- Canonical FAQ disclosure→recreation→Back **pass**. В комбинированном запуске
  faq-picker.log9.369s этот кейс прошёл; picker — нет.
- Три SupportBoundaryUiTests открыли настоящий профиль/форму и выбрали idea/chat,
  но упали до отправки на performScrollTo sticky submit: у кнопки теперь нет
  scroll ancestor. boundary.log. Это адаптация каноники, не доказанный дефект UI;
  Unicode boundaries и lost201ACK всё ещё **не приняты**.
- Canonical picker получил пустой EditableText на первой отмене. Отдельная
  ручная проверка через реальную IME: `Manual screenshot draft` виден до и после
  скрытия клавиатуры, открытия системного picker и Back cancellation. Evidence
  manual-draft-*, manual-picker*. Общая потеря текста вручную не воспроизведена;
  root добавит ожидание окончания loadDraft/busy и подтверждение текста до picker.
- Privacy→system Back сохранил тот же текст и нижнюю позицию формы. Сняты
  manual-privacy и manual-after-privacy. Никакого прямого редактирования модели.
- Section-sheet:8 видимых labels, selected profile/check; Back cancel сохранил
  profile, повторное открытие и выбор chat обновили поле и сохранили текст.
  manual-section*, actions.json. Аппаратные стрелки/Home/End не проверены.
- Sticky send сохранял нижние bounds при настоящей прокрутке формы; последнее
  содержимое доступно выше footer. In-flow на высоком viewport ещё не проверен.
- Дополнительный ручной FAQ→support→Back сохранён в actions.json и
  manual-help-collapsed/manual-faq-return; collapsed answer не открылся заново.

## Дизайн и ограничения

Просмотрены actual формы/section и approved support-reference.png (нормализованный
help-r2, настоящий переход по contact,360×800,dpr2,Android48 target).
Композиция полей, выбранная строка, attached footer/верхние углы и текущий shadow
без нового видимого blocker в выполненном scope. Нативный system font/sp по
docs/design/platforms.md объясняет переносы; literal pixel equivalence не заявлена.
Receipt/unknown/selected attachment actual ещё отсутствуют: нет design pass для них.

R1 shared profile label исправлен: форма открывается по согласованному
«Сообщить о проблеме». Реальный receipt/reset/lostACK и screenshot bytes ждут
следующего короткого запуска с адаптированным testAPK. Large/reduced/320 и
полная матрица/актуальные gates остаются финальному этапу. VoiceOver не запускался.

Ревьюер менял только эту QA-папку. Приложение остановлено, animator restored null;
source/device освобождены для test-only исправления. Чекбоксы и gates не закрыты.
