# iOS 10.1 — нативный media flow и полный preload

03.11.2026, основной агент, только разрешённый iPhone18Pro simulator
31262733-50DC-46A5-938E-4C462D70F109/iOS27.0. Релиза/production/Telegram нет.

Исправлен оставшийся дефект: MemoriesOwner читал одну страницу и прогревал
четыре соседних фото. Теперь страницы собираются автоматически до конца,
повторы ID исключаются, циклический cursor останавливается ошибкой, ранее
полученные страницы сохраняются при сбое для retry. Prefetch последовательно
готовит все доступные фото, начиная с выбранного; cache остаётся ограниченным
128 MiB, originals/EXIF не изменяются и удаляются при отзыве доступа.

215 unit PASS, включая новые 103 фото/три cursor-страницы/все decoded images
до offline-reuse без запросов, page503→retry, repeated cursor и очистку доступа.
Swift-format и чистые Debug/Release build+analyze PASS. Raw:
/tmp/somewhere-20261103-ios-preload-{unit,debug,release}.log.

Настоящий TLS API/UI: все103 content URL получены заранее. После отключения
GET content открыто фото103 из последней страницы через сетку/fullscreen,
затем стопка103→1; дополнительных запросов0, ошибок/загрузки на фото нет.
Финальная отдельная fixture album-preload-owner: PASS48.987s, isolated.log;
первый PASS48.726s сохранён отдельно. Картинки ios/ просмотрены. Это компактные
синтетические PNG240×320, помещающиеся в cache; не измерение неограниченного
offline-хранилища, memory pressure или полного performance-бюджета.

Остальной 10.1 уже проверен адресно и не запускался заново без изменения кода:
- ../2026-11-03-ios-chat-controls: 7/7, Files/Photos сначала системные,
  Cancel/reopen/черновик; batch3/remove/единая загрузка/partial [1,2]/auto-dismiss.
- ../2026-11-02-sequential-native-pdf: настоящий PDF→второй участник,
  lost-commit retry и edge-back из списка/календаря с сохранённым draft/cardY.
- ../2026-11-03-ios-experience: swipe обоих направлений, цикл/grid/fullscreen,
  orientation/крупный текст/Reduce Motion, отсутствие чужой шапки и отзыв сессии.
- Прямой native Share, один акцент empty invite, AvatarImages и устойчивая
  pending→ACK identity сохранены; текущие pending/reading unit и UI из
  ../2026-11-03-ios-sheets проверяют ACK без изменения геометрии строки.

Закрывается реализация10.1 для разрешённых симуляторов. Общая независимая
матрица10.3, промежуточные кадры всех состояний, физический iPhone и gates
не объявлены PASS. Проверку выполняет сам агент по прямому решению пользователя.
