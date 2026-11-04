# Независимый feature-test iOS launch

Готовность неполная: 4 manual checks passed, 2 blocked; обязательный ios-unit passed,
обязательный ios-ui blocked. `qa:ready` отклонил готовность именно из-за двух
TC-MOBILE-LAUNCH-REDUCED и полного ios-ui. Дефектов в выполненных действиях не найдено.
Это промежуточный launch-проход, не frozen-кандидат 13 и не закрытие checkbox.

Исполнитель — независимый агент `launch_ios_feature` / `independent-launch-ios-feature`.
Дата — 04.11.2026. Исходники, cases, manifests, tasks и tooling не менялись.
План и исходный пустой run подготовлены основным агентом; reviewer проверил
currentPlan до прохода и после него, затем записал только результаты/evidence.

## Входы

- План: [run/plan.json](run/plan.json), SHA-256 канонического JSON
  `daa6a5be097923a7fe8f88b435473163d4e6d5736033e80cf9d185701bfe517c`.
- catalogHash `f07c1805ac8a8b93d8e827a1d8ef86904d4f1e683428a3187cf85801d378bec3`;
  sourceHash `f3b5da3778d73857ac3a7998b82f13060b869c6ab09465bc5b0ecda561404134`;
  gaps=[]; актуальность подтверждена [preflight](run/preflight.json) и
  [postflight](run/postflight.json).
- QA host `dev.groupplanning.ios.uitesthost`, 0.1.0(1), Debug; executable SHA
  `72a4980d24a2f0bb0016b9384a61f2b2f973b7331834e1fb4038a102ad14901d` до и после штатного startup.
  Обычный пользовательский app не запускался и не переустанавливался.
- Standard: iPhone18Pro, 402×874pt, UDID31262733-50DC-46A5-938E-4C462D70F109.
  Small: отдельный временный iPhone13mini, 375×812pt,
  UDID3F641179-A0CB-4453-9560-9AD0F6E7C28A. iOS27.0 build24A434, SDK27.1.
  ru_RU, Europe/Moscow. Нативные screenshots:1206×2622 и1080×2340 физических пикселей.
- Настоящий выделенный memory TestIOSFixture/accessibility, API0.1.0,
  https://127.0.0.1:62933; audit-loading с задержкой me7s и собственные hold-before gates.
  Тестовая feedOwner session, без pending invitation, свежие QA storage namespaces.
  Токены и certificate config не включены в evidence.
- Raw spec `specs/product-onboarding/spec.md` текущего изменения, testing.md,
  TC-MOBILE-LAUNCH-COLD/RESUME/REDUCED из mobile-mvp-entry.yaml.

## Результаты

| Кейс | Small | Standard | Actual |
| --- | --- | --- | --- |
| COLD | passed | passed | Полная центральная подпись, знак слева; слово неподвижно; один конечный оборот ~1.2s; system/app без отдельного скачка геометрии после стандартного OS zoom. 44pt/53pt/16pt дополнительно сверены в используемой composition; видео подтверждает реальный UI. |
| RESUME | passed | passed | me задержан >1.2s; Home→отдельный somewhere QA; после возврата нет повторного оборота или процента; release gate восстанавливает прежнюю тестовую сессию/карточку. Small дополнительно проверен warm resume после загрузки. |
| REDUCED | blocked | blocked | Визуальная часть пройдена: Reduce Motion=true и maximum Dynamic Type подтверждены context, знак/слово статичны, текст целый. Озвучивание VoiceOver исключено пользователем, поэтому case целиком не passed. Small: имя loading прочитано live AX. Standard: internal AX QA app после XCTest не экспонировался, семантика в этом режиме отдельно не засчитана. |

Доказательства каждой пары — в [run/run.json](run/run.json): отдельный interaction log,
raw JSON launch/terminate/screenshots, реальное видео, screenshots/contact sheets и
SwiftUI capture context. Contact sheets извлечены AVFoundation из сохранённых raw видео;
это дополнительный просмотр последовательности, не отдельный источник pass.
Доменные записи/RSVP не менялись; второй аккаунт не требуется этими тремя кейсами.
Android recreation неприменим к iOS.

## Автоматические проверки

- `qa:run-suite ... --suite ios-unit` на standard: exit0,
  **218 tests in53 suites passed**, raw сохранён официальным runner в run/suites/.
- Безопасный штатный `sh frontend/ios/scripts/test-ui.sh startup` на standard:
  exit0, `AccessibilityUITests/testLoadingBrandAndReturn`, **1test/0failures**.
  Проверяет cold loading→card→Home→activate→card без loading.
  [startup.raw.log](run/evidence/startup.raw.log).
- Полный обязательный `ios-ui` **blocked**, не запускался: default all включает
  `SupportVoiceOverUITests` и `ExperienceAccessibilityUITests/testProfileFieldsAtLargestTextAndRealVoiceOver`.
  Запрет пользователя «не проверяй сейчас войсовер» имеет приоритет.
  Startup не подменяет полный suite. Рunners не изменены и фильтр all не переписан.
  [Причина](run/evidence/ios-ui-blocked.txt), [source excerpt](run/evidence/ios-ui-exclusion-source.txt).
- `qa:ready` выполнен на актуальном плане: отказ с тремя blocked, без иных ошибок
  структуры/актуальности/evidence. [Raw](run/evidence/qa-ready.raw.log).
- `git diff --check` — exit0. `agent:check` — exit0; raw в run/evidence/agent-check.raw.log.

## Cleanup и ограничения

CUA подтвердил для обоих устройств Text Size=3, Reduce Motion=off, VoiceOver=off,
как до прохода. Оба QA host завершены. Только отдельный feature fixture PID47614
остановлен SIGTERM; собственные gate rules удалены. Small возвращён в shutdown,
standard оставлен booted. Штатный startup runner восстановил прежний control file
и настройки клавиатуры. Другие устройства и пользовательские приложения не сбрасывались.

Для полной готовности остаются исключённое озвучивание и обязательный полный ios-ui.
Данный отчёт не рекомендует обойти ограничение и не переносит partial evidence в pass.
