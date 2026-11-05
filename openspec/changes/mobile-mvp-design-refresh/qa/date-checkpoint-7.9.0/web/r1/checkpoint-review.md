# «Предложить дату» web7.9 r1 — короткий independent checkpoint

Три findings для одного пакета исправлений. Остальной перечисленный smoke прошёл; это не полный каталог/матрица и не финальный gate.

1. **D1/P2 · Карточка ещё старая.** Actual использует «Предлагает изменить дату / Новая дата встречи», старую композицию вариантов/голосования/типа опроса. Published nav-date/date-r1: «Опрос / Когда встретимся?», h3 20/700, принятые note/options/footer и внешний actor/time. Root отдельно подтвердил этот известный недоперенос; множество состояний старой карточки не прогонялось. Evidence: `created-card-actual.png`, `real-vote-actual.png`, соответствующие card text/HTML в `checkpoint-probes-menu-fix.json`.
2. **D2/P2 · Не перенесены bindings формы.** На320 actual deadline — одна колонка280px/gap10: Date и Time друг под другом; ref134+134/gap12 в одной строке. На390 actual Date209.22/Time130.78 вместо ref169+169. Пять switch rows actual min-height48/font14/line21, ref44/font13/line19.5. Из-за этого конец формы заметно плотнее сдвинут вниз. Evidence: `form{390,320}-{actual,reference}.png`, `deadline320-{actual,reference}.png`, точные computed `form-metrics.json`.
3. **D3/P2 · Пустая обязательная deadline Date не получает field error/focus.** После очистки дня submit блокируется, но только footer alert «Выберите дату и укажите время встречи.»; Date остаётся `aria-invalid=false`, describedBy не содержит error, focus — «Создать опрос». Нужны ошибка/first-invalid focus у поля окончания опроса и контекстный текст про срок опроса. Proof: `deadline-date-required-actual.png`, `deadline-validation.json`. Вариант даты при duplicate, напротив, получает корректный invalid/describedBy/focus. Пустое deadline Time останавливается штатной required validation и фокусирует Time.

## Подтверждено живым smoke

-390/320 без horizontal overflow; все5 controls доступны. Default values true/true/true/false/false, каждый toggle меняет состояние и возвращается обратно.
- Add третьего/удаление среднего не путают оставшиеся варианты12/14ноября. Duplicate показывает ошибку именно второго варианта и переводит туда focus. Dirty Escape/Stay и Back/Leave используют один Dialog; после Leave новое открытие имеет исходные даты12/13.
- Deadline date/time обязательны. Выбранный local07.11.2026 19:30 Europe/Moscow отправлен с+03:00 и сохранён как16:30Z; подпись TZ есть.
- Known429 сохраняет варианты/settings. Retry выполнил реальный create201, после которого намеренно потерян ACK; поля effectively locked, Escape не закрыл форму. Unknown retry использовал тот же body/key; сервер сохранил один poll/одну feed entry.
- В той же настоящей карточке выполнен UI vote: my_vote_revision1, одна выбранная option, votes1/0. Anonymous=true/hideResults=false: counts видны, voters=null и имён голосовавших в card нет.

Основной успешный журнал `checkpoint-probes-menu-fix.json`:16 наблюдений/errors=[]. Первый подготовленный driver ожидал роль button у пункта ActionMenu; исправлен только QA locator на menuitem, оригинальный нулевой журнал сохранён. Это не дефект приложения. Hidden-results privacy отдельно не принималась, как и закрытие по сроку, majority/tie/resolution, все сочетания пяти settings, native IME/VO/другие платформы.

Источник: approved id `date`, `assets/navigation-r2/nav-date/frame.html`, SHA `d7cad22cc2b714c4c7b929544fbc64b61bbc31e238a2312bba1592a0c08487a2`; normalized `preparation/references/date/frame.html`, состоянияform/poll.

Frozen source `a081de0ab392fbc6c989f598535ab0b16fd1aa78968e4e566267d15db215de12`, artifact `a5a45b2992738b2adee617a05fc642c4ee2fee11cff02b4934a07a9e43829888`,8905. Source before/after=candidate, disk hash совпал до/после;261 disk/38 live assets совпали (`artifact-binding.json`). SHA evidence — `evidence-sha256.json`. App/manifests/tasks/Git не менялись, архивов/gates нет. Source освобождён; runtime завершён.
