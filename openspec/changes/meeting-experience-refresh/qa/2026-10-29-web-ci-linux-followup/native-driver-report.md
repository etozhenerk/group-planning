# Диагностика завершения touch-жеста

Исходный тест 52 на Linux получает trusted touch/pointer down/up на кнопке закрытия, но не получает click. Изменение touch-action только изображения не помогло: 3/3 падения, как и baseline. Глобальный touch-action:none перенёс сбой на более ранний photo.tap, поэтому в продукт такая правка не вносилась.

## Проверяемая причина

Старый тест отправляет восемь движений пальца и сразу touchEnd. Это жест с ненулевой скоростью в момент отпускания. Chromium dispatchTouchEvent включает распознаватель CURRENT_PLATFORM; Aura включает подавление tap после остановки инерционного движения. Официальный synthesizeScrollGesture с preventFling проходит штатную фазу остановки пальца перед отпусканием.

Контрфакт меняет только драйвер жеста. Задаваемые координаты начала и dx/dy, направления, требования к перелистыванию, trusted-событиям, возврату фокуса и обычные photo.tap/close.tap сохранены. Сам штатный драйвер добавляет системный touch slop: на Mac фактический горизонтальный ход 135 вместо 120, короткий 39 вместо 24; оба коротких жеста ниже порога перелистывания 60. Это не полностью одинаковая траектория, а сравнение raw flick со штатно завершённым жестом. В продукте, CSS, таймаутах ожиданий и assertions изменений нет. Baseline остаётся исходным драйвером. На диагностическом commit обычный набор 52 использовал исходный драйвер; новый был включён только metadata диагностического проекта.

## Локальный контроль

На неизменном bundle /tmp/somewhere-web-ci-resume-final-20261029 выполнены baseline и browser-driver: 2/2 PASS, 14.8 секунды. TypeScript, scoped ESLint, форматирование четырёх TS-файлов и diff-check PASS.

Native trace baseline содержит 14 GestureFlingStart, 14 GestureFlingCancel и 83 ProgressFling. В browser-driver этих событий нет. Оба варианта проходят на macOS: это проверка пригодности контрфакта, а не доказательство устранения Linux failure. Сводка сохранена рядом; полные traces находятся в /tmp/somewhere-ci52-native-driver-local.

## Linux: подтверждение причины

Диагностический commit 15b6dbd3, run 40855558482: baseline 2 PASS / 1 FAIL, browser-driver 3 PASS. Падение baseline то же: после close.tap диалог остаётся видимым. Обе группы сохраняли все исходные assertions. Полный artifact 12888769019 имеет SHA256 340845d865671d28524d0fa6928c28fd465cd2ffca2899e7441c50266546cb4f, проверен при скачивании, извлечён в /tmp/somewhere-ci52-native.

В упавшем baseline native trace показывает 41 ProgressFling. При последнем touchstart возникает GestureFlingCancel; следующий GestureTap проходит FilteredForFling и не имеет COMPONENT_INPUT_EVENT_LATENCY_RENDERER_MAIN. DOM получает trusted touchstart/end на крестике, но не click. У двух прошедших raw повторов GestureTap дошёл до renderer. Во всех трёх browser-driver нет ProgressFling, GestureTap доходит до renderer и DOM click присутствует. Сводка с временным окном последнего tap сохранена в native-driver-linux-summary.json.

Причина этого падения — незавершённая инерция синтетического жеста: tap останавливает fling и штатно поглощается браузером. Это не доказательство отсутствующего обработчика в приложении и не основание менять touch-action или onClick.

## Узкая правка обычного теста

Стандартный 52 теперь по умолчанию использует Input.synthesizeScrollGesture с preventFling:true. Raw драйвер остаётся только для явно помеченного диагностического metadata touchGesture: raw. Assertions, фото/крестик tap, время ожидания результата и production-код неизменны. Штатный драйвер сам проходит фазу остановки перед отпусканием; произвольного сна после жеста нет.

Повтор стандартного 52 на frozen bundle: 3/3 PASS, 19.1 секунды. TypeScript, scoped ESLint, Prettier и diff-check PASS. Лог native-driver-standard-local.txt сохранён рядом; trace-каталог /tmp/somewhere-ci52-standard-native. Успех диагностического Linux контрфакта не выдаётся за готовность всего CI либо за проверку физического iPhone.

## Первичные источники

- [Chromium InputHandler: InjectTouchEvents и SynthesizeScrollGesture](https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/protocol/input_handler.cc).
- [Chromium SyntheticSmoothMoveGesture: STOPPING при prevent_fling](https://chromium.googlesource.com/chromium/src/+/main/content/common/input/synthetic_smooth_move_gesture.cc).
- [Chromium Aura gesture configuration](https://chromium.googlesource.com/chromium/src/+/main/ui/events/gesture_detection/gesture_configuration_aura.cc).
- [Chromium tap suppression controller](https://chromium.googlesource.com/chromium/src/+/main/components/input/tap_suppression_controller.cc).

Источники объясняют гипотезу; причинную связь конкретного падения устанавливает сравнение фактических Linux traces.

Диагностический workflow с намеренно неисправным raw baseline оставлен только для ручного запуска. Обязательный workflow Web продолжает запускаться автоматически; тест 52 из него не исключён.
