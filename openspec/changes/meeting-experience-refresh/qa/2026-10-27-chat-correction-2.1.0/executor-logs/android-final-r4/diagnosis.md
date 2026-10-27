# Android r4 — окно reaction picker и системная настройка движения

Это инженерная диагностика и изолированные регрессии, не независимая приёмка.
Исходный live-дефект r3 и его APK сохранены. Новый core-кандидат собран по DS 2.1.0;
движение composer dock будет отдельным опубликованным срезом.

## Разделение причин

В r3 `Popup` имел размер самого quick/full picker. Compose UI 1.9.5 меняет
положение отдельного Android-окна после изменения размера его содержимого.
Старый буфер мог получить положение будущей полной панели до отрисовки full.
Независимые кадры показали именно такую последовательность. В изолированной
регрессии размеры окна r3 менялись с `[180, 912, 240, 112]` на
`[104, 424, 600, 600]` (x, y, width, height, px).

В r4 окно постоянно занимает conversation bounds. Внутренний `Layout` измеряет
текущий panel и размещает его относительно anchor в одном layout pass.
Quick/full меняют только дочерний контент; отдельное окно не переносит старый
буфер. В тесте r4 оба состояния имеют окно `[0, 136, 720, 1416]`.
Прежние правила above/below/clamp и токены отступов сохранены. Тап вне измеренной
панели закрывает её; focusable Popup сохраняет Back и modal window.

Недостаток видимых normal-анимаций имел отдельную причину. В baseline при raw
`animator_duration_scale=null` Settings с default 1 возвращал 1.0, Power Save
был false, а фактический `ValueAnimator` — false / 0.0. Такое unset-состояние
само по себе не доказывает баг приложения. После явного `settings put ... 1`
через 5 секунд native уже был true / 1.0, но LocalMotion оставался false:
ContentObserver прочитал старое cached значение до обновления ValueAnimator.
Журнал с device timestamps сохранён в
[baseline/explicit-runtime-timestamped.txt](baseline/explicit-runtime-timestamped.txt).

В r4 на API 33+ используется `DurationScaleChangeListener` с отпиской при
dispose и повторным чтением после регистрации. Официальная документация
подтверждает API 33 и callback на main thread. На API 26–32 fallback читает
Settings scale с default 1 и Power Save напрямую и подписан на обе причины
изменения, без polling и отложенного чтения cached ValueAnimator.
[Документация ValueAnimator](https://developer.android.com/reference/android/animation/ValueAnimator#registerDurationScaleChangeListener(android.animation.ValueAnimator.DurationScaleChangeListener)).
Battery Saver является системной причиной отключения движения.
[Документация areAnimatorsEnabled](https://developer.android.com/reference/android/animation/ValueAnimator#areAnimatorsEnabled()).

## Проверка сохранности анимации

При принудительном LocalMotion=true и управляемых тестовых часах сам r3 уже
давал промежуточную интенсивность красного тестового panel: enter 0.698,
exit 0.384. Exit сохранял content до завершения, callback закрытия вызывался
после него. R4 повторил те же значения. Длительности, easing, fade, scale,
translation и r3 session reset не заменялись и не отключались.

Первый baseline capture давал 0 даже для reduced: тест не дожидался layout
отдельного Popup view между виртуальными кадрами. В harness добавлен drain
layout после каждого test-clock frame; production не получил ни delay,
ни sleep. Первый провал сохранён в `baseline/initial-probe.txt`, его нельзя
интерпретировать как измерение продуктовой анимации.

На core APK `0ebbd6c0533b36b5dd3539dd6db787418b8b7c131c28ee4643e24ee37e8d806e`
прошли 5 изолированных проверок: dynamic preference/dispose/remount, normal
enter/retained exit, reduced immediate, постоянные bounds окна и настоящий
ReactionPicker full → Back → повторный quick с тем же anchor → outside tap.
Результат и source binding — в [core](core/source-receipt.json).

App APK устанавливал координатор. Исполнитель устанавливал только парный
test APK и запускал указанные классы через `am instrument` на emulator-5554.
MainActivity, API и общий fixture runner не использовались. Настройка animator
scale восстановлена к исходному raw null. Системные настройки других устройств
не менялись. Для будущего normal live setup нужно явно установить scale=1,
для reduced — 0, затем восстановить исходное значение.

Fallback API 26–32 ещё не проверен на устройстве соответствующей версии;
изолированные проверки выполнялись на API 36. Они не заменяют независимый
live motion review полного экрана, модальности и взаимодействия с IME.
