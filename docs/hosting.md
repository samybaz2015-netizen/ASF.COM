# الاستضافة — SmarterASP.NET

الحساب: `asfconsult-002`. المسار الفعلي على الخادم: `h:\root\home\asfconsult-002\www\`

| المجلد على الخادم | اسم الموقع | العنوان | يخص |
|--------------------|-----------|---------|------|
| `www/api` | api | asfconsult-002-site1.ftempurl.com | **عصف** — الواجهة الخلفية |
| `www/Frontend` | frontend | asfconsult-002-site2.ftempurl.com · asf-consulting.com | **عصف** — الواجهة الأمامية |
| `www/db` | — | — | مجلد قاعدة البيانات (سكربتات أو نسخ) — يُفحص لاحقاً |
| `www/ataa` | ataa | asfconsult-002-site3.ftempurl.com | **عطاء — خارج نطاق هذا المشروع** |

انتبه لحرف `F` الكبير في `Frontend`.

## ما هو المرفوع فعلياً
محتوى `www/api` كما ظهر في File Manager:

```
Credentials/   Logs/   runtimes/   wwwroot/   appsettings.Development.json   appsettings.json
```

هذا **ناتج نشر .NET مترجَم** (publish output)، وليس كوداً مصدرياً:
- `runtimes/` و `wwwroot/` و `appsettings.json` توقيع مشروع ASP.NET Core منشور.
- منطق البرنامج داخل ملفات `.dll` — غير قابلة للتعديل مباشرة.

**الأثر:** تنزيل هذه الملفات يعطينا نسخة احتياطية تعمل، لكن التحديث الحقيقي يحتاج المشروع المصدري
(`.sln` / `.csproj`). راجع `docs/source-status.md`.

## قاعدة الفصل
عطاء يشارك عصف نفس حساب الاستضافة، لذلك الفصل ليس محلياً فقط:

- `tools/ftp_pull.ps1` يستبعد `ataa` تلقائياً ويرفض التشغيل عليه حتى لو حُدّد صراحةً.
- أي أداة رفع مستقبلية يجب أن تلتزم بنفس القيد.
- لا تستخدم قاعدة بيانات عطاء ولا أي إعداد يخصّها.

## الأسرار
`www/api` يحوي مجلد `Credentials/` وملفات `appsettings*.json` — فيها على الأرجح سلاسل اتصال
ومفاتيح إنتاج. لذلك `backup/` و `Credentials/` و `appsettings.json` مستثناة كلها من Git.

بيانات FTP في `tools/ftp.env` (مستثنى من Git).

## أوامر جاهزة

معاينة بدون تنزيل:
```
powershell -ExecutionPolicy Bypass -File tools\ftp_pull.ps1 -ListOnly
```

تنزيل الواجهة الخلفية:
```
powershell -ExecutionPolicy Bypass -File tools\ftp_pull.ps1 -RemoteDir /www/api -Destination E:\Asf\backup\api
```

تنزيل الواجهة الأمامية:
```
powershell -ExecutionPolicy Bypass -File tools\ftp_pull.ps1 -RemoteDir /www/frontend -Destination E:\Asf\backup\frontend
```

ملاحظة: إن كان جذر FTP هو مجلد الحساب فالمسارات كما أعلاه؛ وإن كان الجذر هو `www` نفسه
فاستخدم `/api` و `/frontend`. الأمر `-ListOnly` يحسم ذلك.
