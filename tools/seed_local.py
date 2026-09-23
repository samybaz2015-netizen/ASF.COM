# -*- coding: utf-8 -*-
"""إنشاء بيانات أولية في قاعدة البيانات المحلية للمراجعة.

ينشئ دوراً وفرعاً ومكتباً وحساب مدير، عبر نقاط نهاية البرنامج نفسها - فتُطبَّق
قواعده الداخلية (تجزئة كلمة المرور، الأدوار، الصلاحيات) كما في الإنتاج تماماً.

يرفض العمل على أي خادم غير محلي.

الاستخدام:
    python tools/seed_local.py [--base http://localhost:5080]
"""
import io
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid

BASE = "http://localhost:5080"
USERNAME = "admin"
PASSWORD = "Admin@12345"
EMAIL = "admin@local.test"
DISPLAY_NAME = "مدير النظام (محلي)"
BRANCH_NAME = "الرياض"
OFFICE_NAME = "المكتب الرئيسي"


def request(method, path, body=None, content_type="application/json", raw=None):
    url = BASE.rstrip("/") + path
    data = raw if raw is not None else (json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None)
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", content_type)
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            text = response.read().decode("utf-8", "replace")
            return response.status, text
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")
    except Exception as exc:  # noqa: BLE001
        return 0, str(exc)


def multipart(fields):
    boundary = "----asf" + uuid.uuid4().hex
    parts = []
    for name, value in fields.items():
        if value is None:
            continue
        parts.append("--" + boundary)
        parts.append('Content-Disposition: form-data; name="%s"' % name)
        parts.append("")
        parts.append(str(value))
    parts.append("--" + boundary + "--")
    parts.append("")
    body = "\r\n".join(parts).encode("utf-8")
    return body, "multipart/form-data; boundary=" + boundary


def step(title, status, text):
    ok = 200 <= status < 300
    mark = "نجح " if ok else "فشل "
    print("%s %-38s [%s] %s" % (mark, title, status, text[:160].replace("\n", " ")))
    return ok


def find_id(text, name):
    """يحاول استخراج المعرّف من رد JSON أو من قائمة بالاسم."""
    try:
        data = json.loads(text)
    except Exception:  # noqa: BLE001
        return None
    # ردود البرنامج مغلّفة: {statusCode, message, data}
    if isinstance(data, dict) and "data" in data and isinstance(data["data"], (list, dict)):
        data = data["data"]
    if isinstance(data, dict):
        for key in ("id", "Id", "branchId", "officeId"):
            if key in data:
                return data[key]
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and item.get("name") == name:
                for key in ("id", "Id"):
                    if key in item:
                        return item[key]
    return None


def main():
    global BASE
    if "--base" in sys.argv:
        BASE = sys.argv[sys.argv.index("--base") + 1]

    host = urllib.parse.urlparse(BASE).hostname or ""
    if host not in ("localhost", "127.0.0.1", "::1"):
        sys.exit("رُفض: هذه الأداة تعمل على الخادم المحلي فقط. الخادم المطلوب: " + host)

    print("الخادم: " + BASE)
    print()

    # 1) الأدوار
    for role in ("admin", "Engineer", "Consultant", "User"):
        status, text = request("POST", "/api/Account/create-role", body=role)
        step("إنشاء دور: " + role, status, text)

    # 2) الفرع
    status, text = request("POST", "/api/Branch", body={"name": BRANCH_NAME})
    step("إنشاء فرع: " + BRANCH_NAME, status, text)
    branch_id = find_id(text, BRANCH_NAME)
    if branch_id is None:
        status, text = request("GET", "/api/Branch")
        branch_id = find_id(text, BRANCH_NAME)
    print("   معرّف الفرع: %s" % branch_id)

    # 3) المكتب
    status, text = request("POST", "/api/Office", body={"name": OFFICE_NAME, "branchId": branch_id})
    step("إنشاء مكتب: " + OFFICE_NAME, status, text)
    office_id = find_id(text, OFFICE_NAME)
    if office_id is None:
        status, text = request("GET", "/api/Office")
        office_id = find_id(text, OFFICE_NAME)
    print("   معرّف المكتب: %s" % office_id)

    # 4) حساب المدير
    fields = {
        "UserName": USERNAME,
        "DisplayName": DISPLAY_NAME,
        "Email": EMAIL,
        "Password": PASSWORD,
        "UserType": "admin",
        "PhoneNumber": "0500000000",
        "BranchId": branch_id,
        "OfficeId": office_id,
    }
    body, content_type = multipart(fields)
    status, text = request("POST", "/api/Account/register", raw=body, content_type=content_type)
    step("إنشاء حساب: " + USERNAME, status, text)

    # 5) تأكيد الدخول
    query = urllib.parse.urlencode({"UserName": USERNAME, "Password": PASSWORD})
    status, text = request("POST", "/api/Account/login?" + query)
    ok = step("اختبار تسجيل الدخول", status, text)

    print()
    if ok:
        print("جاهز. بيانات الدخول المحلية:")
        print("   اسم المستخدم : " + USERNAME)
        print("   كلمة المرور  : " + PASSWORD)
    else:
        print("لم ينجح الدخول - راجع الرسائل أعلاه.")


if __name__ == "__main__":
    main()
