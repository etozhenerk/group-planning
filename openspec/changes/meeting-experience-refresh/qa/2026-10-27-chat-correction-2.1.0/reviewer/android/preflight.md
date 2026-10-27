# Android 2.1.0 · независимая приёмка

Ревьюер `/root/chat_correction_review`, 27.10.2026. До handoff исполнителя
устройство не управляется. Ни один case/state ещё не принят.

## Доступ и границы

Координатор передал явное разрешение пользователя на ADB только для QA
`emulator-5554`. Все команды устройства обязаны содержать `-s emulator-5554`.
Обычное приложение, emulator-5556, перезапуски/сбросы серверов не используются.
Исполнитель `/root/android_chat_correction` заканчивает instrumentation и сам
привяжет QA к long-lived fixture. APK/package/source hash ждут handoff.

API из брифа: `https://127.0.0.1:52531`; private config вне evidence.
Credentials не выводятся, в command line не передаются. Изменения состояния
допустимы только для синтетических fixture-данных. Сохраняются исходные настройки
fontScale/orientation/animator scales, после прохода они восстанавливаются.

Прочитаны Android AGENTS, design-review/feature-test, платформенный контракт,
актуальная публикация2.1.0, recipe fixture, процессы review/testing и релевантные
cases. Все31 raw-файла совпали с опубликованным source index:
`raw-reference-integrity.json`. Raw unchanged; прежние renders имеют исходную
дату/версию и являются только reference, никогда actual нового приложения.

## Последовательность после handoff

1. Сверить установленный QA package/APK hash с receipt; сохранить OS/API/device,
   viewport/density/fontScale/locale/timezone/animation scales, API/fixture metadata
   без сессий. Зафиксировать source context при начале; не менять hash задним числом.
2. Открыть короткую визуальную встречу; сопоставить header, message/chips,
   poll/task inline hierarchy/CTA с raw. Убедиться в отсутствии постоянных
   smile/people controls у bubble. Снять actual screenshot и XML дерева.
3. Composer: empty caret/первый символ/очистка, выделение середины draft, dock,
   явный русский поиск, 🍕→❤️/повтор, возврат клавиатуры и ввод; Back отдельно.
   Действия ввода, IME и недоступные операции описывать буквально.
4. Bubble hold → quick → full, search/category/scroll/select/close; chip shorttap
   toggle против hold→people с исходным emoji filter без toggle на release.
   Проверить cancel движением и доступный custom action отдельно от touch.
5. Записать normal-motion видео: hold/pressed, quick enter, quick→full, full exit,
   выбор/feedback; dock/plus menu; sheet open/close. Повторить при системном
   отключении анимаций. По кадрам оценить transform/opacity/retention до конца;
   точность duration ограничена реальным fps, screenshot не доказательство motion.
6. Плюс: все5 действий. Дата/место/задача и preview поверх того же chat; Back/X,
   фокус/draft/scroll, отсутствие footer/нижней навигации/лишней route header.
7. На task details и формах снять UIAutomator active window, сопоставить с baseline
   дерева chat. Background card/composer/navigation не должны оставаться доступными
   для modal focus. XML focus не приравнивать к реальному TalkBack announcement.
8. Дата:2варианта, третий/удаление среднего,5настроек, deadline безweekday,
   одинаковая высота/stacked large-text, calendar samefield return; invalid,
   reopen и loss/retry/secondactor только на функциональной встрече с предусловиями.
9. Повторить относящиеся операции large text/landscape/lowheight; сохранить и
   восстановить системные настройки. Очистить только созданные собственные данные.

Полные TC-CHAT-COMPOSER-CARET, TC-CHAT-EMOJI-SELECTION/GRAPHEME/LOW-HEIGHT/
DISMISS-FOCUS, TC-CHAT-SHEET-RETURN, TC-CHAT-DATE-FORM, TC-CHAT-TASK-ROLES,
TC-REACT-FULL-PICKER/PEOPLE-FILTER/HOLD-MOTION требуют всех своих шагов.
Частичный положительный результат не pass. Остальная матрица сохраняется
непроверенной; нет доступа/инструмента → blocked с конкретной причиной.

## Evidence

В этом каталоге: screenshots, XML active window, original video, извлечённые
кадры, hashes, журнал действий/expected/actual и дефекты. Продукт, cases,
manifests и baselines ревьюер не меняет. Новый artifact требует повторной
приёмки; старый evidence остаётся с исходным hash.
