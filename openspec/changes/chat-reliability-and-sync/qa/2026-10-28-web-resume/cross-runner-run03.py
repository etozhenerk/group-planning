#!/usr/bin/env python3
"""Общий Go API, web и уже запущенные единственные iOS/Android устройства.

Нужны готовая demo-сборка web, SomewhereUI build-for-testing и QA APK Android.
Временная конфигурация копируется в отдельные QA-приложения; сервер использует
только тестовые профили и собственное хранилище в памяти.
"""

import base64
import contextlib
import json
import os
from pathlib import Path
import plistlib
import shutil
import signal
import ssl
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request


ROOT = Path('/Users/misha/Documents/Codex/projects/group-planning')
IOS = Path('/Users/misha/.codex/worktrees/chat-ios-sync/group-planning/frontend/ios')
ANDROID = ROOT / "frontend/android"


def command(args, log, cwd=ROOT, env=None, timeout=240):
    with log.open("wb") as output:
        subprocess.run(args, cwd=cwd, env=env, stdout=output, stderr=subprocess.STDOUT,
                       check=True, timeout=timeout)


def ready(path, process, timeout=60):
    deadline = time.monotonic() + timeout
    while not path.exists():
        if process.poll() is not None or time.monotonic() > deadline:
            raise RuntimeError("Общий стенд не дошёл до следующей стадии")
        time.sleep(0.2)


def replace_root(value, root):
    if isinstance(value, dict):
        return {key: replace_root(item, root) for key, item in value.items()}
    if isinstance(value, list):
        return [replace_root(item, root) for item in value]
    return value.replace("__TESTROOT__", str(root)) if isinstance(value, str) else value


