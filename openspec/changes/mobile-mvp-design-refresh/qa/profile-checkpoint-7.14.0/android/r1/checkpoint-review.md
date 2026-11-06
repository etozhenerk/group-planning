# Android профиль7.14 · R1

Вердикт **needs-fixes**, только профиль, промежуточный checkpoint.

Canonical three-login прошёл12.045с: новые sheet/Back/merged-row selectors,
полная→неполная→очищенная дата, неизвестный пол, сохранение пропущенного имени/
логина и отсутствующий телефон. Реальные start/exchange/GET profile с synthetic
SDK, не реальный OAuth. Actual всех трёх состояний просмотрены.

Дополнительно: точное «Александр Тестов» в header360/320, read-only panel без
EditText, системный Back. Полное имя получено существующим fake-provider HTTP
login для header capture; canonical UI-triggered login проверен отдельно.
Existing native-avatar opt-in реально дал visible bitmap из APIURL; стандартный
несекретный рисунок, не фото настоящего аккаунта. Missing mapping есть вclear,
но fallback-header отдельно ещё не захвачен.

Правки: ссылки документов имеют лишний12dp label inset/medium weight от
TextButton(rawx20/400), support glyph лишён warning mark. Ready actual/ref
и geometry сохранены. Остальная композиция/приватная панель соответствуют
с поправкой на native targets/safe area и реальные разные данные.

Hidden entry/editor отсутствуют в dump; zeroDELETE ещё не assert/log текущим
canonical driver, не объявлен pass. HTTPlogout-error по pending продуктовому
вопросу не запускался. Help/About и полная account-service матрица вне scope.

Before/after source/APK совпали. Source/device освобождены, app force-stop,
wm reset и исходный animatornull восстановлены. Gates/checkbox не закрываются.
