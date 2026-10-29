# Независимая проверка iOS album foundation

29.10.2026. Проверяющий: `ios_album_independent`; исполнитель: другой агент.

**Вердикт: PASS в пределах non-UI foundation.** Блокирующих дефектов в проверенном
слое не обнаружено. Это не приёмка задачи 3.2, всей функции или релиза:
пользовательский путь и настоящая Photos ещё не проверены.

## Точный объём

Перед проверкой и после неё совпали все 23 файла из авторского freeze.
SHA256 исходного `source-hashes.json`:
`b8e1e73c52feb6201693d23cdf94f3fd16033a0d62e6c34713b11fad70adba35`.
Исходники, тесты продукта, макеты, manifest и задачи проверяющий не менял.

Проверены raw requirements из `specs/meeting-memories/spec.md`, design/testing
изменения и кейсы `TC-VIBE-EXPORT-ALL`, `TC-VIBE-EXPORT-GALLERY`,
`TC-VIBE-EXPORT-ACCESS`. Их пользовательские E2E не получают pass по этому отчёту.

## Собственный запуск

Выполнен `run.sh`: чистая сборка и пять выбранных suites на уже запущенном
iPhone 18 Pro Simulator, iOS 27.0 (24A434), arm64. Использован отдельный
`AlbumIndependentBuild`, unit-host `dev.groupplanning.ios.unittesthost` и общий
project lock. Настройки симулятора, Photos, обычное приложение и физический
iPhone не менялись. После завершения lock освобождён.

Результат `xcresulttool`: **20 passed, 0 failed, 0 skipped**, runtime warnings — 0;
exit code `xcodebuild` — 0. Swift-format strict для всех Swift-файлов freeze — 0.
В build log есть два сообщения AppIntents metadata extraction skipped из-за
отсутствия зависимости; runtime warnings/падений тестов они не создают.

- `test-summary.json`, `test-cases.json` — извлечение из собственного xcresult.
- `xcode-test.log`, `format.log` — оригинальные логи.
- `source-verification-before.json`, `source-verification-after.json` — сверка freeze.
- `bundle-hashes.json` — 29 файлов собственного тестового bundle.
- xcresult: `frontend/ios/.build/AlbumIndependent-20261029.xcresult`.
- SHA256 `bundle-hashes.json`:
  `15be3fed67fee50695fe13d01067aad0b5a2f820d45f8cd2cd84b84663e4c6c9`.

## Наблюдения по требованиям

| Область | Фактическая проверка | Результат слоя |
| --- | --- | --- |
| Полный снимок | 103 исходных ID; добавления во время чтения не включаются; один вызов fake library; повтор того же operationID не сохраняет повторно | PASS |
| Границы данных | Дубликаты, другой purpose, превышение 10 МиБ на фото и 1 ГиБ на набор, пагинированный/неполный snapshot отвергаются | PASS |
| Доступ | Текущий origin и Bearer; fixed lease не оживает после revoke→allow; 401 очищает сессию, 403 закрывает scope; logout отменяет запрос и отвергает поздний ответ | PASS |
| Отмена | До commit нет сохранения; во время переданного fake commit ожидание результата продолжается, файлы очищаются после него; повторный конкурентный запуск получает busy | PASS |
| Временные файлы | Ошибка download/library очищает owned directory; stale symlink не удаляет внешний target; чужой путь нельзя передать в remove; каталог имеет 0700 | PASS |
| Поток записи | Реальный URLSession bytes adapter с локальным URLProtocol сохраняет байты, отвергает неверный MIME/короткий/лишний ответ, отменяет underlying request; buffer проверен через границы 64 КиБ | PASS |

Статическое ревью дополнило запуск: имена строятся из UUID, а присланный downloadURL
не используется; origin остаётся HTTPS, redirect запрещён существующим delegate,
cookies/cache отключены. Сумма размеров ограничена до подготовки; stream пишет
блоками 64 КиБ. Файлы создаются с 0600 и complete protection, каталог исключается
из backup. PhotoKit adapter запрашивает add-only только через явный метод,
передаёт исходные file resources одним `performChanges` и ждёт completion прежде
чем разрешить очистку. Это чтение кода, а не доказательство реальной записи Photos.

## Что не закрыто

- Реальный системный permission dialog, отказ/возврат из Settings, запись в Photos,
  просмотр настоящих JPEG/PNG/WebP, EXIF и ориентации. Тестовые байты подтверждают
  отсутствие преобразования в адаптере, но не корректное отображение системной галереей.
- UI кнопки, статусы подготовки/commit, положение вайба и lifecycle владельца.
- Реальный сетевой сервер, HTTP TLS/redirect в живой сети, большой альбом на устройстве,
  влияние фонового режима/блокировки устройства на complete file protection.
- Уничтожение процесса в середине PhotoKit commit и повтор после перезапуска.
  Идемпотентность ограничена последним успешным operationID на том же экземпляре.
  Восстановление старых private directories выполняется при следующем `files.create`.
- Cleanup failure после успешной записи и поведение UI при `cleanup(savedCount:)`:
  ветка прочитана, но отдельного fault-injection запуска здесь нет.

Для этих границ требуется следующий независимый проход после подключения UI.
`qa:ready`, `design:ready` и release receipt этим отчётом не создавались; задачи
и статусы каталога не изменялись.
