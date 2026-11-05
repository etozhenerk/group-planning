# Android Settings DS7.9 r3: два visual исправления

Вердикт: **targeted observed-pass**. Оба остатка R2 исправлены; новых замечаний в этих двух местах нет. Это не финальная приёмка.

Frozen APK SHA256 `b4750a1f2828712b0823dd5fb9e6cc70009d15d024225524b6f108f1f5988c91`, source `df800027cca6951b1173b3bacbd5b675292513d9b63c851778b51e39956e8317`. Main APK установлен и проверен до/после (`review-binding.json`, `installed-after.json`).5554/API36,360×800dp/font1. **Новой сборки runner не было:** только ADB/UIAutomator и original screencap.

- [Cover actions](cover-accent360.png): оба текста имеют принятый accent, прежний off-white colorAction удалён. Сверено с неизменным approved settings-r3/CoverActions.module.css и R2 fresh reference.
- [Plain facts review](plain-facts360.png): вокруг фактов нет рамки/подложки. Прежний hairline отсутствует; сверено с approved plain review из R2 reference/review360.png.

Действия/время — actions.json, UI XML — settings.xml/review.xml, идентичность двух original PNG — captures.json. Для показа review использован реальный concurrent API PATCH своего fixture; resume/save/rebase и другие функциональные flows не повторялись. Новых матриц/gates/320/IME/VO/TalkBack/карт не было, прежние pass не переносились.

Device prefs не менялись и совпали с before (`cleanup.json`, restored=true). Own fixture/reverse/config/namespace marker/remote XML удалены, QA-процесс остановлен. Root fixtures не затронуты;5554 свободен. Код/manifests/tasks/Git не менялись.
