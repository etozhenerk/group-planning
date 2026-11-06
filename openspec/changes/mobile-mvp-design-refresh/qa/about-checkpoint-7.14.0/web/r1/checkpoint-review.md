# About / document reader web R1 — short checkpoint

Нужны четыре адресные правки, переданы одним batch; source released.

- **A1 P2 — место чтения.** Privacy1377→Cookie(max931)→Privacy931; browserBack также восстанавливает931, исходная1377 потеряна. Raw preview тоже теряет1283→909, но UX/TC-MOBILE-DOCUMENT-READER требует restore. Это функциональный gap, а не сравнение пикселей. `useDocumentPosition` cleanup читает scroll после смены контента в том жеDOM, когда старое значение ужеclamped. Proof: position-proof.json, privacy-before/after-crosslink-actual.png.
- **A2 P3 — текст/dd15 вместо14.** Actual computed p15/24 иdd15/22; raw14/24 и14/22, family/weight/width одинаковы. Country dd переходит на2строки. MobilePrivacy/Cookie/AboutDescription привязаны к общемуbody15, raw требует14. Proof: privacy-computed actual/reference и position-proof.json.
- **A3 P3 — List stroke.** Размер20 правильный, stroke2 вместоraw1.6.
- **A4 P3 — Back semantics.** ПослеCookie→Privacy accessiblelabel «Вернуться к встречам», но click идётвCookie. Raw generic «К предыдущему экрану»; historydestination верен, имя нет.

Пройдено кратко: новый actualAbout; честная Демо/no build/no inventedexample, один brand/credit, отсутствуют duplicateprofilelinks/dock/footer. Full current Privacy/Cookie copy exactraw, draftstatus/реквизиты/сроки сохранены. Fixedbar/separatebody, TOC7/5/cancel+focus/select+heading/motion/reduced, Cookie position, supportdraft+PNG+scrollreturn, publicdirect/fallback,320/WebKitcancel/desktoppreserve. Stable TOC pair снят после450мс, ранний entryframe не выдан за дефект.

Source before=after `bc1904421600196a53244bb5fff863cfb2ec854a93fa5994a2d6139d97206a88`. Artifact `afe8699aafc6414a7b298a6e85aa38edf3aeb5180093254a3bbb2028e91d986c`, 268disk/39live entries; обеbindingstable, свежийdesigncontext совпал. HTML metadata transform учтён.

Ограничения: checkpoint, неfinalgate/полнаяматрица. Actualmode толькоdemo; release/local/unavailable не приписаны. CSSzoom200 толькоsyntheticstress, не OSlargefont/realbrowserzoom/IME. БезVO/карт/сообщений; supportPOST0. Raw fake status62→demo32 толькоreferenceDOM; localmetadata raw не подменена fakeверсиями. Product/tests/tokens/tasks/Git не менялись.
