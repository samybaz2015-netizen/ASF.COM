# -*- coding: utf-8 -*-
"""استرجاع صور المشروع من ناتج البناء المنشور.

الصور لا تُحفظ في خرائط المصدر، لكن create-react-app ينسخها إلى static/media
بأسماء فيها بصمة، ويسجّل الاسم الأصلي في asset-manifest.json. هذا السكربت يعكس
تلك الخريطة ويعيد بناء مجلد src/Image.

الاستخدام:
    python tools/restore_images.py <مجلد البناء> <مجلد الوجهة>
"""
import io
import json
import os
import shutil
import sys

# امتدادات نتعامل معها كصور مشروع؛ الخطوط تأتي من node_modules فنتجاهلها.
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp"}


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)

    build_dir = sys.argv[1]
    out_dir = sys.argv[2]

    manifest_path = os.path.join(build_dir, "asset-manifest.json")
    with io.open(manifest_path, encoding="utf-8") as fh:
        manifest = json.load(fh)

    files = manifest.get("files", {})
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)

    copied = skipped = missing = 0

    for logical, served in files.items():
        if not logical.startswith("static/media/"):
            continue

        original_name = logical[len("static/media/"):]
        ext = os.path.splitext(original_name)[1].lower()
        if ext not in IMAGE_EXTS:
            skipped += 1
            continue

        source = os.path.join(build_dir, served.lstrip("/").replace("/", os.sep))
        if not os.path.isfile(source):
            print("  مفقود على القرص: " + served)
            missing += 1
            continue

        target = os.path.join(out_dir, original_name)
        shutil.copy2(source, target)
        print("  %s  <-  %s" % (original_name, os.path.basename(served)))
        copied += 1

    print()
    print("نُسخت %d صورة، وتُخطّي %d (خطوط/أخرى)، ومفقود %d." % (copied, skipped, missing))
    print("الوجهة: " + os.path.abspath(out_dir))


if __name__ == "__main__":
    main()
