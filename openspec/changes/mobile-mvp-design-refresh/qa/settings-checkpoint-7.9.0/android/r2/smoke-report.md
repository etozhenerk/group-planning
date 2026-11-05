# Android Settings DS7.9 r2: targeted batch

Вердикт: **needs-fixes**, два визуальных остатка. Targeted runtime OK1test19.419с. Это не финальная приёмка; полные dirty/PATCH/conflict/rebase/save flows,320 и gates не повторялись.

Frozen APK SHA256 `51365148650b94f92daf3b64a7cd2ca0005e39405c4b1193f81e6defc81ba05a`, source `aa94dc974c43840f8a8153351efbd1a4ed7d7130bf52e73176280f43441a96e3`. Байты сверены до/после (`review-binding.json`, `installed-after.json`). Только5554/API36,360×800dp/font1, один существующий own memory fixture.

1. **[P2] Plain facts review всё ещё обведены hairline rounded border.** [Actual](actual/review-render-only.png), [raw](reference/review360.png). `MeetingInformationFacts(card=false)` передаёт `.border(0.dp,…)`: нулевая Dp-толщина даёт hairline, а не отсутствие border. Фон/padding уже убраны, но контур остаётся; требуется условно не применять border для plain-варианта.
2. **[P2] Cover action color из R1 не исправлен.** Оба действия теперь одной строкой и12sp/500, но TextLayout показывает colorAction rgb235/231/223 (`#ebe7df`). Принятый `assets/settings-r3/source/CoverActions.module.css:2` явно использует color.accent (`#d6cce9`), как [fresh raw](reference/ready360.png); [actual](actual/cover360.png), `actual/result.json.replaceStyle/removeStyle`. M3 primary наследуется вместо опубликованной роли accent. Это оставшаяся color-часть прежнего cover finding, не новая редактура.

Подтверждено свежими actual/действиями:

- Invalid Save переводит focus из Description в Title; inline hint виден над footer/IME. [Actual](actual/title-focus-ime.png).
- Cover86 и оба actions на360 в одной строке: одинаковый y541–637px, native targets48 сохранены. Утверждённые Save/dirty-copy и time-helper с Москвой применены. [Cover](actual/cover360.png), [copy](actual/approved-dirty-copy.png), [helper](actual/time-helper.png). Dirty stay/leave не повторялись — только показ текста подтверждения.
- Info starts_on содержит ровно одно no-time пояснение. [Actual](actual/no-time-info.png).
- Для одного notice/review кадра создан настоящий concurrent API PATCH; UI409 показывает принятый alert-badge и semibold heading. Review title23sp/30sp/700 измерен TextLayout, объяснение присутствует, cover не выводится при реально существующем server cover (`reviewServerCoverPresent=true`, tag count0). [Notice](actual/notice-icon.png), [review](actual/review-render-only.png). Resume/save не выполнялись.

`actual/result.json` содержит timestamps/layout/style; PNG/capture metadata/семантика в actual/, fresh references в reference/. Один синтаксический QA import/parenthesis defect исправлен до первого runtime, продукт не менялся. Успешные R1 flows не переносятся сюда как новые pass. Known/unknown/forbidden,large/RM/VO/TalkBack/карты не принимались; pixel regression не заявляется.

Device settings не менялись и совпали с before (`cleanup.json`, restored=true). Own fixture/reverse/config удалены, QA-процесс остановлен; root fixtures не затронуты.5554 свободен. Код/manifests/tasks/Git не менялись.
