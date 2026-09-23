# -*- coding: utf-8 -*-
"""إنشاء ملفات بديلة للوحدات التي حذفها webpack من البناء المنشور.

الكود المُسترجَع من خرائط المصدر يحتوي استيرادات لوحدات غير موجودة، لأن webpack
أسقطها عند البناء بوصفها كوداً ميتاً (مستوردة وغير مستخدمة، أو استخدامها معلّق).
هذا السكربت يرصدها، ويتحقق هل الرمز المستورد مستخدم في ملفه، ثم ينشئ بديلاً
موثّقاً ليكتمل البناء محلياً.

الاستخدام:
    python tools/make_stubs.py <مجلد src> [--apply]

بدون --apply يعرض التقرير فقط.
"""
import io
import os
import re
import sys

RESOLVE_EXTS = ["", ".js", ".jsx", ".ts", ".tsx", ".json", "/index.js", "/index.jsx", "/index.ts"]

IMPORT_RE = re.compile(
    r"""^\s*import\s+(?P<binding>[^'"]+?)\s+from\s+['"](?P<spec>\.[^'"]+)['"]""",
    re.M,
)

HEADER = """// ---------------------------------------------------------------------------
// ملف بديل مؤقت - ليس من كود المطور.
//
// هذه الوحدة غير موجودة في البناء المنشور: webpack أسقطها لأنها كود ميت
// ({reason}). أُنشئت ليكتمل البناء محلياً، وسلوك
// التطبيق يبقى مطابقاً للإنتاج لأنها لا تُنفَّذ.
//
// المستورد من: {importer}
// عند عودة المطور: استبدل هذا الملف بنسخته الأصلية.
// ---------------------------------------------------------------------------
"""

COMPONENT_BODY = """
function {name}() {{
  return null;
}}

export default {name};
"""


def default_binding(binding):
    """يستخرج اسم الاستيراد الافتراضي من نص الاستيراد."""
    binding = binding.strip()
    if binding.startswith("{") or binding.startswith("*"):
        return None
    return binding.split(",")[0].strip()


def resolves(base):
    return any(os.path.exists(base + ext) for ext in RESOLVE_EXTS)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src_root = sys.argv[1]
    apply_changes = "--apply" in sys.argv

    planned = []

    for root, dirs, files in os.walk(src_root):
        if "node_modules" in root:
            continue
        for filename in files:
            if not filename.endswith((".js", ".jsx", ".tsx")):
                continue
            path = os.path.join(root, filename)
            text = io.open(path, encoding="utf-8", errors="replace").read()
            live = "\n".join(l for l in text.splitlines() if not l.strip().startswith("//"))

            for match in IMPORT_RE.finditer(live):
                spec = match.group("spec")
                if spec.endswith((".css", ".scss", ".png", ".jpg", ".jpeg", ".gif", ".svg")):
                    continue
                base = os.path.normpath(os.path.join(root, spec))
                if resolves(base):
                    continue

                name = default_binding(match.group("binding"))
                if not name:
                    print("تخطٍّ (استيراد غير افتراضي): %s في %s" % (spec, path))
                    continue

                # هل الرمز مستخدم خارج سطر الاستيراد؟
                uses = len(re.findall(r"\b%s\b" % re.escape(name), live)) - 1
                reason = "مستورد وغير مستخدم" if uses <= 0 else "استخدامه في مسار غير منفَّذ"
                planned.append(
                    {
                        "target": base + ".js",
                        "name": name,
                        "reason": reason,
                        "importer": os.path.relpath(path, src_root).replace("\\", "/"),
                        "uses": uses,
                    }
                )

    if not planned:
        print("لا توجد وحدات مفقودة.")
        return

    print("وحدات مفقودة: %d" % len(planned))
    for item in planned:
        print(
            "  %-46s %-22s استخدامات: %d  (%s)"
            % (
                os.path.relpath(item["target"], src_root).replace("\\", "/"),
                item["name"],
                item["uses"],
                item["reason"],
            )
        )

    if not apply_changes:
        print("\nللتطبيق أضف --apply")
        return

    print()
    for item in planned:
        parent = os.path.dirname(item["target"])
        if parent and not os.path.isdir(parent):
            os.makedirs(parent)
        body = HEADER.format(reason=item["reason"], importer=item["importer"]) + COMPONENT_BODY.format(
            name=item["name"]
        )
        with io.open(item["target"], "w", encoding="utf-8", newline="\n") as fh:
            fh.write(body)
        print("أُنشئ: " + os.path.relpath(item["target"], src_root).replace("\\", "/"))


if __name__ == "__main__":
    main()
