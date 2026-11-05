# «О встрече» web7.7 r1 — короткий независимый checkpoint

Один существенный визуальный остаток: **I1/P2 — блок компании использует компактный вариант chips/heading вместо info-r2**. Функциональных дефектов в проверенных путях не найдено. Это checkpoint, не финальный design/feature gate.

Источник: approved-designs.json, id `info`, published input `assets/navigation-r2/nav-info/frame.html`, SHA `50134bd51808f231b90b38561a4b2a8c99039b49b00f3a9e8b55848e98aea4a4` — «Основа info-r2 + общий Back». Нормализованный raw: `preparation/references/info/frame.html?platform=web&state=organizer`, просмотр через8875. UX info-r2 и conversation-web manifest использованы для области проверки; матрица manifest не принималась.

## I1: точные значения компании

Fresh computed после fonts-ready/окончания transition — `company-metrics.json`. Evidence: `organizer390-{actual,reference}.png`, `member390-actual.png`, `company-expanded-actual.png`. Название «Компания» само по себе не является finding: UX описывает компанию; различаются композиция и типографика.

| Элемент | Actual | Approved reference |
| --- | --- | --- |
| Heading |12px/500, line13.8, muted #b9b9c2|16px/600, line18.4, text #f5f4f1|
| Heading → chips |0px|12px|
| Person chip |height31, radius30, padding3px 10px 3px 3px, border2 surface|height36, radius12, padding6px 10px 6px 6px, border0|
| Group gap |0|6px; у2/3 остаётся margin-left−4|
| Chip text |11px/400, line16.5, #302c2b|то же|
| Chip backgrounds |соответствующие системные роли|1:#c6b4a5,2:#c9bfd9,3:#b5c9bf|
| +N |в данном fixture нет четвертого приходящего|height36/min-width40, radius12, padding6px 10px, bg#24252a, border1 #414249, text#f5f4f1|
| «Все ответы» |padding-top12/height30|padding-top2/height32, font12/400,line18,#d6cce9|

Нужен вариант info для общего ParticipantChips/heading; текущий tiny mobile вариант заметно меняет принятый блок. Корректный fallback силуэтом не является дефектом и должен сохраниться.

## Живые действия

- Organizer/member390: настоящий PNG cover из API загружен, имя организатора/факты/описание верны. Четыре реальных ответа в изолированном fixture: organizer, going, maybe, not_going; счётчик компании отражает приходящих, «Все ответы» — весь состав. Раскрытие и сворачивание работают; focus возвращается opener. Внизу списка последние строки доступны над footer.
- Role footer x0..390,bottom844,radius24 24 0 0/up-shadow; у организатора приглашение, у участника подтверждённый «Приду»/«Изменить», чужих настроек нет.
- Share: один Dialog, настоящая локальная ссылка скопирована в clipboard; Back вернул info, scroll250→250 и focus приглашения. Settings проверен только переходом: один Dialog, затем browser Back→info/focus Settings. Закрытие info вернуло focus чата и сохранило его draft.
- Response: один Dialog и условие потери чата; browser Back возвращает focus «Изменить». Известный429 оставил подтверждённый «Приду». Повторный Maybe реально сохранён → `/invitations`; приватных info/composer nodes после перехода0.
-320 sanity без horizontal overflow и с доступным footer; no-cover/date-only — отсутствует image slot, время не выдумано. WebKit390: cover/role UI, expand/collapse/close/focus прошли. Desktop1100: прежний centered Dialog/title/факты/actions, mobile cover/rolefooter не перенесены; это spot, не полный исторический diff.

Адресное наблюдение timezone390: actual/ref совпадают по dl/dd/span/small. dd — одноколоночный grid с gap4; date span block15/400,line22.5, small block12.5/400,line18.75/muted. Actual дата y450.86..473.36, Москва y477.36..496.11 — отдельная нижняя строка; ref446..468.5 и472.5..491.25. Расхождения «Москва рядом с датой» на этом web candidate нет (`facts-metrics.json`).

Fixture browser profiles не возвращают avatar_url: проверен корректный силуэт без букв у организатора, chips и roster. Успешная загрузка реального profile-avatar URL и broken-avatar URL не проверены; фото из макета не подставлялось. Состав из4, а не30: длинная пагинация/30 ответов вне этого checkpoint.

## Привязка и ограничения

Frozen source `9d835219b78d126960d5f094e05e25dc3189047cbb3f4ad866262a8cf632c8f6`, artifact `54a1bd6816aa0868a8e68cb149f15d8ba9a0a6f6504e94adcad6f9f3a18b0f15`,8900. Source до/после совпал с кандидатом;261 disk/38 live assets совпали (`artifact-binding.json`).

Первый driver остановился на неуточнённом QA locator приглашения: он совпал с фоновым chat trigger и footer. Продолжение scoped locator до info-footer;19 наблюдений, errors=[] (`checkpoint-probes-followup.json`). Это ошибка tooling, не продукта. Исходные журнал/actual сохранены; SHA — `evidence-sha256.json`.

Login/создание/ответы setup выполнялись только через local fixture; Create/OAuth/RSVP как отдельные фичи, chat/read, настройки как редизайн, VO, полные suites/матрицы/gates не проверялись. App/manifests/tasks/Git не менялись; diff-check чистый. Архивов нет.
