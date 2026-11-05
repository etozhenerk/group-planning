# Android «Приглашения»: короткий checkpoint7.5.0, r2

Вердикт: **needs-fixes** — один визуальный дефект крупного текста в общей нижней навигации. Целевой функциональный smoke прошёл: `OK (1 test)`,17.07с. Это ограниченный независимый design-review + feature-test, не финальная приёмка; полная матрица и gates не запускались.

Frozen APK SHA256 `cef5210d27314ba774cf89dfafc060ce3a3aa28473477bfa5ef33d2999d35ee4`, source `32b4aa16cccc172ec1f465fd9b7d308ee9b45c999fd34ecd5f9e17d8a12c1a6f`. Байты APK проверены до установки и после smoke (`review-binding.json`, `installed-after.json`). Только emulator-5554/API36,360×800dp, затем320×640dp/font1.8. Отдельный memory HTTPS fixture, реальные API и transport gate для refresh503; production-источники не менялись.

1. **[P2] При320dp/font1.8 вкладка разрывает слово внутри: «Приглашени» + «я».** Отдельная последняя буква находится на второй строке и увеличивает выбранную плашку. В approved invitations-r2 подпись — цельное имя раздела; крупный текст должен сохранять читаемую навигацию. Actual: [narrow-large-top](actual/narrow-large-top.png), [narrow-large-card](actual/narrow-large-card.png); контраст normal: [ready](actual/ready.png), raw [ready](reference/ready.png). Сценарий: открыть «Приглашения», wm320×640dp, font_scale1.8. Требуется адаптация ширины/типографики подписи без обрезания смысла. На целевом экране других замечаний этого ограниченного прохода не выявлено.

Фактически проверено:

- Ready: одна Maybe-карточка, автор «Приглашает Саша», действие «Изменить ответ →», count1 и единственное постоянное пояснение; повтор «Ваш ответ: Возможно» отсутствует. [Actual](actual/ready.png), [reference](reference/ready.png).
- Открытие карточки само не меняет серверный список/RSVP: ответы реального GET `/invitations` до и после открытия совпадают (`actual/preview-before-open.json`, `preview-after-open.json`). Going: намеренный fixture503 оставляет Maybe подтверждённым, повтор ведёт в живой чат; Back→«Приглашения» показывает empty/count0. [Retry](actual/response-retry.png), [chat](actual/going-chat.png), [removed](actual/empty-after-going.png).
- Initial GET503: отдельная панель «Не удалось загрузить приглашения», пояснение сохраняется, retry загружает карточку. [Actual](actual/initial-error.png), [reference](reference/error.png).
- Refresh503: компактное сообщение «Не удалось обновить приглашения», карточка/count1 остаются; retry убирает ошибку. [Actual](actual/refresh-retain.png), [reference](reference/refresh-error.png).
- Empty: пояснение не дублируется, «К моим встречам» реально выбирает вкладку встреч. [Empty](actual/empty.png), [return](actual/empty-to-meetings.png), [reference](reference/empty.png).
- Brief320/font1.8: заголовок/count не обрезаны, пояснение прокручивается, автор и «Изменить ответ» доступны над nav. Дефект nav указан выше.

Действия/время: `actual/result.json`, `actual/*.actions.json`; свежие screenshots с device metadata/семантикой — `actual/`; свежие raw с URL/временем/viewport — `reference/`. Reference имеет3 демонстрационные карточки с cover, runtime fixture —1 Maybe без cover; это различие данных, сравнивались роли/иерархия/состояния. Native системные отступы/шрифт и принятый знак учитывались как адаптация, pixel regression не заявляется.

Ограничения: повторно не проверялись все три RSVP, long-data, pagination, rotation, IME, reduced motion, process death, вся manifest-матрица; VoiceOver/TalkBack и карты не запускались. Maybe/Decline canonical return не переносится из прежних pass: здесь выполнен только Going. Авторские проверки не использованы как независимые pass.

История QA-driver: первые остановки — неверный singular API endpoint и попытка ScrollTo закреплённой RSVP-кнопки; это ошибки QA-driver, не приложения. Логи сохранены в attempt1/attempt2/attempt3, после исправления driver текущий тот же frozen APK прошёл весь перечисленный smoke. Старые pass не переносились.

Очистка: исходные wm/font/settings восстановлены, собственный fixture/reverse/remote config удалены, QA-процесс остановлен (`cleanup.json`). Root fixtures не затронуты. Код/manifests/tasks/Git не менялись.
