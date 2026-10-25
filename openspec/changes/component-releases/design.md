# Design

## Context

Пять потоков выпуска подтверждены 25.10.2026. Основные проверки платформ уже
разделены в CI. Бот реализован частично в рабочем дереве; probe пока отсутствует.
Release-подпись Android не настроена, iOS keychain не содержит valid identities.
Соседний агент меняет продуктовый код; его изменения не входят в этот коммит.

## Goals / Non-Goals

**Goals:** один понятный механизм пяти независимых версий, реальные команды
сборки, подписанные мобильные выходы при наличии секретов, проверяемые manifest/
checksums, выпуск из тега без перезаписи артефактов, инструкция использования.

**Non-Goals:** публикация в сторы, смена production, генерация постоянных ключей,
реализация PostgreSQL-адаптеров. Сборка не означает приёмку приложения.
UI и общий API не меняются; отдельный UX-документ неприменим.

## Decisions

Уточнение от 25.10.2026: правила выбора номера, JSON-карточка аннотированного
тега и версия web-артефакта определены в
[release-version-policy](../release-version-policy/design.md) и
[действующей инструкции](../../../docs/releases.md). Исторические сведения
о первых RC ниже не заменяют эти правила.

- Теги backend/web/monitoring/android/ios с независимым SemVer: `name/v1.2.3`
  либо `name/v1.2.3-rc.1`. Workflow проверяет точный тег, совпадение HEAD, принадлежность
  origin/main. Ручной повтор требует существующего тега. Выпущенный тег не двигается.
- Единый workflow маршрутизирует только выбранный компонент, сохраняя пять
  релизных потоков. Build имеет read-only token, publish — contents:write и
  actions:read. Секреты подписи доступны только нужным мобильным шагам.
- Linux amd64 API — tar.gz с бинарником и шаблоном systemd; web — tar.gz статики.
  Миграции включать после их появления, сейчас в manifest явно memory/не production.
  Monitoring — vendored source ZIP с `handler.Handler` и `probe.Probe`, один
  релиз/две Cloud Functions с разными IAM-ролями. Cloud-конфигурация вне ZIP.
- Android — AAB, APK и mapping.txt, versionName из SemVer без rc, versionCode
  из номера workflow. iOS — XCArchive.zip, IPA, dSYM.zip, marketingVersion из
  SemVer без rc, buildNumber из workflow. До 9999 выпусков для общего простого
  числового CFBundleVersion, затем отдельное изменение схемы нумерации.
- Ключи только из GitHub Secrets/временных файлов. Без них store-сборка падает
  до экспорта. iOS manual signing с временным keychain и mobileprovision,
  обязательная очистка в finally. Никакой ad-hoc/debug подписи в store-артефактах.
- До упаковки выполнить проверки выбранной платформы. Release metadata содержит
  component, version, tag, commit, build number, environment/API origin, файлы
  и SHA256. `SHA256SUMS` покрывает артефакты и manifest; повторная проверка перед upload.
- GitHub CLI создаёт draft, прикладывает полный набор, публикует после загрузки.
  Готовый релиз не перезаписываем, при сбое остаётся диагностируемый draft.
  Store/cloud promotion выполняется отдельно над этими же артефактами, без rebuild.
- Probe: отдельный Handler на fixed config origin `/readyz`, HTTPS, без redirect;
  DNS/TCP/TLS/TTFB/total и срок сертификата через httptrace. В Monium пишет только
  ограниченные агрегаты; отсутствие ответа — success=0, не исчезновение проверки.
  Непройденные сетевые этапы отсутствуют, не превращаются в успешные нули.
- Инфраструктура остаётся Git/Terraform с просмотром plan и отдельным обслуживанием;
  не меняется при обычном релизе приложения. Принятую структуру не расширяем шестым
  регулярным потоком выпуска.

## Risks / Trade-offs

- Нет ключей/секретов GitHub: подписанная доставка проверяется после настройки,
  локально проверяем unsigned device archive и тестовый Android keystore отдельно.
- Первая публикация CI зависит от runner Xcode 27.1 и настроенных GitHub variables.
- Backend пока memory.Store, домен не куплен: не запускать production по наличию ZIP.
- Подписанные мобильные пакеты и Xcode archives не обещаются byte-for-byte
  одинаковыми при пересборке. Храним исходный проверенный артефакт и его hash.
- Обновления API должны сохранять контракт старых мобильных версий; релизный
  workflow не заменяет сквозную пользовательскую приёмку.
