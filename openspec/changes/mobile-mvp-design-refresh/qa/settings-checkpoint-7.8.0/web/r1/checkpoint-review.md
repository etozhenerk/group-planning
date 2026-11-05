# Settings web7.8 r1 — независимый короткий checkpoint

Три подтверждённых finding: S1/P2 forbidden теряет всю встречу, S2/P2 mobile conflict-review не соответствует published composition, S3/P2 отсутствует focus первой ошибки. Остальные перечисленные ниже пути прошли в ограниченном smoke. Финальные gates/приёмка manifest не заявляются.

Источник: approved id `settings` → `assets/navigation-r2/nav-settings/frame.html`, SHA `fa310b05a29a175033d925de8a88d246d2a89167ad3357cc2be5b8d4add390e3`; normalized `preparation/references/settings/frame.html`. UX settings-r3 имеет приоритет над старой формой.

## Findings

1. **S1/P2 · PATCH403 закрывает весь chat вместо forbidden settings.** После известного403 до commit видна «Переписка закрыта», кнопки возврата к информации нет, Dialog формы отсутствует. Независимый protected GET той же встречи после этого отвечает200. Общий `guarded` на любой403 вызывает `denyAccess`, поэтому предусмотренное `form.forbidden` содержимое не успевает стать доступным. Нужно различать отказ редактирования и потерю доступа к самой встрече; при сохранённом read-access показать принятый forbidden state/возврат Info. Proof: `forbidden-observed-actual.png`, `checkpoint-probes-final.json` → forbidden-observed, readStatus200/returnInfoButtonCount0. Инъекция403 проверяет клиентскую ветку; реальная передача роли fixture не поддерживается.
2. **S2/P2 · Mobile conflict-review использует старую desktop-композицию EditConflict.** Actual добавляет крупную обложку и меняет иерархию caption/remote title, а объяснение не сообщает об автоматическом принятии untouched полей. Published review не содержит cover. Точные accepted values: H3 «Сейчас во встрече»12/line13.8/500/muted, margin24 0 8; H4 remote title23/30/700/text, margin0 0 24; P14/22/400/muted, margin28 0 0. Текст: «Ваши правки остались в форме. Обновлённые поля, которые вы не меняли, подставятся автоматически». Proof: `conflict-review-{actual,reference}.png`, `review-reference-metrics.json`. Сам rebase работает: local title сохраняется, untouched дата принимает серверное08.11.
3. **S3/P2 · После invalid submit focus остаётся на «Сохранить».** Пустое название получает hint и aria-invalid, но activeElement — submit button. Контракт `docs/design/components/mobile-mvp.md:46` требует первый ошибочный focus, связанный с полем. При нижнем footer/коротком viewport ошибка может оказаться вне видимой области. Proof: `required-actual.png`, `checkpoint-probes-followup.json` → required.actual.active/fields.

## Что проверено

- Ready390: реальный API cover, компактная карточка86, поля16px, required legend/звёздочки, без лишней стрелки к информации.320 без horizontal overflow; footer учитывает overflow.390×430 с focus — resize proxy IME, не настоящая мобильная клавиатура.
- Dirty Escape и browser Back → одно confirmation-содержимое в том же Dialog; Stay сохраняет локальный title, Leave возвращает подтверждённые данные; повторное открытие не восстанавливает отброшенное.
- Реальный PATCH → Info/«Изменения сохранены»; новый вход Settings очищает прежнее сообщение.
- Реальный revision conflict после отдельного API PATCH → отдельное review без input формы → resume сохраняет local title и принимает untouched remote date08.11.2026 → повторный PATCH подтверждает оба значения.
- Known429 оставляет редактируемую форму; Retry реально сохраняет.
- Адресный unknown: реальный commit200 + потерянный ACK; поля effectively disabled, после стабильного состояния Escape не закрывает форму, same-key Retry возвращает Info без второго увеличения revision (commit/retry revision7).
- Date popup320 x8,y290,w304,h462,bottom752 в760, Done696..740. WebKit390: настоящим Date picker выбрано09.11.2026→форма; dirty Escape→Stay сохраняет дату/один Dialog. Desktop1100 spot сохраняет desktop-композицию без нового mobile оформления.

## Ограничения и привязка

В первом длинном сценарии immediately-after-Escape check unknown дал false, после чего Retry locator не нашёл кнопку. Отдельный адресный повтор со стабилизацией600ms подтвердил guard и same-key retry; исходный след сохранён в followup, устойчивый дефект не заявлен. Timing concern остаётся ограничением этого checkpoint. Остальные технические остановки: точный hint locator ожидал точку, которую FieldHint убрал; затем ожидаемый forbidden alert не появился именно из-за S1. Исходные журналы сохранены.

Coverage/evidence: основной `checkpoint-probes-followup.json`, ещё не пройденные spots `checkpoint-probes-remaining.json`, адресный unknown `unknown-repro.json`, forbidden/WebKit/raw review `checkpoint-probes-final.json`. Последние два driver errors=[]. Загруженный cover проверен; replacement/remove/preparing worker в этом settings smoke отдельно не принимались. Нет Create/RSVP/chat/read/VO/full matrices/suites/gates.

Frozen source `130b083f2fe87adec2ee48ade0829edfcb246c20c9265e1996ca5f989b853efa`, artifact `77d8f5eb0e3d87f31d5e37eaf6b79030ad6e9abb7eebef2024ea94feb74d9c54`,8903. Source до/после совпал с кандидатом;261 disk/38 live assets совпали (`artifact-binding.json`). SHA — `evidence-sha256.json`. App/manifests/tasks/Git не менялись; diff-check чистый. Архивов нет; кандидат освобождён.
