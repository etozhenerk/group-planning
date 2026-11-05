# Meetings web · ограниченный checkpoint R2

В проверенном объёме pass, новых замечаний и блокеров нет.

- M1 исправлен: Chromium/WebKit320/390 показывают принятый текст past-empty без «Создать встречу».
- Прежний unread-блокер окружения снят: sync/read_state/realtime=true. В обоих движках390 два composer-сообщения другого пользователя дают2непрочитанных; третий настоящий POST при активном списке меняет2→3 без reload. Card→chat инициирует PUT read-marker; sync/API0 и first_unread=null. После browser Back unread footer отсутствует.
- Source65f832… и artifact637918… до/после совпали с новым frozen candidate;261disk/live файлов без расхождений.

Только targeted M1/unread. Остальной smoke прежнего hash не повторялся и не перенесён как текущий pass. Нет итогового pass всему manifest, gates/checkbox/упаковок. Код/manifests/tasks/Git не менялись. Screens/actions/API/SHA — checkpoint-review.json и checkpoint-probes.json.
