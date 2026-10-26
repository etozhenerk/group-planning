#!/usr/bin/env python3
"""Создаёт синтетический PDF для настоящего Documents picker QA target."""

from pathlib import Path
import sys

folder = Path(sys.argv[1])
folder.mkdir(parents=True, exist_ok=True)
stream = b"BT /F1 18 Tf 36 140 Td (somewhere QA attachment) Tj ET\n"
objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] "
    b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"endstream",
]
result = bytearray(b"%PDF-1.4\n")
offsets = [0]
for number, body in enumerate(objects, start=1):
    offsets.append(len(result))
    result.extend(f"{number} 0 obj\n".encode() + body + b"\nendobj\n")
xref = len(result)
result.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
for offset in offsets[1:]:
    result.extend(f"{offset:010d} 00000 n \n".encode())
result.extend(
    f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
)
target = folder / "somewhere-qa-rules.pdf"
target.write_bytes(result)
target.chmod(0o600)
