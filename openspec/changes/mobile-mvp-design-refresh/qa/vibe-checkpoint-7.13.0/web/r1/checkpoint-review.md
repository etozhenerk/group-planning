# Vibe7.13 web r1 — short independent checkpoint

Нужны два layout исправления: **V1/P2 extrabrand** в mobile Workspace и **V2/P2 deck без flex-grow**.

390×844, reference platform=web&state=ready: actual deck396.672px/card315×309 против raw deck547/card315×427. Raw PhotoDeck.module.css: height clamp310/47dvh/470 — только basis, рядом flex:1; computed1 1 0%. AlbumGallery.gallery flex1/displayflex/column,height591,paddingbottom32; VibePage.page100dvh/displayflex/column,height844. Actualstack computed0 1 auto, родитель MAIN displayblock/height643.672, content displayblock; demoWorkspace812px+demoline32. Исходное raw сравнение включает fake62 status; размер547 — наблюдение этого окружения, не новый token. Parent-chain и exactURLs в spot-observations.json;1pair flex-layout PNG. R2 по поручению root будет runtime-normalized fake62→safearea0+demo32, rawfile не меняется.

Действия: controls rect266/95/104/44 неизменен deck/grid. Grid→viewer реальное contain фото и закрытие; slow24px rollback без сменыindex; settled swipes в обе стороны2/3→3/3→1/3; CDP trusted touchCancel не листает; ReduceMotion keyboard работает. Первая серия с фиксированным500ms settle не является cycle acceptance; отдельная settled серия ожидает idle/resetfalse.

Upload realchooser2фото; empty chooser selection сохраняет2 (это automation empty-selection, не реальный OS Cancel); close/reopen сохраняет2. Scoped transport503 одномуPUT: API4photos, retryfailedonly→5 безdup. Browser native ZIP5entries, CRC/names/SHA совпали с оригиналами. Реальный isolated outsider получает403 на memories/content/export, без mocked privacy responses. Desktop1100 sidebar/title/actions и старое «Скачать все» сохранены. WebKit390 grid→viewer→Escape прошёл, focus возвращён на gridphoto.

Actual/ref uploadselected и partial просмотрены. Title actual «Добавить фото в альбом» против raw «Добавить фото» оставлен copy-наблюдением, без нового существенного finding. Фото реальные approved fixtures; API порядок отличается, pixel equivalence не заявляется. Ранние deck/grid PNG застали загрузку: они сохранены, визуальные выводы используют loaded PNG и complete/naturalWidth.

Initial driver остановился на прежнем inputlabel «Выбрать фото»; actual новый «Файлы для альбома». Это tooling, remaining исправил толькоQA. Initial observations9records+selectorerror сохранены отдельно; remaining17records/errors0, spot5records/errors0. Нет полного manifest/case pass, физического устройства/реальной IME/VO/200% здесь нет.

Immutable artifact `/private/tmp/vibe-web-7.13-r1-GQCgz2/dist`, source before/after `66cfbc807d92104464728c76a47d9ba8a4c9a2e39d9e20c7b90dde172fb05889`, artifact `2519f4540f6e5ab08aded85f505cbb8d6aca143b5eb8d1eed220a9b4ff9ad56a`.262disk/entrylive38 совпали, HTML transforms учтены. Fresh design-context сохранён. Originals/report/driver/ZIP SHA в evidence-sha256.json. Source released; браузеры закрыты. Ownfixture9131/reference9130 PID/log вsetup; app/source/tasks/Git не менялись.
