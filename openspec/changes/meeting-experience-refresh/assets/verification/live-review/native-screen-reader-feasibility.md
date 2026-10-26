# Доступность живой проверки screen reader

27.10.2026. Это проверка окружения, не оценка приложения и не visual pass.

## iOS

Apple указывает, что для VoiceOver требуется физическое устройство:
«VoiceOver isn’t available on Simulator».
Источник: [Performing accessibility testing for your app](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app).

В переданном окружении разрешён только существующий iPhone Simulator
31262733-50DC-46A5-938E-4C462D70F109. Поэтому фактическая навигация VoiceOver
заблокирована окружением. Проверки AX, labels, XCTest isHittable и обычного tap,
включая тест повторного открытия Share, не выдаются за VoiceOver pass.
macOS VoiceOver не включался; пользовательские настройки не менялись.

## Android

Официальная документация допускает TalkBack на эмуляторе при наличии Android
Accessibility Suite и описывает отдельную ручную проверку порядка чтения,
объявлений и завершения сценариев.
Источники: [Testing for Accessibility](https://developer.android.com/codelabs/basic-android-kotlin-compose-test-accessibility),
[Test your app’s accessibility](https://developer.android.com/guide/topics/ui/accessibility/testing).

Выполнен только read-only запрос:

```text
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell pm list packages talkback
adb: device 'emulator-5554' not found
```

Запрос не доказывает отсутствия TalkBack: целевое устройство в этот момент
недоступно. Другие serial не использовались. Новые устройства/пакеты не
создавались, приложения и accessibility services не запускались. Android
TalkBack остаётся непроверенным до доступности разрешённого QA-эмулятора и
проверки установленной службы. Emulator-5556 не затронут.
