# -*- coding: utf-8 -*-
"""استخراج الكود المصدري الأصلي من خريطة مصدر (.js.map).

خرائط المصدر التي ينتجها create-react-app تحتوي حقل sourcesContent، وفيه نص كل
ملف مصدر كما كتبه المطور قبل الترجمة. هذا السكربت يعيد بناء شجرة المشروع منه.

الاستخدام:
    python tools/extract_sourcemap.py <ملف.js.map> <مجلد الوجهة> [--include-node-modules]
"""
import io
import json
import os
import sys

SKIP_PREFIXES = ("../webpack/", "webpack/")


def clean_path(source):
    """يحوّل مسار المصدر إلى مسار ملف آمن نسبي."""
    path = source
    for prefix in ("webpack://", "webpack:///"):
        if path.startswith(prefix):
            path = path[len(prefix):]
    path = path.lstrip("/")
    parts = []
    for part in path.replace("\\", "/").split("/"):
        if part in ("", ".", ".."):
            continue
        # أسماء غير صالحة على ويندوز
        for bad in '<>:"|?*':
            part = part.replace(bad, "_")
        parts.append(part)
    return os.path.join(*parts) if parts else None


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)

    map_path = sys.argv[1]
    out_dir = sys.argv[2]
    include_modules = "--include-node-modules" in sys.argv

    with io.open(map_path, encoding="utf-8") as fh:
        data = json.load(fh)

    sources = data.get("sources") or []
    contents = data.get("sourcesContent") or []
    if not contents:
        sys.exit("لا يوجد sourcesContent في هذه الخريطة - لا يمكن استخراج المصدر.")

    written = skipped = 0
    written_bytes = 0

    for index, source in enumerate(sources):
        if index >= len(contents):
            break
        text = contents[index]
        if text is None:
            skipped += 1
            continue
        if source.startswith(SKIP_PREFIXES):
            skipped += 1
            continue
        if not include_modules and "node_modules" in source:
            skipped += 1
            continue

        rel = clean_path(source)
        if not rel:
            skipped += 1
            continue

        target = os.path.join(out_dir, rel)
        parent = os.path.dirname(target)
        if parent and not os.path.isdir(parent):
            os.makedirs(parent)
        with io.open(target, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        written += 1
        written_bytes += len(text.encode("utf-8"))

    print("استُخرج %d ملفاً (%.1f كيلوبايت)، وتُخطّي %d." % (written, written_bytes / 1024.0, skipped))
    print("الوجهة: " + os.path.abspath(out_dir))


if __name__ == "__main__":
    main()
