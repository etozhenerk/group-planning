# Android about/document reader: короткая подготовка

Только read-only подготовка06.11.2026, без нового runtime/build/pass.
Ревьюер применяет design-review/feature-test, не меняет продукт/тесты/эталоны.

## Authority и scope

approved-designs.json → assets/about-r2 и preparation/references/about/frame.html;
UX и docs/design/components/mobile-mvp.md (About/Reader), публикация7.14.0.
Raw: AboutPage/AboutBrand/BuildDetails, DocumentPage/DocumentIndex/DocumentStatus.
Нативные существующие полные legal texts сохраняются; browser-only текст raw
не заменяет Android условия. Карты полностью исключены. Desktop/VoiceOver вне scope.

Cases: TC-MOBILE-ABOUT-METADATA, TC-MOBILE-DOCUMENT-READER;
TC-INFO-87665C8F (фактическая версия/разработчик), TC-INFO-91E4ECFC,
TC-INFO-C4EDD04F (служебный экран без нижнего nav/footer), TC-SERVICE-RETURN-CONTEXT;
draft/public policy дополнительно TC-INFO-5AF98147/TC-INFO-D5C31112, где применимы.

## Готовая каноника и минимальные адаптации

`SupportServiceUiTests#actualBuildAndDocumentsReturnToTheProfile` уже проверяет
реальные BuildConfig.VERSION_NAME и VERSION_CODE, открывает privacy/cookies из
профиля и возвращается с selected home-profile. Текущий Back locator уже content
description «Назад», openProfile — «Вход через Яндекс ID»; не возвращать старые.
Реальные version/code assertions сохранить:0.1.0-rc.2/42 — только пример raw.
Если metadata rows/labels изменятся, ограничить locator их контейнером;
не заменять реальные значения строками эталона. У action в fixed bar не вызывать
performScrollTo: он не имеет scroll ancestor (урок предыдущего help checkpoint).

Этот существующий тест **не покрывает** TOC, sticky bar, jump/history scroll,
крупный текст и отсутствие дублей — их пройти коротко actual UI после freeze,
без нового runner/framework. Нативные документы имеют7privacy/8cookies секций
в прежнем LegalContent; TOC должен соответствовать фактически сохранённым секциям,
а не копировать browser-only titles без проверки.

## Минимальный actual проход после handoff

1. Profile→About: один lockup mark44/word36/44, описание14/22,max280; metadata
   platform Android + настоящие version/build, surface/r18, один credit MintyDev.
   Нет повторных support/privacy/cookie ссылок; нет выдуманной версии/0build.
   BuildConfig здесь всегда заполнен: local/unavailable branch не объявлять
   runtime pass без отдельного реально доступного предусловия.
2. Privacy: постоянная верхняя Back/«Содержание», только body scroll, h1 26/32/650,
   пометка «Проект документа» и полный существующий legal content. Прокрутить body,
   сравнить bar bounds до/после; последнее содержимое достижимо без нижнего nav.
3. Открыть TOC mobileSheet: все настоящие секции, строки52/14/22; Back/handle cancel
   не меняет reading position, явный выбор переносит к выбранному заголовку,
   не прячет его под bar. Проверить close/focus return без VoiceOver.
4. Privacy→cookies→Back: возвращает прежний документ и scroll, затем Back в
   исходный профиль либо support с исходным draft, смотря откуда открывали.
   Сохранять source-specific history вместо жёсткого всегда-profile.
5. Один short/large text capture при необходимости: title/TOC не обрезаются,
   bar остаётся доступен, реальные числа metadata читаются. Системный sans-serif
   допускает иной перенос. Reduced/full matrix — общему финальному кандидату.

## Reuse и команда

Прежний emulator-5554, native memory fixture127.0.0.1:64284 с nil notifier;
private config /data/local/tmp/somewhere-android-ui-713841.json. Никакого нового
auth/fixture/AVD. Перед запуском root передаёт immutable app/testAPK и hashes;
проверить before/after прежним vibe/setup/check-candidate.mjs, actual/capture
helper переиспользовать из help/android/r4. Credentials не писать в Git.

```sh
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell am instrument -w -r \
  -e fixturePath /data/local/tmp/somewhere-android-ui-713841.json \
  -e additionalTestOutputDir /data/user/0/dev.groupplanning.android.uitesthost/files/about714-r1 \
  -e class dev.groupplanning.android.SupportServiceUiTests#actualBuildAndDocumentsReturnToTheProfile \
  dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner
```

До frozen handoff не запускать. Отчёт/evidence писать в отдельный android/rN;
сборка/скриншоты без действий не дают gates pass. После targeted run восстановить
свои settings и сразу release source/device. Новые UI-source patches делает root.
