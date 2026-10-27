"""Passive QA capture only, pinned to the user-authorized emulator-5554."""
from datetime import datetime, timezone
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ADB = "/Users/misha/Library/Android/sdk/platform-tools/adb"
SERIAL = "emulator-5554"
ROOT = Path(__file__).resolve().parent
label = sys.argv[1]
if not re.fullmatch(r"[a-z0-9-]+", label):
    raise SystemExit("Capture label must contain only lowercase letters, digits and hyphens")

def adb(*arguments):
    return subprocess.run([ADB, "-s", SERIAL, *arguments], check=True, capture_output=True).stdout

remote = "/sdcard/somewhere-independent-review.xml"
try:
    dump_result = adb("shell", "uiautomator", "dump", "--compressed", remote)
    xml = adb("exec-out", "cat", remote).decode()
    # Private invitation links are not evidence to publish.
    xml = re.sub(r"https?://[^\s<\"']+", "[redacted-url]", xml)
    (ROOT / (label + ".xml")).write_text(xml)
except subprocess.CalledProcessError as error:
    detail = (error.stdout or b"").decode(errors="replace") + (error.stderr or b"").decode(errors="replace")
    (ROOT / (label + "-ax-error.txt")).write_text(detail)
    print("AX capture failed:", detail)
    xml = "<unavailable />"
(ROOT / (label + ".png")).write_bytes(adb("exec-out", "screencap", "-p"))
print(datetime.now(timezone.utc).isoformat(), label)
try:
    tree = ET.fromstring(xml)
    for node in tree.iter("node"):
        a = node.attrib
        if a.get("text") or a.get("content-desc") or a.get("focused") == "true":
            print({k: a.get(k) for k in ["text", "content-desc", "class", "clickable", "long-clickable", "focused", "selected", "bounds"]})
except ET.ParseError:
    print("XML parse failed; original sanitized capture retained")
