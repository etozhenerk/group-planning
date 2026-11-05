# Android Info DS7.8 r3: последний typography repeat

Вердикт: **targeted observed-pass**. Один normal360 actual/TextLayout, runtime OK1test3.288с; новых замечаний в этом объёме нет. Это ограниченный checkpoint, не финальная приёмка.

Frozen APK SHA256 `64f5915f49744102f3f58855edcbb2a8210d55d129c74f5c7f01a4262187bce6`, source `ee083d91e0038b303777ec90e3babc423b17b92bf13e447c5df70d775d425035`. Байты проверены до/после (`review-binding.json`, `installed-after.json`). Только5554/API36,360×800dp/font1. Использовано одно API membership-предусловие существующего fixture; UI RSVP/маршруты/owner не прогонялись.

[Actual360](actual/typography360.png), [fresh raw](reference360.png), `actual/result.json`:

- «Все ответы ·4 →»:12sp/18sp, weight400, accent — исправлено; raw computed style12px/18px/400 в reference.json.
- «Кто придёт»:16sp/600, text role.
- Счётчик2:13sp, muted, у правого края x665–680px. Raw TextLayout.fontWeight=null: нормальный вес по умолчанию Compose (400, вывод из default resolution), а не явно записанное400; отдельное измерение Typeface.weight не выполнялось. Видимого утолщения/нарушения выравнивания нет.

Действия: открыть существующую встречу→info→прокрутить к строке, прочитать TextLayout и снять один кадр. Семантика/capture metadata сохранены в actual/.320, canonical chain и другие успешные flows не повторялись и не объявляются новыми pass. Полная матрица/gates, VoiceOver/TalkBack/карты не запускались.

Настройки устройства не менялись и совпали с before (`cleanup.json`, restored=true). Own fixture/reverse/remote/private config удалены, QA-процесс остановлен; root fixtures не затронуты.5554 свободен. Код/manifests/tasks/Git не менялись.
