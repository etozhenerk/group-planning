# TalkBack: физическая активация остаётся открытой

04.11.2026, только emulator-5554/API36, синтетический empty профиль.
Проверены включённые TalkBack/touch exploration. Programmatic accessibility focus
и уже пройденные custom actions не выдаются за физический двойной tap.

Два shell input tap и public UiAutomation MotionEvent с SOURCE_TOUCHSCREEN
не подтвердили переход по сфокусированной «Создать встречу». Последний контроль
с начальным touch exploration не смог зафиксировать нужный фокус. Исходные
снимки/дерево и failure сохранены. Причина пока не отделена от поведения
инструмента/стартового фокуса службы; дефект приложения не объявлен доказанным.

Это failed/blocked probe, не PASS. Экспериментальный класс исключён из обычного
instrumentation target, временный scope снят, продукт не менялся. NativeTalkBack
в finally восстановил accessibility services/enabled и флаги permission;
прежние успешные фокус/custom-action тесты не повторялись. Полная жестовая
проверка TalkBack остаётся открытой; остальные UI-проверки продолжаются.
