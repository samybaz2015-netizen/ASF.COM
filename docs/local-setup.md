# البيئة المحلية — تشغيل ومراجعة قبل الرفع

نسخة كاملة من برنامج عصف تعمل على الجهاز، معزولة تماماً عن الإنتاج.

## ما يعمل الآن

| المكوّن | العنوان | المصدر |
|---------|---------|--------|
| الواجهة الخلفية | `http://localhost:5080` | نسخة من ناتج النشر في `local/api` |
| توثيق الواجهة (Swagger) | `http://localhost:5080/swagger` | — |
| الواجهة الأمامية | `http://localhost:3000` | كود المصدر في `src/frontend` |
| قاعدة البيانات | `.\SQLEXPRESS` | `AsfDefault_Local` (79 جدولاً) · `AsfIdentity_Local` (12) |

## التشغيل

الواجهة الخلفية — نافذة PowerShell:
```
powershell -ExecutionPolicy Bypass -File E:\Asf\local\run-api.ps1
```

الواجهة الأمامية — نافذة ثانية:
```
npm start --prefix E:\Asf\src\frontend
```

ثم افتح `http://localhost:3000`.

## العزل عن الإنتاج
ثلاث طبقات حماية:

1. `run-api.ps1` يضع سلاسل الاتصال المحلية في **متغيرات البيئة**، وهي تتقدم على كل
   ملفات `appsettings` في ASP.NET Core — **ما دام الأمر يُنفَّذ داخل جلسته هو**.
2. `src/frontend/.env.local` يوجّه الواجهة إلى `http://localhost:5080`.
   القيمة الافتراضية في الكود تبقى خادم الإنتاج، فبناء الإنتاج لا يتأثر.
3. قاعدتا البيانات المحليتان تحملان بنية فقط — لا بيانات إنتاج على الجهاز.

## ⚠️ ثغرة الحماية: أوامر `dotnet ef`

متغيرات البيئة التي يضعها `run-api.ps1` تعيش **داخل جلسته وحدها**. ومن نفّذ أمر
ترحيل في نافذة أخرى:

```
dotnet ef database update --project ASF.Repository --startup-project ASF.API
```

قرأت الأداة `appsettings.Development.json` — وهو يحمل اتصال **الاستضافة الحيّة**
(`SQL1001.site4now.net`) — فذهب الترحيل إلى الإنتاج، ولا شيء في المخرجات يكشف
ذلك: تطبع «Applying…» ثم «Done» كأنها محلّية.

**حدث فعلاً في ٢١-٠٩-٢٠٢٦**: ترحيلا `AddWorkOrderTypeCode` و`AddContractListCategory`
طُبّقا على قاعدة الإنتاج بالخطأ. كلاهما إضافة عمود غير مدمِّرة على
`ContractWorkOrderTypes`، وقرّر المالك **إبقاءهما**.

### الوقاية — استعمل `local/ef.ps1` دائماً

يضبط الاتصال المحلي بنفسه ولا يعتمد على `appsettings` إطلاقاً:

```
powershell -ExecutionPolicy Bypass -File E:\Asf\local\ef.ps1 database update
powershell -ExecutionPolicy Bypass -File E:\Asf\local\ef.ps1 migrations add <الاسم>
powershell -ExecutionPolicy Bypass -File E:\Asf\local\ef.ps1 migrations list
```

ويطبع القاعدة التي يخاطبها قبل التنفيذ، فيُرى الخطأ قبل وقوعه.

**لا تُنفَّذ `dotnet ef` مباشرةً على هذا المستودع.**

## كيف بُنيت قاعدة البيانات
الترحيلات المدمجة في `RASM.Repository.dll` غير كافية (ترحيلان فقط يعدّلان جداول قائمة)،
فنُسخت البنية من الإنتاج بأداة `sqlpackage`:

```
powershell -ExecutionPolicy Bypass -File E:\Asf\tools\pull-schema.ps1
```

قراءة فقط من الإنتاج، و `ExtractAllTableData=False` يمنع نقل أي صف بيانات.

## ملفات بديلة في كود الواجهة
البناء المنشور أسقط وحدات كود ميت (مستوردة وغير مستخدمة، أو استخدامها معلّق بالتعليق)،
فلم تصل إلينا عبر خرائط المصدر. أُنشئت لها بدائل فارغة موثّقة ليكتمل البناء:

| الملف | سبب غيابه |
|-------|-----------|
| `src/util/deteminLocation.js` | نتيجته تُسنَد لمتغير غير مستخدم |
| `src/Pages/Project/MantainsProjectData.js` | داخل دالة لا تُستدعى |
| `src/Pages/Project/OperationProjectData.js` | داخل دالة لا تُستدعى |
| `src/Pages/DeleteOrders/MaintainceProjects.js` | مستورد وغير مستخدم |
| `src/Pages/DeleteOrders/OperationsProjects.js` | مستورد وغير مستخدم |
| `src/Pages/Dashoard/Dashboard.js` | مستورد مرتين، واستخدامه داخل تعليق JSX |
| `src/Component/LatestProjects/LatestProjects.js` | استخدامه داخل تعليق JSX |

كذلك خمس صور غير موجودة في البناء المنشور وُضعت لها صور شفافة بديلة:
`UploadIcon.png` · `engineer-workers-icon 1.png` · `iconupload.jpeg` ·
`microsoft-excel-icon 1.png` · `team-01.png`

**كلها كود ميت في الإنتاج، فسلوك النسخة المحلية مطابق للمنشور.** عند عودة المطور
تُستبدل بنسخها الأصلية.

## الأصول المسترجَعة
- 20 صورة و14 ملف خط استُرجعت من `static/media` بمطابقة `asset-manifest.json`
- 226 ملف كود و23 ملف أنماط من خرائط المصدر

## الأدوات
| الأداة | الغرض |
|--------|-------|
| `tools/ftp_pull.ps1` | تنزيل الموقع من الاستضافة |
| `tools/extract_sourcemap.py` | استخراج المصدر من خرائط المصدر |
| `tools/restore_images.py` | استرجاع الصور من ناتج البناء |
| `tools/make_stubs.py` | رصد الوحدات المفقودة وإنشاء بدائل موثّقة |
| `tools/pull-schema.ps1` | نسخ بنية قاعدة البيانات من الإنتاج |
| `tools/DbMigrator/` | تطبيق ترحيلات EF المدمجة (لم يكفِ وحده) |

## ما زال ينتظر المطور
منطق الواجهة الخلفية. `local/api` يشغّل ملفات DLL مترجمة — يمكن مراجعة سلوكها
وتعديل إعداداتها، لا تعديل منطقها.

## بيانات الدخول المحلية

| العنصر | القيمة |
|--------|--------|
| اسم المستخدم | `admin` |
| كلمة المرور | `Admin@12345` |
| الفرع | الرياض (id=1) |
| المكتب | المكتب الرئيسي (id=1) |
| الأدوار | admin · Engineer · Consultant · User |

أُنشئت بـ:
```
python tools/seed_local.py
```

السكربت يستخدم نقاط نهاية البرنامج نفسها، فتُطبَّق قواعده في تجزئة كلمة المرور والأدوار
والصلاحيات كما في الإنتاج. ويرفض العمل على أي خادم غير `localhost`.

هذه بيانات محلية فقط ولا وجود لها على الإنتاج.
