# Android вайб7.13 · R4

**Needs-fixes**: existing upload-only test снова остановился на ожидании
закрытия upload-sheet после повтора. Actual через15с — открытая форма с последним
carousel и кнопкой «Добавить в альбом». Замена empty hero на retained carousel
не устранила сбой закрытия. Новых повторов/матриц не запускалось.

Partial caption, пояснение и triangle+muted body теперь соответствуют raw.
Один оставшийся item сохраняется; предусловия own form/picker/cancel пройдены.
Publish-count assertions находятся после failed wait и не объявлены пройденными.

Source/APK before/after совпали; exact candidate указан вcandidate.json.
Собственный memory fixture перед run сброшен тем же binary до исходных3 фото.
Source/device освобождены, app force-stop. Продукт/кейсы ревьюером не менялись.
