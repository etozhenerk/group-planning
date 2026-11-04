# 10.3: выполненные native-проверки и оставшийся gate · 04.11.2026

Самостоятельная проверка основного агента по прямому решению пользователя.
Исторические прогоны сохранены с исходными hashes, не переименованы в новые.
Повторялись только недостающие шаги либо метод с исправленным QA-селектором.

| Кейс | iOS и Android: фактически выполнено | Результаты |
| --- | --- | --- |
| TC-MEDIA-NATIVE-PICKER-FIRST | Настоящие Files/Photos до preview; по3 отмены с выделением XX; выбранный набор и подпись после more→cancel | [04.11](../2026-11-04-native-picker-selection/result.md), прежние Android more-cancel не повторены |
| TC-MEDIA-NATIVE-SUCCESS-DISMISS | Фото-пакет: общая загрузка, partial/retry без повторного успеха; PDF и memory: серверный commit при удержанном ответе, панель сохраняется до release и закрывается после него | [пакет iOS](../2026-11-03-ios-chat-controls/result.md), [Android](../2026-11-03-android-chat-controls/result.md), новые папки native-pdf-delayed и native-vibe-delayed |
| TC-MEDIA-NATIVE-PHOTO-BATCH | 3 фото, карусель, remove среднего, единый progress, частичный lost reply, foreground/recreation, [1,2] публикации и auto-dismiss | те же сохранённые отчёты03.11 |
| TC-VIBE-NATIVE-SWIPE-TAP | Обе стороны к следующему, short/vertical против tap, wrap, fullscreen/index, ориентация, Reduce Motion | [iOS](../2026-11-03-ios-experience/result.md), [Android](../2026-11-03-android-experience/result.md) |
| TC-VIBE-NATIVE-PRELOAD | Все3 страницы/103 фото; оба полных offline цикла с actual bitmap и нулём новых content requests; отдельный недоступный снимок, retry и revoke | [полный проход](../2026-11-04-native-offline-sweep/result.md), [ошибка/повтор](../2026-11-04-ui-checks/preload-failure/result.md) |
| TC-CHAT-NATIVE-DIRECT-SHARE | Сведения→настоящий Share/Cancel с возвратом и черновиком; пустой CTA→Share/Cancel без промежуточной app-sheet | chat-controls03.11 и [новый пустой чат](../2026-11-04-native-empty-invite/result.md) |
| TC-CHAT-NATIVE-EMPTY-INVITE | Системные события без сообщений, один primary CTA без дубля в шапке, Cancel, первое внешнее сообщение и сохранённый draft | [04.11](../2026-11-04-native-empty-invite/result.md) |
| TC-CHAT-NATIVE-AVATAR-ACK | 10 HTTP/realtime/lost reply/no-avatar путей, 240 выборочных изображений без подмены и сдвига | [04.11](../2026-11-04-native-avatar/result.md) |

Среда: только iPhone18Pro simulator31262733-50DC-46A5-938E-4C462D70F109/iOS27.0/Xcode27.1
и emulator-5554/API36, ru_RU; изолированные локальные Go HTTPS/memory fixtures,
собственные файлы/профили. Новые задержки реализованы только QA transport.
Продукт после исправления отдельного preload не менялся; уже пройденные
218 iOS unit/clean Release/analyze и199 Android unit/Debug/Release/Lint повторно
не запускались. Новые test-host сборки и адресные методы реальны.

**Checkbox закрыт04.11.2026 по прямому решению владельца:** «Да, закрыть 10.3 по этим результатам». Это исключение только для10.3 по сохранённой самостоятельной проверке, без релизов и без нового независимого PASS. qa:ready: Stale catalog or unresolved coverage —
общий manifest ссылается на старые планы. design:ready: UI change lacks design
manifest: mobile-mvp-design-refresh — соседний ещё не опубликованный редизайн.
Исходный вывод сохранён рядом; проверки не отключались. Отдельного независимого
агента нет по решению пользователя; новый независимый PASS не заявлен.
Принятие0.3 само по себе не распространили на10.3. Отдельное решение владельца на закрытие по сохранённой самопроверке получено;
формальные gates остались failed, их правила не менялись.
Физические устройства, настоящий OAuth, релиз и Telegram этой проверкой не охвачены.
