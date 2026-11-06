# Vibe7.13 web r2 — layout delta

V1 extrabrand/V2 fixed deck исправлены: mobile brand/rootdock скрыты; main/deck flex1, карточки заполняют оставшуюся высоту. Остался **V3/P3: artificial nav top12** из max(12,env(safe-area-inset-top)). Raw после status не добавляет этот inset; headless safearea0, demo32. Root подтвердил устранение max12 без изменения raw/контракта.

Reference нормализован только в isolated page: fake62→demo32+physicalsafearea0. Rawfiles неизменны; before/after в layout-observations.json. При390×844 actual deck565/card441 против normalized reference577/card450; top actual247/ref235. Short390×430 deck290/card232 одинаковы, различается top12.

На320 первоначальный QA title переносился иначе, поэтому собственный fixture приведён к raw title «Пятница без спешки»/«У Лены»/30октября. Дополнительный matched diagnostic применил fake44=demo32+искусственныйnav12: bounds совпали390(deck565/front315×441) и320(deck471/front255×367). Это **диагностика причины**, не одобрение44 и не новый baseline. Нормативный runtime reference остаётся32; R3 достаточно одного matched390capture.

Toggle controls не сдвинулись; grid→viewer→Escape вернул grid/focus; upload selected→Escape вернул тот же album/index. Desktop1100 прежний sidebar/heading/actions/«Скачать все» сохранён. API использован только для собственного3photo fixture и matchingdata; businesspartial/ZIP/privacy/прочиеR1 пути не повторялись и не получают pass новогоhash.

Layout7records/errors0, matchingdiagnostic2records/errors0. Source before/after=candidate `5ecc82cebda02633dd740892517d7963aa28d23068974248c83610a68a12ab57`; artifact `bbb23e84556206cc07ef1f03e5df3fb2cbbbe74a860bcc566b03a22a0169b87e`.262disk/entrylive hashes совпали; свежий designcontext сохранён; HTML metadata transforms учтены. Originals/driver/report SHA — evidence-sha256.json. App/code/tasks/Git не менялись. Source released, браузер закрыт; ownruntime9132/reference9130 PID/log вsetup. Это checkpoint, не final gate.
