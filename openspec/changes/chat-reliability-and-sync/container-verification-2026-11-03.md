# Контейнеры чата: сравнение и текущая проверка

## Выбор web

Исходный [сравнительный spike](qa/2026-10-28-web-window/virtualization-spike.md)
сохранён с датой, версиями, JSON и PNG. Virtuoso 4.18.19 удалял фокусную
строку при далёкой прокрутке в обоих браузерах: activeElement становился BODY.
TanStack Virtual 3.14.23 удерживал строку через rangeExtractor: 15→16 DOM-строк;
после prepend, изменения высоты карточки и resize anchor оставался на 10 px,
25 строк, черновик/selection/focus сохранялись. Это сравнение не переименовано
в новый запуск Virtuoso и не доказывает физическую IME.

Текущий useVirtualFeed использует этот pin, stable feedKey, estimateSize 128,
overscan 10, end anchor, follow только у хвоста и threshold 64. Измерение
getBoundingClientRect/ResizeObserver заменяет оценку реальной высотой карточки;
rangeExtractor ограничивает обычные строки 200, focus/pending удерживает отдельно.
Данные bounded window — 500, а не весь журнал в DOM.

## Текущие native-контейнеры

iOS: ScrollViewReader + LazyVStack с устойчивым ID, spacing 20, insets 16/18,
измеренным anchor и интерактивным dismiss клавиатуры. Android: reverse LazyColumn,
rememberLazyListState, stable row.key, spacing 20, padding 16/18 и поправка
leadingInsetDp разделителя. Подмена контейнеров собственной виртуализацией
не потребовалась. Размер карточки определяется содержимым, не фиксированной
высотой пузырька; pending/ACK сохраняют идентичность строки.

## Проверенные результаты, без повторного общего прогона

- [Web 02.11](qa/2026-11-02-sequential-web-window/result.md): 4/4 Chromium/WebKit,
  720 записей переменной высоты, 16 страниц, prepend/resize/reset/ACK,
  сохранённый DOM focus, тот же anchor ≤2 px. Код контейнера после этого не менялся.
- [iOS 02.11](qa/2026-11-02-sequential-ios-window/result.md): real API/UI,
  120 записей, long/mixed/unsupported cards, удержанная страница истории,
  настоящая экранная IME, поворот и возвращение в чат; anchor ≤2 pt.
  Отдельный readers-проход 03.11 не менял production-контейнер.
- [Android 02.11](qa/2026-11-02-sequential-android-window/result.md): 3 UI PASS,
  reverse/prepend/поздняя высота/очень длинная строка/viewport плюс real API120,
  IME/Back/ACK/reentry; anchor ≤2 dp. Readers/TalkBack 03.11 проверен после
  изменения возврата фокуса, геометрия LazyColumn не менялась.

Контейнеры и параметры сверены по текущим исходникам 03.11 основным агентом.
Это завершает 1.4; baseline frame/heap, проход 10k, полный commit→visible и
физические устройства остаются отдельными 1.6/7.9. Нового общего gate PASS нет.
