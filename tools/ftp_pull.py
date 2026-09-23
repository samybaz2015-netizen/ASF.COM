# -*- coding: utf-8 -*-
"""تنزيل موقع عصف كاملاً من استضافة SmarterASP.NET عبر FTP.

بيانات الدخول تُقرأ من ملف tools/ftp.env ولا تُكتب في الكود ولا في Git.
الاستخدام:  python tools/ftp_pull.py [المجلد_المحلي]
"""
import ftplib
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENV_PATH = os.path.join(HERE, "ftp.env")

SKIP_DIRS = {"logs", "log", "_vti_cnf", "App_Data/Logs"}


def load_env(path):
    if not os.path.exists(path):
        sys.exit(
            "لم أجد ملف tools/ftp.env.\n"
            "انسخ tools/ftp.env.example إلى tools/ftp.env واملأ بياناتك ثم أعد التشغيل."
        )
    cfg = {}
    with open(path, encoding="utf-8-sig") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            cfg[key.strip()] = value.strip().strip('"').strip("'")
    missing = [k for k in ("FTP_HOST", "FTP_USER", "FTP_PASS") if not cfg.get(k)]
    if missing:
        sys.exit("ناقص في ftp.env: " + ", ".join(missing))
    return cfg


def connect(cfg):
    host = cfg["FTP_HOST"].replace("ftp://", "").strip("/")
    port = int(cfg.get("FTP_PORT", 21))
    ftp = ftplib.FTP()
    ftp.encoding = "utf-8"
    ftp.connect(host, port, timeout=60)
    ftp.login(cfg["FTP_USER"], cfg["FTP_PASS"])
    ftp.set_pasv(cfg.get("FTP_PASSIVE", "1") not in ("0", "false", "False"))
    return ftp


def listdir(ftp, path):
    """يرجع [(name, is_dir, size)] مع تفضيل MLSD والرجوع إلى LIST عند عدم دعمه."""
    try:
        return [
            (name, facts.get("type") == "dir", int(facts.get("size", 0) or 0))
            for name, facts in ftp.mlsd(path)
            if name not in (".", "..")
        ]
    except (ftplib.error_perm, ftplib.error_proto):
        pass

    lines = []
    ftp.retrlines("LIST " + path, lines.append)
    out = []
    for line in lines:
        parts = line.split(maxsplit=8)
        if len(parts) < 9:
            continue
        name = parts[8]
        if name in (".", ".."):
            continue
        is_dir = line[0] == "d" or "<DIR>" in line
        try:
            size = 0 if is_dir else int(parts[4])
        except ValueError:
            size = 0
        out.append((name, is_dir, size))
    return out


def download_tree(ftp, remote, local, stats):
    os.makedirs(local, exist_ok=True)
    try:
        entries = listdir(ftp, remote)
    except ftplib.error_perm as exc:
        print("  تعذّر قراءة %s (%s)" % (remote, exc))
        stats["errors"] += 1
        return

    for name, is_dir, size in entries:
        remote_child = remote.rstrip("/") + "/" + name
        local_child = os.path.join(local, name)
        if is_dir:
            if name in SKIP_DIRS:
                print("  تخطّي مجلد: " + remote_child)
                continue
            download_tree(ftp, remote_child, local_child, stats)
        else:
            try:
                with open(local_child, "wb") as fh:
                    ftp.retrbinary("RETR " + remote_child, fh.write, 32768)
                stats["files"] += 1
                stats["bytes"] += size
                print("  %s (%d bytes)" % (remote_child, size))
            except ftplib.all_errors as exc:
                print("  فشل تنزيل %s: %s" % (remote_child, exc))
                stats["errors"] += 1


def main():
    cfg = load_env(ENV_PATH)
    target = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "backup", "live-" + time.strftime("%Y-%m-%d"))
    remote_root = cfg.get("FTP_REMOTE_DIR", "/").rstrip("/") or "/"

    print("الاتصال بـ %s ..." % cfg["FTP_HOST"])
    ftp = connect(cfg)
    print("تم الدخول. المجلد البعيد: %s" % remote_root)
    print("الوجهة المحلية: %s\n" % target)

    stats = {"files": 0, "bytes": 0, "errors": 0}
    started = time.time()
    try:
        download_tree(ftp, remote_root, target, stats)
    finally:
        try:
            ftp.quit()
        except ftplib.all_errors:
            ftp.close()

    print(
        "\nانتهى: %d ملف، %.1f ميجابايت، %d خطأ، في %.0f ثانية."
        % (stats["files"], stats["bytes"] / 1048576.0, stats["errors"], time.time() - started)
    )
    print("المسار: " + target)


if __name__ == "__main__":
    main()
