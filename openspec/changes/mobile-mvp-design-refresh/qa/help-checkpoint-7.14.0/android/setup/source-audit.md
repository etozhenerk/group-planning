# Android help/support: предварительный аудит исходников

Дата: 06.11.2026. Независимый read-only проход по `help-r2`, подготовке в этой
папке и текущему изменяемому `ui/service`. Это не frozen-кандидат, не runtime и
не приёмочный pass. Продукт, тесты, кейсы и эталоны ревьюер не менял; сборку и
устройство в этом проходе не запускал. Применены design-review и feature-test
в части подготовки; обязательные живые действия остаются после handoff.

## Замечания до freeze

1. **Невидимая локальная ошибка email.** `SupportViewModel.send()` при неверном
   непустом email ставит `validation=true`, но не заполняет `fieldErrors`.
   Новый `SupportForm` определяет error border/email hint только через
   `"email" in state.fieldErrors`. При локальной ошибке фокус перейдёт к email,
   но подпись и поле останутся обычными. Нужна та же локальная проверка email
   для error UI либо согласованное заполнение fieldErrors. Аналогично учесть
   server field error description: сейчас descriptionError зависит только от
   локального ограничения длины, хотя first-focus учитывает fieldErrors.
2. **Выход с receipt через header/system Back не очищает форму.** Единственный
   reset находится в callback кнопки `SupportSuccess` («К помощи»). Header
   использует `close`, system Back — `ServiceDialog.back`; оба обходят reset.
   После успешного send модель сохраняет receipt и frozen=true; повторный
   Help→support может вернуть прежний receipt, а edit(kind) будет проигнорирован.
   Проверить и привести все выходы результата к согласованному чистому повтору.
3. **Description error locator.** В последнем прочитанном `SupportForm`
   `support-description-error` прикреплён к Text email hint, а не description
   error. Перенести условный tag на сам текст ошибки сообщения; обычный hint
   не должен давать ложный error pass.
4. **Section sheet: клавиатурный/focus scope не подтверждён.** В `ScreenSelector`
   есть trigger/sheet tags, восемь правильных keys, визуальная выбранность и
   применение по click. Явного arrow/Home/End поведения, selected/radio semantics
   и возврата focus к trigger нет. Это source gap для последующего живого прохода,
   не доказанный runtime fail. По raw стрелки/Home/End перемещают focus без
   применения, Enter/Space выбирают без отправки формы.
5. **Небольшие расхождения с raw.** Help contact использовал Help/CircleHelp
   вместо MessageCircle24 и не имел ArrowUpRight18 после действия. Footer
   использовал MessageWarning вместо TriangleAlert18. В ходе аудита root уже
   заменил footer на ChatSymbol.Alert и вернул опубликованный upward dropShadow;
   эти правки ещё не проверены на устройстве.

Первоначальные compile-находки (Dp вместо TextUnit, FontWeight Float, import Box)
переданы исполнителю отдельно; root сообщил об исправлении и зелёной сборке.
Ревьюер её самостоятельно не запускал и не выдаёт за функциональный результат.

## Что уже видно в структуре, но требует runtime

- SaveableStateProvider(page), saveable FAQ expansion и scrollState дают
  предусмотренный путь сохранения FAQ/support при privacy→Back. Модель формы
  находится выше переключаемого содержимого. Реальные scroll/focus/Back после
  recreation и privacy всё равно должны быть пройдены.
- Поля, topics, screenshot remove/picker и diagnostics блокируются busy/frozen;
  unknown retry сохраняет существующие pending body/key. Это не доказательство
  lost ACK: нужен реальный server commit→lost response→retry с тем же receipt.
- Выбранный screenshot использует сохранённые bytes; удаление меняет только
  screenshot. Проверить существующим настоящим picker-тестом и actual selected.
- Footer имеет отдельные in-flow/sticky ветки. Проверить real overflow и bounds
  при scroll/IME; условие pinned сравнивает content+footer с viewport, тогда как
  keyboard bar измеряется отдельно, поэтому пограничный размер требует наблюдения.

## Точные адаптации существующей каноники

Основной список и команды уже сохранены в README этой папки. Новых runners нет.

- `SupportBoundaryUiTests.selectContext`: вместо старого `isPopup()` использовать
  ancestor `support-section-sheet`, trigger `support-section-trigger`; сохранить
  kind=idea, screen=meeting_chat, граничные9/10/3000/3001 и реальные POST counts.
- Boundary/Keyboard: локатор `support-description-error` должен указывать на
  текст ошибки сообщения. Не принимать email hint за эту ошибку.
- Старый exact «Яндекс ID» заменить актуальным profile trigger; видимые «Назад»
  и brand на help/support заменить текущим PageBack/его bounds ниже status bar.
- Success: «Обращение принято», отдельные «Номер обращения» и настоящий reference;
  сохранить DTO accepted/id/reference и фактические POST assertions. Чистый
  повтор — «К помощи»→help→«Написать в поддержку», не support_another.
- Screenshot removal: content description `support_remove_attachment` вместо
  прежней видимой `experience_remove`; сохранить проверку настоящих decoded bytes.
- FAQ: существующий AccountDeletionUiTests disclosure/recreation/Back не заменяет
  ручной FAQ→support→Back с сохранением scroll/open state.

## Ограничения

Только isolated memory support + nil notifier; реальных получателей нет.
Lost ACK не заменять обычным network outage. Полная матрица, reduced motion,
актуальные design/QA gates и все платформы — отдельный финальный этап.
Desktop, maps и VoiceOver/TalkBack вне этого Android прохода.