def main():
    udid = os.environ["SOMEWHERE_SIMULATOR_ID"]
    adb = str(Path(os.environ["ANDROID_HOME"]) / "platform-tools/adb")
    devices = subprocess.check_output([adb, "devices"], text=True).splitlines()[1:]
    online = [line.split()[0] for line in devices if line.endswith("\tdevice")]
    serial = os.environ.get("ANDROID_SERIAL")
    if serial:
        if serial not in online:
            raise RuntimeError("Выбранный ANDROID_SERIAL не подключён")
    elif len(online) == 1:
        serial = online[0]
    else:
        raise RuntimeError("Укажите ANDROID_SERIAL одного уже запущенного Android")
    adb_args = [adb, "-s", serial]
    products = Path('/tmp/somewhere-web-resume-20261028/ios-products-final')
    template = products / "SomewhereUI_iphonesimulator27.1-arm64.xctestrun"
    results = Path('/Users/misha/Documents/Codex/projects/group-planning/.cache/qa/web-resume-private/cross-run03')
    results.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="somewhere-cross-") as name:
        directory = Path(name)
        config, progress = directory / "config.json", directory / "progress.json"
        binary = directory / "httpapi.test"
        shutil.copyfile("/tmp/somewhere-web-resume-20261028/httpapi-cross.test", binary)
        binary.chmod(0o700)
        env = dict(os.environ, SOMEWHERE_CROSS_FIXTURE="1", SOMEWHERE_CROSS_CONFIG=str(config),
                   SOMEWHERE_CROSS_PROGRESS=str(progress),
                   SOMEWHERE_BROWSER_DIST="/tmp/somewhere-web-resume-20261028/.cache/web-demo")
        with contextlib.ExitStack() as stack:
            server_log = stack.enter_context((results / "server.log").open("wb"))
            server = subprocess.Popen([str(binary), "-test.run=^TestCrossPlatformFixture$",
                                       "-test.timeout=0"], env=env, stdout=server_log,
                                      stderr=subprocess.STDOUT)
            browser = None
            remote = f"/data/local/tmp/somewhere-android-ui-{os.getpid()}.json"
            port = None
            try:
                ready(config, server)
                values = json.loads(config.read_text())
                port = urllib.parse.urlparse(values["origin"]).port
                command(adb_args + ["reverse", f"tcp:{port}", f"tcp:{port}"], results / "reverse.log")
                command(adb_args + ["push", str(config), remote], results / "push.log")
                container = subprocess.check_output(["xcrun", "simctl", "get_app_container", udid,
                                                    "dev.groupplanning.ios.uitesthost", "data"], text=True).strip()
                shutil.copyfile(config, Path(container) / "tmp/ui-fixture.json")
                browser_log = stack.enter_context((results / "web.log").open("wb"))
                browser = subprocess.Popen(["npx", "--no-install", "playwright", "test", "--config",
                                            "playwright.cross.config.ts", "--output", str(results / "playwright"), "--trace", "on"], cwd=Path("/tmp/somewhere-web-resume-20261028/frontend/web"),
                                           env=env, stdout=browser_log, stderr=subprocess.STDOUT)
                ready(progress, browser)
                invitation = json.loads(progress.read_text())["invitation"]
                token = urllib.parse.urlparse(invitation).path.removeprefix("/i/")
                run = replace_root(plistlib.loads(template.read_bytes()), products)
                run["SomewhereUITests"].setdefault("EnvironmentVariables", {})["SOMEWHERE_CROSS_TOKEN"] = token
                run_path = directory / "cross.xctestrun"
                run_path.write_bytes(plistlib.dumps(run))
                os.chmod(run_path, 0o600)
                ios_args = ["xcodebuild", "-jobs", "2", "-xctestrun", str(run_path), "-destination",
                            f"platform=iOS Simulator,id={udid}", "-parallel-testing-enabled", "NO",
                            "test-without-building"]
                print("Web создал встречу, отправил файл с подписью и фото, добавил снимок в общий альбом. iOS проверяет вложения и ставит реакцию.", flush=True)
                command(ios_args + ["-resultBundlePath", str(results / "ios-join.xcresult"), "-only-testing:SomewhereUITests/CrossPlatformUITests/testJoinAndSend"],
                        results / "ios-join.log", IOS)
                progress_data = json.loads(progress.read_text())
                request = urllib.request.Request(
                    values["origin"] + "/api/v1/meetings/" + progress_data["id"] + "/feed",
                    headers={"Authorization": "Bearer " + values["cases"]["invite-owner"]["token"]})
                trust = ssl.create_default_context(cadata=ssl.DER_cert_to_PEM_cert(
                    base64.b64decode(values["certificate"])))
                with urllib.request.urlopen(request, context=trust) as response:
                    feed = json.load(response)
                raw = json.dumps(feed, ensure_ascii=False)
                expected = ["Hello from web", "Hello from iOS", "rules.txt", "Правила встречи от web"]
                proof = {text: text in raw for text in expected}
                (results / "api-before-android.json").write_text(json.dumps(proof, ensure_ascii=False, indent=2) + "\n")
                if not all(proof.values()):
                    raise RuntimeError("Shared messages are absent from the API before Android joins")
                print("iOS готов; Android проверяет вложения, реакцию, общий альбом и отвечает.", flush=True)
                command(adb_args + ["shell", "am", "instrument", "-w", "-r", "-e", "fixturePath", remote,
                        "-e", "crossToken", token, "-e", "additionalTestOutputDir",
                        "/sdcard/Android/data/dev.groupplanning.android.uitesthost/files/cross",
                        "-e", "class", "dev.groupplanning.android.CrossPlatformUiTests",
                        "dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner"],
                        results / "android.log")
                if "OK (1 test)" not in (results / "android.log").read_text():
                    raise RuntimeError("Не прошёл межплатформенный сценарий Android")
                ready(Path(str(progress) + ".messages"), browser)
                print("Web получил сообщения и реакции обеих платформ; iOS меняет ответ и теряет доступ к чату.", flush=True)
                command(ios_args + ["-resultBundlePath", str(results / "ios-withdraw.xcresult"), "-only-testing:SomewhereUITests/CrossPlatformUITests/testReceiveAndroidAndWithdraw"],
                        results / "ios-withdraw.log", IOS)
                browser.wait(timeout=60)
                if browser.returncode:
                    raise RuntimeError("Не прошла межплатформенная проверка web")
                print("Общий сценарий web/iOS/Android прошёл.", flush=True)
            finally:
                if browser is not None and browser.poll() is None:
                    browser.terminate()
                    browser.wait(timeout=10)
                if port:
                    subprocess.run(adb_args + ["reverse", "--remove", f"tcp:{port}"], check=False,
                                   stdout=subprocess.DEVNULL)
                subprocess.run(adb_args + ["shell", "rm", "-f", remote], check=False)
                server.send_signal(signal.SIGTERM)
                server.wait(timeout=10)


if __name__ == "__main__":
    main()
