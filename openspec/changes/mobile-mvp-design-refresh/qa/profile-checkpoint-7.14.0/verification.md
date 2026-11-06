# Профиль7.14 · экранный checkpoint06.11.2026

Перенос profile-r2 на iOS/Android/mobile web: полное display_name и полученное
фото/нейтральный fallback, приватная панель контактов/личных данных только для
чтения, компактные service/document links, выход последним. Скрытое удаление
не возвращено. Desktop сохранён. Заменённые мобильные блоки/мёртвые styles удалены.

Публикация7.14 содержит привязки неизменённых approved profile-r2/help-r2/about-r2;
реализован сейчас только профиль. История7.13 сохранена с исходными SHA.
Числа first_name/last_name/birthday/sex не подставляются вместо серверного имени.
Native logout сохраняет прежнюю authoritative local последовательность; пользователь
получил отдельный вопрос о противоречии с generic HTTP-error сценарием макета.
Этот HTTP-error кейс native не объявлен pass; web503→204 проверен.

Независимые прогоны:
- iOS R1: full→partial→clear107.588s, bitmap opt-in12.207s, read-only/handle,
  hidden deletion и methodDELETEguard. Raw/current402 сравнение без существенных
  расхождений. Первое QA-ожидание signedout вместоonboarding сохранено отдельно.
- Android R1: full/partial/clear12.045s, fullname360/320, privatepanel/Back,
  photo bitmap иfallback. Documents padding/font иwarningglyph исправлены.
  R2: canonical3-login11.94s с реальным GETprofile и noDELETE; fresh ready capture.
- Web R1: full/partial/clear/readonly/focus/Escape/scroll320 и390,
  hiddenDELETE/networkDELETE0, logout503 сохраняетпрофиль,204 очищаетдоступ/cache.
  Exact synthetic avatarURL transportfixture→approved localJPEG иfallback
  записаны явно; это не проверка реального OAuth/photo provider.

Технические проверки: web273tests/62files иbuild; iOSformat/simulator
build-for-testing; Androidformat/QA+QAAndroidTest build; design:check67,
design:test34, agent:check, qa:check, gitdiffcheck. Это не clean/final native
регрессия и не полная приёмка account-service. Все UI/gate checkbox открыты до
общего frozen-кандидата после help/support и about/documents.
