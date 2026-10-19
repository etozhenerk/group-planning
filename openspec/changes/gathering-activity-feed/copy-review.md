# Редакторская проверка макетов · v0.7

19 октября 2026 года. Применён проектный
[product-copy-editor](../../../.agents/skills/product-copy-editor/SKILL.md)
ко всему актуальному HTML-пакету, включая ошибки, доступные подписи и обзор.
Формулировки не меняют продуктовые требования. Шесть дополнительных HTML-фрагментов
служат источниками иллюстраций; это не новые пользовательские сценарии.

## Основные решения

- На стартовой удалены повторный перечень действий «создать → пригласить →
  подготовиться», второй рекламный заголовок и финальный баннер. Первый экран
  объясняет назначение сервиса; четыре примера добавляют разные условия работы.
- По запросу пользователя добавлены изображения приглашения, переписки, опроса,
  задачи и календаря. У опроса и задачи можно увидеть два состояния. Описание
  доступа к чату сохранено в подписи, его дубль в вырезке приглашения убран.
- «Загружаем встречи» больше не сопровождается «Встречи загружаются».
  В пустом календарном дне осталось одно сообщение вместо двух.
- Заголовки подтверждения называют ответ: «Вы ответили „Приду“», „Возможно“
  или „Не смогу“. Абзац поясняет новый доступ или способ вернуться к ответу.
- Убраны «Укажите основные детали» над подписанными полями и абзац успешного
  создания, который пересказывал кнопку приглашения. Подсказки о вариантах
  времени, обложке и потере ввода сохранены: они влияют на действие.
- Вместо инструкции «отправьте ссылку друзьям» экран приглашения объясняет,
  какие детали увидит получатель и что для ответа нужен Яндекс ID.
- В ошибках убраны догадки о причине и справка о регистрации. Сохранён контекст
  приглашения и ввода, когда он определяет следующую попытку.
- Названия навигации, варианты RSVP, значимые записи истории и обычная речь
  участников сохранены там, где уже выполняют свою задачу. Автор в шапке
  карточки задачи больше не повторяется подписью внутри неё.

Встроенные иллюстрации содержат текст из этих же экранов. Число слов в HTML
не учитывает надписи внутри изображений и не используется как оценка качества.

## Реестр покрытия

«Сохранён» означает, что текст проверен и оставлен по назначению.
Набор полей, обязательность, значения демонстрационных данных и маршруты
кнопок исходных экранов сохранены. Исключения — удалённые разделы и навигация
стартовой страницы, а также названия разделов в обзоре макетов.

