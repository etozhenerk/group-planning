# Первый dock-кандидат DS 2.2

QA SHA-256 `ef3e0184c2bd449a279819ee467cfae683017fd2758b6da40acc7395d3b5b2a5`.
Format, Debug/Release/QA, QA test APK, Lint Debug/Release и 126 JVM-тестов прошли.
Первая компиляция новых тестов остановилась на пропущенном import `click`;
исходный журнал сохранён рядом. Повтор компиляции успешен.

Из 9 изолированных UI-проверок прошли 7: preference, три ReactionPopup lifecycle,
настоящий picker reopen/Back/outside и два pressed/reduced сценария.
Две новые проверки dock не прошли, поэтому этот артефакт не принят:

- После rapid close → reopen через 300 ms высота оставалась 393 px вместо 400 px.
- При reduced close содержимое оставалось на первом управляемом кадре.

В исходниках зависимости Compose animation-core 1.9.5
`commonMain/androidx/compose/animation/core/Transition.kt` (около строки 1457)
прерванный tween заменяется внутренним spring. Это объясняет, почему обычный
AnimatedVisibility не выдержал опубликованный срок при развороте.
Boolean AnimatedVisibility также добавлял свой lifecycle до удаления reduced
content. Assertions не ослаблены и задержки не добавлены.

Следующая реализация использует общий cancellable Animatable progress для dock
и опубликованного позже меню DS 2.3. Новый target стартует от текущего значения
с тем же заданным tween; отменённый exit не доходит до удаления новой поверхности.
Reduced visibility вычисляется напрямую из open. Проверки нужно повторить на
новом APK; успешные результаты этого кандидата на него не переносятся.

Артефакты сохранены только в `.cache/qa/chat-correction-2.2.0/android-r4-dock-first/`.
Точная связь источников, APK и результатов — [source-receipt.json](source-receipt.json).
