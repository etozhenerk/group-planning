#!/usr/bin/env python3
"""Проверить потерю данных и сессий между двумя отдельными mock-процессами."""

import base64
import contextlib
import json
import os
from pathlib import Path
import signal
import ssl
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


ROOT = Path(__file__).resolve().parent.parent


@contextlib.contextmanager
def fixture(binary, directory, index):
    config_path = directory / f"config-{index}.json"
    env = dict(os.environ, SOMEWHERE_IOS_FIXTURE="1", SOMEWHERE_IOS_FIXTURE_SCOPE="auth",
               SOMEWHERE_IOS_FIXTURE_CONFIG=str(config_path))
    with (directory / f"fixture-{index}.log").open("wb") as log:
        process = subprocess.Popen([str(binary), "-test.run=^TestIOSFixture$", "-test.timeout=0"],
                                   env=env, stdout=log, stderr=subprocess.STDOUT)
        try:
            deadline = time.monotonic() + 20
            while not config_path.exists():
                if process.poll() is not None or time.monotonic() > deadline:
                    raise RuntimeError("Не запустился изолированный mock API")
                time.sleep(0.1)
            config = json.loads(config_path.read_text())
            origin = urllib.parse.urlparse(config["origin"])
            if origin.scheme != "https" or origin.hostname != "127.0.0.1":
                raise RuntimeError("Стенд должен слушать только loopback HTTPS")
            cert = ssl.DER_cert_to_PEM_cert(base64.b64decode(config["certificate"]))
            config["tls"] = ssl.create_default_context(cadata=cert)
            yield config
        finally:
            if process.poll() is None:
                process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
                raise RuntimeError("Mock API не завершился за 10 секунд")
            if process.returncode != 0:
                raise RuntimeError("Проверки mock API завершились ошибкой")


def request(config, path, expected, token=None, body=None):
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers.update({"Content-Type": "application/json", "Idempotency-Key": str(uuid.uuid4())})
    wire = urllib.request.Request(config["origin"] + path, data=data, headers=headers)
    try:
        response = urllib.request.urlopen(wire, context=config["tls"], timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        if response.status != expected:
            raise RuntimeError(f"Ответ {response.status}, ожидался {expected} на {path.split('?')[0]}")
        return json.loads(response.read())


def main():
    with tempfile.TemporaryDirectory(prefix="somewhere-mock-restart-") as name:
        directory = Path(name)
        binary = directory / "httpapi.test"
        subprocess.run([os.environ.get("GO_BIN", "go"), "test", "-c", "-o", str(binary),
                        "./internal/httpapi"], cwd=ROOT / "backend", check=True)
        with fixture(binary, directory, 1) as first:
            old_token = first["cases"]["cover-create"]["token"]
            created = request(first, "/api/v1/meetings", 201, old_token,
                              {"title": "Проверка перезапуска", "starts_on": "2026-12-20",
                               "timezone": "Europe/Moscow"})
            meeting_id = created["meeting"]["id"]
            invitation = urllib.parse.urlparse(created["invitation_url"]).path.removeprefix("/i/")
            assert len(request(first, "/api/v1/meetings", 200, old_token)["meetings"]) == 1
        with fixture(binary, directory, 2) as second:
            request(second, "/api/v1/me", 401, old_token)
            request(second, "/api/v1/invitations/" + invitation, 404)
            new_token = second["cases"]["cover-create"]["token"]
            assert request(second, "/api/v1/meetings", 200, new_token)["meetings"] == []
            request(second, "/api/v1/meetings/" + meeting_id, 404, new_token)
        print("Mock restart: старая сессия — 401, приглашение и встреча — 404, новый список пуст.")


if __name__ == "__main__":
    main()
