# Android chat7.7.0 r2: targeted chip/footer/composer

Вердикт: **needs-fixes** — остался один дефект footer без реакций. Targeted runtime: OK1test7.951с. Это ограниченный повтор, не финальная приёмка; read states/unknown/RSVP/send flow/Create/info/settings/матрицы/gates не повторялись.

Frozen APK SHA256 `1a7600c8fefb43531130d20ff6f45ca37b0f4c7461b8e4e0ad6625a7a5dbbb02`, source `dc5968e03d52cbc2d3133c4195219055e029446c42071aa66f75176d9470a07c`. Байты проверены до/после (`review-binding.json`, `installed-after.json`). Новый собственный memory fixture,5554/API36,360×800dp и320×640dp с настоящей IME. Использована уже существующая fixture-встреча; добавлено через реальный API только одно короткое «Да» для геометрии, UI создания/отправки не прогонялся.

**[P2] Время/checks у длинного сообщения без реакций остались слева.** Верхний bubble «Возьмите настолки…» на [360](actual/short-chip360.png) и [320](actual/short-chip320.png) имеет metadata под левым началом текста, хотя accepted normalized chat-r6 располагает её у правого края. [Fresh raw](reference/ready360.png). `FeedMessageFooter.kt:29` содержит Box(weight(1f,false)): при пустом reactions слот схлопывается, несмотря на fillMaxWidth у footer. Нужен заполняющий свободную ширину слот/эквивалентное выравнивание. Это единственное наблюдаемое замечание текущего объёма.

Исправления подтверждены:

- Видимая выбранная реакция стала компактным rounded-chip около28dp высотой, accent-поверхность, текст «👍1», лишний ✓ убран. Прозрачная native hit-область сохраняется. Direct tap реально убирает выбранную реакцию; longpress/повторный quick choice возвращают её. [360](actual/short-chip360.png), [после тапа/возврата](actual/chip-retapped360.png).
- Короткий bubble «Да» не сжимается до конфликтующих элементов: chip слева, время/checks справа, **перекрытия нет** на360 и320/IME. [IME](actual/keyboard320.png), [320 без IME](actual/short-chip320.png). Это не утверждение о длинном bubble без реакций — его дефект указан выше.
- Внутренняя тёмная rounded-капсула composer снова различима на фоне sticky-панели, включая320 с клавиатурой; draft/input/send не обрезаны. Поле содержит только «Черновик», отправка не нажималась. [Normal](actual/short-chip360.png), [IME](actual/keyboard320.png).

Действия/время — `actual/result.json`; screenshots/capture metadata/semantics — actual/; свежий reference и URL/time — reference/. Никакого pixel regression не заявляется. Пробная read-only pixel extraction через системный Python недоступна (Pillow не установлен), ничего не устанавливалось; точность геометрии оценена по fresh screenshot/семантике и опубликованным размерам, отдельного pixel-test pass нет.

История QA: первый longpress по центру fullwidth-row попал левее короткого bubble, menu timeout сохранён в attempt1/. Driver исправлен на точное попадание по тексту «Да», повторно использовано то же единственное серверное сообщение. Новых сценариев/сообщений/инфраструктурных серий не добавлялось. Второй targeted проход завершён OK; старые pass не переносились.

Очистка: настройки wm/font/settings восстановлены, own fixture/reverse/remote/private config удалены, QA-процесс остановлен (`cleanup.json`, restored=true). Root fixtures не затронуты,5554 свободен. VoiceOver/TalkBack не запускались; код/manifests/tasks/Git не менялись.
