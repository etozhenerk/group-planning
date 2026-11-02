# 5.1 — навигация iOS

Последовательная адресная проверка основного агента (по поручению пользователя работать без субагентов). Свежий NativeNavigationUITests.testTabsKeepOneStableBarAcrossSections PASS17.751с: три раздела, одна стабильная панель, переход в чат/Back, отсутствие табов/резерва в чате, полноэкранное создание без видимых/нажимаемых табов, закрытие формы и возврат исходной панели. Фактические снимки в ios-actual/ просмотрены; список и календарь сопоставлены с сохранёнными list-reference/calendar-reference и контрактом navigation.md.

Повторно не запускались уже выполненные текущие компоненты: CalendarUITests.testCalendarSelectionHistoryBackAndToday PASS25.253с (день/период/Back/Сегодня), DesignExperienceUITests.testListProfileAndCreationMatchApprovedLayout PASS21.894с и EntryUITests.testLostCreateResponseRetriesSameMeetingThroughAPI PASS37.472с из r6 required-full-ui.log; сегодняшние свежие edge-back list20.787/calendar22.987с с точными period/day/cardY≤2pt/draft — sequential-native-pdf/result.md. Состав и расширение участников отдельно приняты в sequential-information. Эти источники не выдаются за новый полный UI-прогон.

Первое расширение теста ошибочно требовало отсутствия перекрытого фонового окна в дереве XCTest. Actual показал правильную полноэкранную форму; проверка исправлена на отсутствие табов внутри формы и невозможность нажать фоновые табы, затем возврат после закрытия. Пробная accessibilityHidden-правка полностью отменена; production HomeView не изменён. Исходные FAIL сохранены.

Закрывается функциональная навигация 5.1. Общий независимый design-review0.3 и полный platform/release gates остаются открытыми; физический iPhone и реальный OAuth не заявлены. В этом пункте runtime не изменён.
