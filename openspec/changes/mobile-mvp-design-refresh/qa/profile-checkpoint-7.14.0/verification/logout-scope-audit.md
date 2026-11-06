# Logout native: узкий read-only аудит scope

06.11.2026. Проверены текущие Android/iOS источники, существующие session tests,
TC-MOBILE-PROFILE-SIMPLE и account-service manifests. Ничего не запускалось и
не менялось за пределами этой QA-заметки. Это не продуктовый выбор/приёмочный pass.
Неотвеченный optional вопрос пользователя не считается решением.

## Фактическое поведение

**HTTP503 после успешной локальной очистки — уже совершённый локальный выход.**
Android SessionRepository.logout сначала SessionGate.invalidate, только потом
отправляет auth/logout старым credential. iOS SessionStore.logout аналогично:
invalidate до HTTP. Сетевая ошибка выбрасывается вызывающему коду, но уже не
возвращает session/profile/credential. Android AppViewModel.logout и iOS
MeetingListOwner.logout показывают profile logout failure только если session
всё ещё authenticated; после локального выхода это условие ложно.

Это существующее бизнес-поведение явно закреплено тестами:

- Android SessionTests.failedRemoteLogoutStillClearsLocalCredentialsAndCache:
  HTTP503, credential=null, SignedOut, private feed empty.
- iOS SessionStoreTests.logoutClearsLocalStateEvenWhenServerFails:
  HTTP503, signedOut, private data empty, storage nil.

**Настоящая ошибка локальной очистки также не эквивалентна сохранённому профилю.**

- Android SessionGate.invalidate сначала reset: credential=null, новое поколение,
  чистый snapshot; затем storage.clear и finally clearPrivate(null). При
  ClientFailure snapshot становится SessionState.Failed и ошибка пробрасывается;
  authenticated profile не восстанавливается. SomewhereApp показывает общий
  «Не удалось восстановить вход», а не доступный профиль с logout alert.
  Например, EncryptedCredentialStorage.clear проверяет существование файла после
  удаления и переводит IOException в FailureKind.Storage.
- iOS invalidate сначала reset(eraseChat:true): profile/credential=nil,
  privateData.clear,status=signedOut; потом ожидает chatBarrier и removes credential
  из CredentialStore. Ошибка barrier/remove оставляет уже сброшенную session;
  persisted credential при сбое remove может ещё существовать. Ветвь Root тогда
  onboarding, а не профиль. Это наблюдение порядка исходников, не runtime proof.

Поэтому подмена HTTP503 на storage failure сама по себе **не делает** raw
profile/logout-error достижимым. Сохранить профиль при таких ошибках потребовало
бы изменения бизнес-поведения; это данным аудитом не разрешалось.

## Доступные средства без нового framework

- Готовые unit tests выше уже проверяют remote failure/local success; их можно
  запустить обычными проектными test-командами. Они не принимают local failure UI.
- Android SessionRepository уже получает CredentialStorage и clearPrivate
  callback через constructor. Маленький unit test может использовать существующий
  успешный load/save fixture и throw ClientFailure(Storage) только из clear либо
  clearPrivate при logout. Новый transport framework не нужен. Текущий
  MemoryCredentials.clear всегда успешен, готового именованного logout-local-error
  теста/переключателя для authenticated device session не найдено.
- iOS существующий MemoryCredentialStorage(failure:) бросает на load/save/remove;
  постоянный failure блокирует обычный login/restore, поэтому сам по себе не
  является ready authenticated logout fixture. Есть protocol CredentialStorage
  и DI seam, достаточный для маленького remove-only failing test double. Также
  готовый GatedChatStorage.removeAccount после5s без finishCleanup бросает
  invalidRequest: пригоден unit-проверке локального cleanup failure через
  SessionHarness(chatStorage:), без нового framework. Такой запуск здесь не делался.
- Готового runtime QA-инжектора ошибки именно credential clear/Keychain remove
  после authenticated login в просмотренном native scope нет. HTTP fault hook
  этого не заменяет. Намеренно ломать реальные Keychain/credential files не нужно.

## Что именно требует clarification/mapping

TC-MOBILE-PROFILE-SIMPLE в testing/cases/mobile-interface.yaml требует:
«ошибка выхода сохраняет доступный профиль». То же в mobile-interface/spec.md
и ux.md. **HTTP503 там не указан**: это прежняя интерпретация общего error case,
а не отдельный обязательный native HTTP-preserve сценарий.

Текущий testing-manifest.json маппит этот общий case на12.1–12.6; native —
12.2/12.5 iOS и12.3/12.6 Android. Design account-service-ios/android явно требуют
profile states logout-error-small-phone/standard-phone (также pending/return).
Именно эти error states и error-clause общего case не подтверждаются текущим
native local-first contract. Web HTTP503-preserve результат не переносится на
native. Успешный локальный выход и весь остальной профиль могут проверяться
независимо, но нельзя выдавать их за проверку error-preserve.

Нужна согласованная трактовка native требований/платформенной адаптации либо
изменение поведения после решения пользователя. Аудит не редактирует case,
manifest, specs или бизнес-логику и не объявляет заранее нужный вердикт.