| Файл | Семейство | Решение |
| --- | --- | --- |
| [actions.html](assets/actions.html) | Лента и действия | Изменён |
| [empty.html](assets/empty.html) | Лента и действия | Сохранён |
| [entry-landing.html](assets/entry-landing.html) | Онбординг | Изменён |
| [entry-login-existing.html](assets/entry-login-existing.html) | Вход и возврат | Изменён |
| [entry-login.html](assets/entry-login.html) | Вход и возврат | Изменён |
| [entry-return-existing.html](assets/entry-return-existing.html) | Вход и возврат | Изменён |
| [entry-return-new.html](assets/entry-return-new.html) | Вход и возврат | Изменён |
| [example-calendar.html](assets/example-calendar.html) | Иллюстрация интерфейса | Добавлен |
| [example-poll-after.html](assets/example-poll-after.html) | Иллюстрация интерфейса | Добавлен |
| [example-poll-before.html](assets/example-poll-before.html) | Иллюстрация интерфейса | Добавлен |
| [example-rsvp.html](assets/example-rsvp.html) | Иллюстрация интерфейса | Добавлен |
| [example-task-after.html](assets/example-task-after.html) | Иллюстрация интерфейса | Добавлен |
| [example-task-before.html](assets/example-task-before.html) | Иллюстрация интерфейса | Добавлен |
| [feed-active.html](assets/feed-active.html) | Лента и действия | Изменён |
| [feed-decided.html](assets/feed-decided.html) | Лента и действия | Изменён |
| [feed-index.html](assets/feed-index.html) | Обзор макетов | Изменён |
| [feed-voted-against.html](assets/feed-voted-against.html) | Лента и действия | Изменён |
| [feed-voted.html](assets/feed-voted.html) | Лента и действия | Изменён |
| [flow-auth-return.html](assets/flow-auth-return.html) | Вход и возврат | Изменён |
| [flow-create-dates.html](assets/flow-create-dates.html) | Создание встречи | Изменён |
| [flow-create-discard.html](assets/flow-create-discard.html) | Создание встречи | Изменён |
| [flow-create-error.html](assets/flow-create-error.html) | Создание встречи | Изменён |
| [flow-create-save-error.html](assets/flow-create-save-error.html) | Создание встречи | Изменён |
| [flow-create-saving.html](assets/flow-create-saving.html) | Создание встречи | Изменён |
| [flow-create.html](assets/flow-create.html) | Создание встречи | Изменён |
| [flow-created.html](assets/flow-created.html) | Создание встречи | Изменён |
| [flow-dates-created.html](assets/flow-dates-created.html) | Создание встречи | Изменён |
| [flow-friend-feed.html](assets/flow-friend-feed.html) | Лента и действия | Сохранён |
| [flow-friend-home.html](assets/flow-friend-home.html) | Личные встречи | Изменён |
| [flow-guest-home.html](assets/flow-guest-home.html) | Личные встречи | Сохранён |
| [flow-home-empty.html](assets/flow-home-empty.html) | Личные встречи | Изменён |
| [flow-home.html](assets/flow-home.html) | Личные встречи | Изменён |
| [flow-invite-auth-cancelled.html](assets/flow-invite-auth-cancelled.html) | Вход и возврат | Изменён |
| [flow-invite-auth-error.html](assets/flow-invite-auth-error.html) | Вход и возврат | Изменён |
| [flow-invite-auth.html](assets/flow-invite-auth.html) | Вход и возврат | Изменён |
| [flow-invite-dates.html](assets/flow-invite-dates.html) | Приглашение и ответ | Сохранён |
| [flow-invite-no-cover.html](assets/flow-invite-no-cover.html) | Приглашение и ответ | Сохранён |
| [flow-invite-return.html](assets/flow-invite-return.html) | Вход и возврат | Изменён |
| [flow-invite-unavailable.html](assets/flow-invite-unavailable.html) | Приглашение и ответ | Изменён |
| [flow-invite.html](assets/flow-invite.html) | Приглашение и ответ | Сохранён |
| [flow-login-error.html](assets/flow-login-error.html) | Вход и возврат | Изменён |
| [flow-owner-accepted.html](assets/flow-owner-accepted.html) | Лента и действия | Сохранён |
| [flow-owner-declined.html](assets/flow-owner-declined.html) | Лента и действия | Изменён |
| [flow-owner-feed.html](assets/flow-owner-feed.html) | Лента и действия | Изменён |
| [flow-rsvp-accepted.html](assets/flow-rsvp-accepted.html) | Приглашение и ответ | Изменён |
| [flow-rsvp-declined.html](assets/flow-rsvp-declined.html) | Приглашение и ответ | Изменён |
| [flow-rsvp-error.html](assets/flow-rsvp-error.html) | Приглашение и ответ | Изменён |
| [flow-rsvp-maybe.html](assets/flow-rsvp-maybe.html) | Приглашение и ответ | Изменён |
| [flow-rsvp-saving.html](assets/flow-rsvp-saving.html) | Приглашение и ответ | Изменён |
| [flow-rsvp.html](assets/flow-rsvp.html) | Приглашение и ответ | Сохранён |
| [flow-share-copied.html](assets/flow-share-copied.html) | Приглашение и ответ | Изменён |
| [flow-share-error.html](assets/flow-share-error.html) | Приглашение и ответ | Изменён |
| [flow-share.html](assets/flow-share.html) | Приглашение и ответ | Изменён |
| [flow-welcome.html](assets/flow-welcome.html) | Онбординг | Изменён |
| [hub-calendar-31.html](assets/hub-calendar-31.html) | Личные встречи | Изменён |
| [hub-calendar-free.html](assets/hub-calendar-free.html) | Личные встречи | Изменён |
| [hub-calendar-nov.html](assets/hub-calendar-nov.html) | Личные встречи | Изменён |
| [hub-calendar-past-3.html](assets/hub-calendar-past-3.html) | Личные встречи | Изменён |
| [hub-calendar-past-nov.html](assets/hub-calendar-past-nov.html) | Личные встречи | Изменён |
| [hub-calendar-past-sep.html](assets/hub-calendar-past-sep.html) | Личные встречи | Изменён |
| [hub-calendar-past.html](assets/hub-calendar-past.html) | Личные встречи | Изменён |
| [hub-calendar-sep.html](assets/hub-calendar-sep.html) | Личные встречи | Изменён |
| [hub-calendar-today.html](assets/hub-calendar-today.html) | Личные встречи | Изменён |
| [hub-calendar.html](assets/hub-calendar.html) | Личные встречи | Изменён |
| [hub-created-calendar-past.html](assets/hub-created-calendar-past.html) | Личные встречи | Изменён |
| [hub-created-calendar.html](assets/hub-created-calendar.html) | Личные встречи | Изменён |
| [hub-created-list.html](assets/hub-created-list.html) | Личные встречи | Изменён |
| [hub-created-past.html](assets/hub-created-past.html) | Личные встречи | Изменён |
| [hub-empty-calendar-past.html](assets/hub-empty-calendar-past.html) | Личные встречи | Изменён |
| [hub-empty-calendar.html](assets/hub-empty-calendar.html) | Личные встречи | Изменён |
| [hub-empty-list.html](assets/hub-empty-list.html) | Личные встречи | Изменён |
| [hub-empty-past.html](assets/hub-empty-past.html) | Личные встречи | Изменён |
| [hub-error.html](assets/hub-error.html) | Личные встречи | Изменён |
| [hub-friend-calendar-past.html](assets/hub-friend-calendar-past.html) | Личные встречи | Изменён |
| [hub-friend-calendar.html](assets/hub-friend-calendar.html) | Личные встречи | Изменён |
| [hub-friend-list.html](assets/hub-friend-list.html) | Личные встречи | Изменён |
| [hub-friend-past.html](assets/hub-friend-past.html) | Личные встречи | Изменён |
| [hub-list.html](assets/hub-list.html) | Личные встречи | Изменён |
| [hub-loading.html](assets/hub-loading.html) | Личные встречи | Изменён |
| [hub-meeting-breakfast.html](assets/hub-meeting-breakfast.html) | Личные встречи | Изменён |
| [hub-meeting-dinner.html](assets/hub-meeting-dinner.html) | Личные встречи | Изменён |
| [hub-meeting-movie.html](assets/hub-meeting-movie.html) | Личные встречи | Изменён |
| [hub-meeting-old-dinner.html](assets/hub-meeting-old-dinner.html) | Личные встречи | Сохранён |
| [hub-meeting-undated.html](assets/hub-meeting-undated.html) | Личные встречи | Изменён |
| [hub-meeting-walk.html](assets/hub-meeting-walk.html) | Личные встречи | Сохранён |
| [hub-past-empty.html](assets/hub-past-empty.html) | Личные встречи | Изменён |
| [hub-past.html](assets/hub-past.html) | Личные встречи | Изменён |
| [hub-upcoming-empty.html](assets/hub-upcoming-empty.html) | Личные встречи | Изменён |
| [index.html](assets/index.html) | Обзор макетов | Изменён |
| [journey-index.html](assets/journey-index.html) | Обзор макетов | Изменён |
| [load-error.html](assets/load-error.html) | Лента и действия | Изменён |
| [loading.html](assets/loading.html) | Лента и действия | Изменён |
| [meeting-info.html](assets/meeting-info.html) | Лента и действия | Изменён |
| [message-error.html](assets/message-error.html) | Лента и действия | Изменён |
| [new-poll.html](assets/new-poll.html) | Лента и действия | Изменён |
| [new-task.html](assets/new-task.html) | Лента и действия | Изменён |
| [poll-rejected.html](assets/poll-rejected.html) | Лента и действия | Изменён |
| [task-accepted-open.html](assets/task-accepted-open.html) | Лента и действия | Изменён |
| [task-accepted.html](assets/task-accepted.html) | Лента и действия | Изменён |

## Проверка результата

Редакторская карта составлена до изменения файлов. После правки прочитаны
тексты основных путей и альтернативных состояний, просмотрены телефон и широкий
экран. Проверены переключатели иллюстраций мышью и клавиатурой, их независимость,
отсутствие потерянных ссылок и сохранение элементов управления исходных экранов.
Раскладка и ограничения — в [verification.md](verification.md).
