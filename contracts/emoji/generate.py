#!/usr/bin/env python3
"""Воспроизводимый каталог Unicode Emoji 17.0 + русские имена CLDR 48."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
names, keywords = {}, {}
for name in ("ru-48.xml", "ru-derived-48.xml"):
    for annotation in ET.parse(ROOT / "sources" / name).findall(".//annotation"):
        key = annotation.attrib["cp"].replace("\ufe0f", "")
        value = annotation.text or ""
        if annotation.attrib.get("type") == "tts":
            names[key] = value
        else:
            keywords[key] = [part.strip() for part in value.split("|")]
groups = {
    "Smileys & Emotion": "Эмоции", "People & Body": "Люди", "Animals & Nature": "Природа",
    "Food & Drink": "Еда", "Travel & Places": "Путешествия", "Activities": "Занятия",
    "Objects": "Предметы", "Symbols": "Символы", "Flags": "Флаги",
}
items = []
group = ""
for line in (ROOT / "sources" / "emoji-test-17.0.txt").read_text().splitlines():
    if line.startswith("# group: "):
        group = line.removeprefix("# group: ")
    match = re.match(r"^([0-9A-F ]+); fully-qualified\s+# (\S+) E[0-9.]+ (.+)$", line)
    if not match:
        continue
    emoji, english = match.group(2), match.group(3)
    key = emoji.replace("\ufe0f", "")
    items.append({"emoji": emoji, "name": names.get(key, english),
                  "keywords": keywords.get(key, []) + [english],
                  "category": group, "category_name": groups[group]})
assert len(items) > 3500 and len({item["emoji"] for item in items}) == len(items)
data = json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n"
(ROOT / "emoji-ru.json").write_text(data)
repository = ROOT.parent.parent
(repository / "backend/internal/meetings/emoji.json").write_text(data)
print(f"{len(items)} emoji, {sum(item['emoji'].replace(chr(0xfe0f), '') not in names for item in items)} English fallbacks")
