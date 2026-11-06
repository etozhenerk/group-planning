# Android вайб7.13 · R3

Вердикт: **needs-fixes**, targeted upload-only.

Fresh before/after source/APK совпали. Existing upload driver завершился failure
на waitAbsent(upload-sheet) после повторной отправки. Actual: оставшееся фото
исчезло, но sheet не закрылся и показывает пустую форму с disabled submit.
Это воспроизводимый UI-дефект; timeout30.141с содержит15с ожидания закрытия.

Partial caption и пояснение теперь правильные: «Не добавлено фото:1»,
«Остальные снимки уже в альбоме. Повтор добавит только оставшиеся.» Сохраняются
own form до picker/его отмена и один оставшийся item после частичного результата.
API-read после failure подтвердил5 уникальных фотоIDs; publish-count assertions
не достигнуты из-за раннего close failure и не объявлены пройденными.

У notice ещё отличается композиция: весь текст красный, triangle отсутствует;
raw использует error triangle18 и muted body12. Actual evidence просмотрено.

Source/device освобождены, app force-stop. Deck/layout повторно не запускались.
Финальные gates/checkbox не закрываются; повторить один upload test после fixes.
