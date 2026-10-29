"""Trich text PDF theo trang (pypdf) va cache ra JSON.

Ported from: on-call/tools/m12/pdf_text.py
Dung:  python pdf_text.py <pdf_path> <cache_json>
Output JSON: {"pdf": "...", "pages": ["text trang 1", ...]}
Script nay chi doc file PDF cuc bo; khong goi mang.
"""
import json
import os
import sys

from pypdf import PdfReader


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: pdf_text.py <pdf> <cache_json>", file=sys.stderr)
        return 2
    pdf, out = sys.argv[1], sys.argv[2]
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(pdf):
        return 0
    reader = PdfReader(pdf)
    pages = []
    for p in reader.pages:
        try:
            pages.append(p.extract_text() or "")
        except Exception as exc:  # trang loi van giu vi tri
            pages.append(f"[extract_error: {exc}]")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"pdf": os.path.basename(pdf), "pages": pages}, f, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
