# FKA inner switch и public keyboard: independent preflight

**Системный FKA успешно включён0→1; keyboard-прохождение не доказано.** Public XCTest нажал фактический вложенный63×28 Switch, а не широкий AXwrapper. LiveAX/actualenableassert подтвердили1. Затем на current exactQAapp открыта первая страница онбординга.

Отправлены три пары public `XCUIKeyboardKeyTab`/`XCUIKeyboardKeySpace` без modifiers. После каждой пары pageindicator остаётся «1 из8»; на actualPNG нет видимой рамки фокуса или перехода. Достоверное подключение Simulator hardwarekeyboard этим не установлено. Метод завершён skipped32.971s/exit0, не PASS. Не утверждается дефект приложения: public event dispatch сам по себе не доказывает работающий системный hardwarekeyboard/FKA input path.

В teardown тем же внутренним target восстановлено1→0, `restored.json`: original0/actual0/restoredtrue и explicitassert. Первый restoretap увидел transientframe Settings, XCTest повторил собственный public tap; итоговый0 подтверждён. Settings/targetapp завершены; ownfixture/lock завершены, softwarekeyboard восстановлена. Source/device освобождены, дальнейшие исследования ввода не выполнялись.

Source6cbe4081…571dc; immutable runtimeappd6358f22…8d6a8/20files из R3 (путь и полныеSHA вresult). Только QAhelper вtemp; продукт/canonicaltests/cases/gates неизменны. Никаких MacUI/privateAPI/defaults/VoiceOveractivation. Старые отрицательные попытки сохранены отдельно. TopSettingsentry AX/PNG и полные raw/config/xcresult остаются локально; безопасная публикация перечислена staging-files.json. Это preflight, не formal TC-MOBILE-ONBOARD-ACCESS pass/checkbox.
