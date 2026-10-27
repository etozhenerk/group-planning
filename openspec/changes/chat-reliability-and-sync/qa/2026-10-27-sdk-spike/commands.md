# Команды SDK spike 27.10.2026

Все команды выполнялись вне приложения, в `/tmp/somewhere-sdk-spike-20261027`.
В `evidence` сохранены тексты runners (`*.txt`), manifests, locks и выходы.
Сетевые разрешения использованы только для публичных SDK/package registries
и отдельного loopback listener. Никаких env/private конфигураций проекта не читали.

## Версии и исходники

Метаданные прочитаны с `https://api.github.com/repos/centrifugal/<repo>/releases/latest`.
Затем скачаны точные архивы из `versions.json`, проверены безопасные пути tar.
Обновления по `latest` при сборке не используются.

```sh
cd /tmp/somewhere-sdk-spike-20261027/server
GOMAXPROCS=2 go mod tidy
GOMAXPROCS=2 go mod download -json > modules.json
GOMAXPROCS=2 go build -p 2 -o spike-server .
GOMAXPROCS=2 ./spike-server
```

Сервер пишет выбранный адрес в `../endpoint.txt`, слушает `127.0.0.1:0`,
отклоняет выбор 8444/8445/52531/61441. Он останавливается SIGINT/SIGTERM.
Control endpoints относятся только к synthetic fixture и не являются API приложения.

## JS / React

```sh
cd /tmp/somewhere-sdk-spike-20261027/node
npm install --ignore-scripts --no-audit --no-fund --save-exact
npm ls --all --json > dependencies.json
node spike.mjs > result.json 2> run.stderr
node auth-probe.mjs > auth-probe.json 2> auth-probe.stderr
node guarded-auth-probe.mjs > guarded-auth-probe.json 2> guarded-auth-probe.stderr
/Users/misha/Documents/Codex/projects/group-planning/node_modules/.bin/tsc \
  --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext \
  --ignoreConfig adapter.ts > typescript.log 2>&1
```

Для проверки типов временные `node_modules/react` и `node_modules/@types/react`
ссылаются на уже установленные React 19.3.1 и @types/react 19.3.0 корневого
workspace; приложение не изменено. TypeScript 6.0.3. Проверка без skipLibCheck.
`ws` 8.20.1 нужен только Node runner: browser использует встроенный WebSocket.

## Swift

Первоначально выполнено `swift build --jobs 2` с exact remote requirements
0.11.0 и 1.35.0. Git fetch SwiftProtobuf остановлен после 6 минут без прогресса;
это не результат успешного remote package resolve.

Fallback: неизменённые release archives SDK и SwiftProtobuf, затем два exact
submodule commit из `swift-source-lock.json`. GitHub archive не включает
submodules; без них manifest SwiftProtobuf имеет пустой target protoc.
Тексты `Package.remote.swift.txt` и `Package.local.swift.txt` сохранены.

```sh
cd /tmp/somewhere-sdk-spike-20261027/swift
swift build --jobs 2 --scratch-path .build-local > build.log 2>&1
.build-local/debug/Spike > result.json 2> run.stderr
```

SDK собирается в Swift 5 language mode, runner — Swift 6. Использован
URLSessionWebSocketTask (`useNativeWebSocket: true`) без отключения TLS проверки.
Локальные package overrides дают identity warning SwiftPM; это свойство fallback,
а не рекомендованная конфигурация приложения. У upstream Security/CFStream API
есть deprecation warnings, сохранённые в полном build.log.

## Java и Android

```sh
cd /tmp/somewhere-sdk-spike-20261027/java
JAVA_HOME=/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home \
  /Users/misha/Documents/Codex/projects/group-planning/frontend/android/gradlew \
  -p /tmp/somewhere-sdk-spike-20261027/java --no-daemon --max-workers=2 \
  --write-locks dependencies --configuration runtimeClasspath run > run.log 2>&1

cd /tmp/somewhere-sdk-spike-20261027/android
JAVA_HOME=/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home \
ANDROID_HOME=/Users/misha/Library/Android/sdk \
  /Users/misha/Documents/Codex/projects/group-planning/frontend/android/gradlew \
  -p /tmp/somewhere-sdk-spike-20261027/android --no-daemon --max-workers=2 \
  --write-locks assembleDebug > build.log 2>&1
```

Оба временных Gradle проекта: `org.gradle.parallel=false`, workers=2,
`-Xmx1024m -XX:ActiveProcessorCount=2`; Kotlin compiler in-process для Android.
Сборка Android library использует AGP 8.13.1, Kotlin 2.2.20, SDK 36/min 26,
JVM 17, coroutines 1.10.2, OkHttp 4.12.0. APK не создавался/не устанавливался.

## Финальная проверка Swift

После исправления только callback runner выполнено:

```sh
cd /tmp/somewhere-sdk-spike-20261027/swift
swift build --jobs 2 --scratch-path .build-local > rebuild.log 2>&1
.build-local/debug/Spike > result.json 2> run.stderr
swiftc -typecheck -parse-as-library -swift-version 6 -strict-concurrency=complete \
  -warnings-as-errors -I .build-local/out/Products/Debug \
  Sources/Spike/Spike.swift > adapter-strict.log 2>&1
swift build --product Spike --jobs 2 --scratch-path .build-ios \
  --triple arm64-apple-ios17.0-simulator \
  --sdk /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk \
  > ios-build.log 2>&1
xcrun vtool -show-build .build-ios/out/Products/Debug-iphonesimulator/Spike > ios-macho.txt
```

Первый direct typecheck искал Modules в старом layout SwiftPM и не нашёл модуль;
повтор использовал фактический `.build-local/out/Products/Debug` и прошёл.
Library/dependency warnings при cross-compile сохранены; строгая проверка выше
относится к Swift6 adapter target, не ко всем upstream sources.
Go/JS/Java/Android проверки после Swift callback исправления не повторялись.
Сервер перезапускался из уже собранного binary только для чистой synthetic Swift
сессии; это не повтор Go build и не проверка persistence.
