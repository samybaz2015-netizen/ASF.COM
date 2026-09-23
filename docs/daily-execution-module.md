# وحدة تحديث التنفيذ اليومي — Daily Execution Update

مواصفة تنفيذية كاملة، مبنية على فحص النظام الفعلي: قاعدة البيانات (91 جدولاً)،
و216 نقطة نهاية، وكود الواجهة المسترجَع.

> تحل محل `daily-execution-update.md` وتوسّعها إلى الوحدة الكاملة بشقّها المالي.

---

## 0. الخلاصة التنفيذية

| الشق | الحالة |
|------|--------|
| تسجيل الكميات اليومية وحسابها وسجلّها | ✅ موجود في النظام ومبني عليه في الواجهة |
| دورة الاعتماد والحالات والمسودة | ❌ يحتاج خلفية |
| إضافة بند جديد من التحديث | ❌ يحتاج خلفية |
| إلزام الصور ونماذج الإشراف | ⚠️ في الواجهة فقط — الإلزام الحقيقي يحتاج خلفية |
| **أسعار الإشراف** | ✅ `PricingItems` هي كتالوج أسعار الإشراف نفسه |
| **مستحقات الاستشاري** | ⚠️ الحساب متاح؛ الناقص لقطة السعر وحالة الكمية مالياً |
| المستخلصات وحالة الكمية مالياً | ❌ غير موجودة |
| التقارير والتصدير | ❌ يحتاج خلفية |

**تحديث 19 سبتمبر 2026:** وصل الكود المصدري للواجهة الخلفية (`ASF.Solution.API`)،
فارتفع الحاجز الذي كان يمنع تنفيذ البند 50. صار التنفيذ ممكناً بالكامل.

---

## 1. واقع النظام — خمس حقائق تحكم التصميم

### 1.1 لا يوجد `WorkOrders` ولا `WorkOrderItems`
المواصفة تفترضهما. الواقع **خمسة أنواع متوازية**:

| النوع | أمر العمل | البنود | سجل التحديثات |
|-------|-----------|--------|----------------|
| إنشاءات | `Constructions` | `ConstructionPricingItems` | `ConstructionPricingItemUpdateLogs` |
| طوارئ | `Emergencys` | `EmergencyPricingItems` | `EmergencyPricingItemUpdateLogs` |
| صيانة | `Maintenances` | `MaintenancePricingItems` | `MaintenancePricingItemUpdateLogs` |
| مشاريع جديدة | `NewProjects` | `NewProjectPricingItems` | `NewProjectPricingItemUpdateLogs` |
| مشاريع خاصة | `PrivateProjects` | `ProjectPricingItems` | — |

**الأثر:** كل كيان جديد يحمل `(WorkOrderType, WorkOrderId)` لا `WorkOrderId` وحده.
وكل استعلام تقارير يوحّد الأنواع الخمسة بـ `UNION ALL` أو بجدول ربط.

### 1.2 بنود المقايسة تحمل حقول التنفيذ أصلاً
```
ConstructionId | PricingItemId | TotalPrice | EstimatedQuantity
ExecutedQuantity | ExecutedWorksValue | ExecutionPercentage
```
شرط «ممنوع إنشاء نسخة مستقلة من البنود» مُحقَّق بالبناء على هذه الحقول.

### 1.3 نقاط تحديث الكميات موجودة وتطبّق **فوراً**
```
PUT /api/Construction/{id}/pricing-items/executed-quantity(-ies)
PUT /api/{Maintenance|Emergency|RehabilitationWorks}/{id}/update-executed-quantity(-ies)
GET .../executed-quantity-logs
```
الحقل `executedQuantity` هو **كمية اليوم** (زيادة) لا الإجمالي؛ الخادم يجمعها ويعيد
`totalExecutedQuantity` ويكتب سطراً في سجل التحديثات.

**لكن:** لا حالة معلّقة. الكمية تدخل الإجماليات فور الإرسال. البند 22 يشترط عكس ذلك،
وهذا **تغيير في سلوك الخلفية** لا يمكن عمله من الواجهة.

### 1.4 تصحيح: `PricingItems` هي كتالوج أسعار الإشراف

**تصحيح لما ورد في نسخة سابقة من هذه الوثيقة.** بعد وصول الكود المصدري تبيّن أن
`PricingItems` ليست أسعار تنفيذ المقاول، بل **أسعار وحدات الإشراف للاستشاري**.

الدليل قاطع: `ASF.Core/Repository/PricingItemsSeed.cs` يبذر البنود بنصوصها، وكلها
تبدأ بـ «الاشراف على…»:

```
201010101  الاشراف على تركيب عمود حديدي <= 10م في تربة عادية/رملية   97.6 SAR
201010102  الاشراف على تركيب عمود حديدي <= 10 م في تربة صخرية       113.2 SAR
```

وهي نفس بنود ملف «ملحق الأسعار» الذي يُستورد من صفحة الإعدادات.

**الأثر على الوحدة:** حساب مستحق الاستشاري متاح بالفعل:

```
مستحق الإشراف للبند = الكمية المعتمدة × PricingItems.UnitPrice
```

وما يبقى ناقصاً ليس مصدر السعر، بل:
- **لقطة السعر** وقت الاعتماد، حتى لا يغيّر تعديل سعر لاحق مستحق يوم مضى
- **حالة الكمية مالياً** (دخلت مستخلصاً أو لا) لمنع احتسابها مرتين
- **ربط السعر بعقد الاستشاري** إن اختلفت الأسعار بين العقود

هذا أبسط بكثير من بناء مصدر تسعير من الصفر كما قُدّر سابقاً.

### 1.5 الواجهة تعرض القيم موسومة
جدول التحديث اليومي يعرض عمودي «سعر وحدة الإشراف» و«قيمة الإشراف» فارغين مع تنبيه.
بعد هذا التصحيح يجب ملؤهما من `PricingItems.UnitPrice` وإزالة التنبيه.

### 1.6 نظام الصلاحيات قائم ومنظّم
`GET /api/Permissions/available` يعيد `{Module}.{Action}` لكل وحدة، و`/my` يعيد صلاحيات
المستخدم. الصلاحيات الخمس عشرة المطلوبة تُبنى على نفس النمط.

---

## 2. المبدأ المالي — الفصل الإلزامي

```
كمية التنفيذ الميداني  ──►  إثبات تقدّم أمر العمل
                            (نسبة الإنجاز، المتابعة، المؤشرات)

الكمية المعتمدة للإشراف ──►  × سعر وحدة الإشراف ──►  مستحق الاستشاري
```

ثلاثة أرقام لا تختلط أبداً:

| الرقم | مصدره | يُستخدم في |
|-------|--------|-----------|
| `ExecutedQuantity` | تسجيل ميداني معتمد | نسبة الإنجاز والمتابعة |
| `SupervisionUnitPrice` | `PricingItems.UnitPrice` — كتالوج أسعار الإشراف | حساب المستحق فقط |
| `SupervisionValue` | الكمية المعتمدة × سعر الإشراف | مستخلص الاستشاري |

`PricingItems.UnitPrice` **هو** سعر وحدة الإشراف، لا سعر تنفيذ المقاول — راجع 1.4.
لكن يبقى الفصل قائماً في اتجاه آخر: نسبة إنجاز العمل تُحسب بالكميات ومنهجية أمر
العمل، لا بقيمة مستحق الاستشاري.

وبالمثل (البند 27): نسبة الإنجاز تُحسب بمنهجية أمر العمل، **لا** بقيمة مستحق الاستشاري.

### ما طُبّق في الواجهة الآن
الأعمدة موسومة، وعمودا الإشراف ما زالا فارغين. **مطلوب الآن:** ملؤهما من
`PricingItems.UnitPrice` وإزالة التنبيه، بعد أن تبيّن أن المصدر موجود.

---

## 3. تسعير الإشراف — ما يبقى بعد التصحيح

السعر موجود في `PricingItems`. الناقص هو ربطه بعقد الاستشاري وتاريخ سريانه،
وهو مطلوب فقط إن اختلفت الأسعار بين العقود أو تغيّرت بمرور الوقت:

```sql
ConsultantContracts
  Id, ConsultantId FK -> Consultants, ContractNumber,
  BranchId, StartDate, EndDate, IsActive

ConsultantSupervisionRates
  Id,
  ConsultantContractId FK,
  PricingItemId        FK -> PricingItems,   -- البند المرجعي
  SupervisionUnitPrice decimal(18,4) NOT NULL,
  Currency             nvarchar(8) NOT NULL DEFAULT 'SAR',
  EffectiveFrom        date NOT NULL,
  EffectiveTo          date NULL,
  UNIQUE (ConsultantContractId, PricingItemId, EffectiveFrom)
```

`EffectiveFrom/To` ضرورية: تغيير سعر الإشراف لاحقاً يجب ألا يغيّر مستحق يوم مضى.
ولهذا يُخزَّن السعر لقطةً (snapshot) على كل كمية معتمدة.

**يمكن تغذيته من صفحة الإعدادات** بنفس آلية استيراد ملحق الأسعار المبنية فعلاً —
ملف أسعار إشراف لكل عقد استشاري.

---

## 4. نموذج البيانات

```sql
DailyExecutionUpdates
  Id                  int identity PK
  UpdateNumber        nvarchar(16) NOT NULL UNIQUE    -- DU-000125
  WorkOrderType       nvarchar(32) NOT NULL
  WorkOrderId         int          NOT NULL
  ExecutionDate       date         NOT NULL
  Status              nvarchar(16) NOT NULL           -- Draft|Submitted|Approved|Returned|Rejected
  CreatedByUserId     nvarchar(450) NOT NULL
  CreatedAt           datetime2    NOT NULL
  SubmittedAt         datetime2    NULL
  ReviewedByUserId    nvarchar(450) NULL
  ReviewedAt          datetime2    NULL
  ReturnReason        nvarchar(max) NULL
  ProgressBefore      float NULL
  ProgressAfter       float NULL
  TotalSupervisionValue decimal(18,2) NULL
  Notes               nvarchar(max) NULL
  RowVersion          rowversion
  INDEX (WorkOrderType, WorkOrderId, ExecutionDate)

DailyExecutionUpdateItems
  Id, DailyExecutionUpdateId FK,
  PricingItemId int NOT NULL,
  DailyQuantity float NOT NULL,
  ExecutedBefore float NULL,
  ExecutedAfter  float NULL,
  SupervisionUnitPriceSnapshot decimal(18,4) NULL,   -- لقطة وقت الاعتماد
  SupervisionValue             decimal(18,2) NULL,
  Notes nvarchar(max) NULL,
  UNIQUE (DailyExecutionUpdateId, PricingItemId)

DailyExecutionNewItems                    -- البنود المضافة بانتظار الاعتماد
  Id, DailyExecutionUpdateId FK,
  PricingItemId int NOT NULL,             -- من الكتالوج المعتمد فقط
  ProposedQuantity float NOT NULL,
  DailyQuantity    float NOT NULL,
  ReasonForAddition nvarchar(max) NOT NULL,   -- إلزامي (البند 13)
  Status nvarchar(16) NOT NULL,               -- Pending|Approved|Rejected
  ApprovedAt datetime2 NULL

DailyExecutionAttachments
  Id, DailyExecutionUpdateId FK, PricingItemId NULL,
  Category nvarchar(16),                      -- Before|During|After|Other
  FileUrl, FileName, ContentType, SizeBytes,
  Description, PhotoDate, UploadedByUserId, UploadedAt

DailyExecutionSupervisionForms
  Id, DailyExecutionUpdateId FK, PricingItemId NULL,
  FormType, FormName, FormNumber, FormDate,
  FileUrl, FileName, Notes, UploadedByUserId, UploadedAt

SupervisionFormRequirements                 -- البند 19
  Id, ContractNumber NULL, WorkOrderType NULL,
  ActivityType NULL, Stage NULL, PricingItemId NULL,
  RequiredFormType nvarchar(64) NOT NULL, IsMandatory bit NOT NULL

DailyExecutionApprovals
  Id, DailyExecutionUpdateId FK,
  Action nvarchar(16),                        -- Submit|Approve|Return|Reject
  ActedByUserId, ActedAt, Reason nvarchar(max)

SupervisionQuantities                        -- الكمية المعتمدة للإشراف
  Id,
  WorkOrderType, WorkOrderId, PricingItemId,
  DailyExecutionUpdateId FK,
  SupervisedQuantity   float         NOT NULL,
  SupervisionUnitPrice decimal(18,4) NOT NULL,
  SupervisionValue     decimal(18,2) NOT NULL,
  FinancialStatus nvarchar(24) NOT NULL,      -- Approved|NotInClaim|IncludedInClaim|Certified|Paid
  ClaimId int NULL,
  ApprovedAt datetime2 NOT NULL,
  UNIQUE (DailyExecutionUpdateId, PricingItemId)   -- يمنع احتساب الكمية مرتين

DailyExecutionAuditLogs                      -- البند 32
  Id, WorkOrderType, WorkOrderId, DailyExecutionUpdateId NULL,
  EntityType, EntityId, Action,
  OldValue nvarchar(max), NewValue nvarchar(max),
  ChangedByUserId, ChangedAt, ApprovedByUserId NULL, Source
```

### حقل مصدر البند (البند 16)
يُضاف إلى جداول البنود الخمسة:
```sql
ALTER TABLE ConstructionPricingItems
  ADD SourceType nvarchar(24) NOT NULL DEFAULT 'OriginalBOQ',   -- OriginalBOQ|DailyExecutionUpdate
      SourceDailyUpdateId int NULL;
```
ترحيل غير هدّام: كل الصفوف القائمة تصبح `OriginalBOQ` تلقائياً.

---

## 5. نقاط النهاية

```
GET    /api/DailyExecution/work-orders/search?q=&type=
GET    /api/DailyExecution/{type}/{workOrderId}
GET    /api/DailyExecution/{type}/{workOrderId}/boq
GET    /api/DailyExecution/{type}/{workOrderId}/updates
GET    /api/DailyExecution/{type}/{workOrderId}/supervision-summary
GET    /api/DailyExecution/items/{pricingItemId}/history?type=&workOrderId=

POST   /api/DailyExecution                       إنشاء مسودة
PUT    /api/DailyExecution/{id}                  تعديل مسودة
DELETE /api/DailyExecution/{id}                  حذف مسودة
POST   /api/DailyExecution/{id}/items            تسجيل كميات
POST   /api/DailyExecution/{id}/new-items        اقتراح بند جديد
POST   /api/DailyExecution/{id}/attachments      صور التنفيذ
POST   /api/DailyExecution/{id}/supervision-forms
DELETE /api/DailyExecution/attachments/{id}      قبل الاعتماد فقط

POST   /api/DailyExecution/{id}/submit
POST   /api/DailyExecution/{id}/approve
POST   /api/DailyExecution/{id}/return           سبب إلزامي
POST   /api/DailyExecution/{id}/reject

GET    /api/DailyExecution/reports/daily
GET    /api/DailyExecution/reports/supervision
GET    /api/DailyExecution/reports/no-updates
GET    /api/DailyExecution/reports/{name}/export
```

---

## 6. الصلاحيات الخمس عشرة

```
DailyExecution.View          DailyExecution.Create        DailyExecution.EditDraft
DailyExecution.AddItem       DailyExecution.UploadPhotos  DailyExecution.UploadForms
DailyExecution.Submit        DailyExecution.Review        DailyExecution.Approve
DailyExecution.Return        DailyExecution.ViewAll       DailyExecution.ViewDues
DailyExecution.ExportExecution  DailyExecution.ExportSupervision
DailyExecution.ExportDues
```
تُضاف إلى `PermissionsCatalog` القائم، وتُفحص في الخلفية لا في الواجهة (البند 4).
وتُدمج مع فلترة النطاق القائمة: الإدارة، المكتب، النوع، الجهد، المنطقة.

---

## 7. الاعتماد — معاملة واحدة (البندان 46 و47)

```csharp
await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
try
{
    // 1) اقرأ الرأس مع RowVersion؛ ارفض إن لم تكن الحالة Submitted (منع الاعتماد المزدوج)
    // 2) لكل بند: أعد القراءة من {Type}PricingItems — لا تثق بقيم الواجهة إطلاقاً
    // 3) تحقق: Executed + Daily <= Estimated إلا بصلاحية تجاوز
    // 4) تحقق: صور موجودة، ونماذج الإشراف الإلزامية مرفقة
    // 5) البنود الجديدة: أضِفها إلى المقايسة بـ SourceType = DailyExecutionUpdate
    //    و SourceDailyUpdateId = رقم التحديث
    // 6) حدّث ExecutedQuantity / ExecutedWorksValue / ExecutionPercentage
    // 7) أعد حساب نسبة أمر العمل بمنهجية النظام المعتمدة
    // 8) أنشئ SupervisionQuantities بلقطة سعر الإشراف
    //    (تخطَّ البند إن لم يوجد سعر إشراف، وسجّل تحذيراً — لا تفترض سعراً)
    // 9) اكتب {Type}PricingItemUpdateLogs + DailyExecutionAuditLogs (Before/After)
    // 10) Status = Approved، وسجّل DailyExecutionApprovals، وأطلق الإشعارات
    await db.SaveChangesAsync();
    await tx.CommitAsync();
}
catch (DbUpdateConcurrencyException) { await tx.RollbackAsync(); return Conflict(); }
catch { await tx.RollbackAsync(); throw; }
```

ثلاثة حواجز ضد الازدواج:
1. `RowVersion` على الرأس.
2. شرط `Status == Submitted` داخل المعاملة.
3. `UNIQUE (DailyExecutionUpdateId, PricingItemId)` على `SupervisionQuantities`.

---

## 8. ما هو مبني في الواجهة الآن

`/daily-execution` — صفحة عاملة على نقاط النهاية القائمة:

| العنصر | الحالة |
|--------|--------|
| البحث بالرقم عبر الأنواع الأربعة | ✅ |
| بطاقة أمر العمل | ✅ بالحقول المتاحة |
| جدول البنود والحسابات اللحظية | ✅ |
| الفصل المالي وتوسيم القيم | ✅ |
| أعمدة الإشراف | ✅ ظاهرة وفارغة مع تنبيه |
| التحقق ومنع الإرسال المزدوج | ✅ في الواجهة |
| صور التنفيذ ونماذج الإشراف | ✅ رفع ومعاينة وتصنيف |
| سجل التحديث اليومي | ✅ |
| حفظ كمسودة / دورة الاعتماد | ⛔ معطّل بوضوح |
| إضافة بند جديد | ⛔ |
| التقارير والتصدير | ⛔ |

---

## 9. معايير القبول — الحالة الحالية

| # | المعيار | الحالة |
|---|---------|--------|
| 1 | رؤية أوامر العمل حسب الصلاحية | ✅ عبر فلترة الخلفية القائمة |
| 2 | البحث بالرقم | ✅ |
| 3 | عرض المقايسة الصحيحة | ✅ |
| 4 | تسجيل كمية يومية | ✅ |
| 5 | منع الاعتماد بلا صور | ⚠️ واجهة فقط |
| 6 | التحقق من نموذج الإشراف الإلزامي | ❌ |
| 7–12 | إضافة بند جديد ومصدره وتتبّعه | ❌ |
| 13–14 | الكميات التراكمية ونسبة الإنجاز | ✅ |
| 15–18 | كمية الإشراف وسعرها ومستحق الاستشاري | ❌ **لا مصدر للسعر** |
| 19 | منع احتساب الكمية مرتين | ❌ |
| 20 | ظهور المرفقات في أمر العمل | ⚠️ جزئي |
| 21 | سجل التحديث اليومي | ✅ |
| 22–23 | سجل أمر العمل و Audit Before/After | ⚠️ جزئي |
| 24–25 | منع الاعتماد المزدوج و Rollback | ❌ |
| 26–27 | الانعكاس على التقارير والمستخلصات | ❌ |

**8 من 27 مُحقَّقة، و3 جزئية، و16 تنتظر الخلفية.**

---

## 10. ترتيب التنفيذ المقترح للمطور

1. **مصدر تسعير الإشراف أولاً** — `ConsultantContracts` و`ConsultantSupervisionRates`.
   بدونه لا معنى لأي شق مالي، وكل ما يُبنى فوقه سيُعاد.
2. رأس التحديث وبنوده وحالاته + تعليق الأثر حتى الاعتماد.
3. المرفقات ونماذج الإشراف وجدول الإلزام.
4. البنود الجديدة و`SourceType`.
5. معاملة الاعتماد و`SupervisionQuantities` و Audit.
6. التقارير الثلاثة والتصدير.
7. الإشعارات.

---

## 11. ملاحظات على الفرضيات

- **اسم البرنامج:** نص الطلب يقول «برنامج عطاء»، والتصميم المرفق يحمل شعار عصف،
  وكل العمل هنا على عصف. مضينا على عصف — يُصحَّح إن كان القصد غير ذلك.
- `executedQuantity` في الـ API زيادة لا إجمالي — مستنتج من `ExecutedQuantityCell.jsx`.
  على المطور تأكيدها.
- `RehabilitationWorks` لها نقاط نهاية بلا جدول بنفس الاسم — تحتاج توضيحاً.
- `NewProjects` و`PrivateProjects` بلا نقاط تحديث كميات — مستثناة حالياً.
- **عطل قائم:** `POST /api/PricingItems` يفشل بـ `Cannot insert explicit value for
  identity column`. تحققنا أن `Id` عمود هوية في الإنتاج والمحلي معاً، وأن
  `POST /api/Branch` يعمل. الإصلاح على الأرجح `.ValueGeneratedOnAdd()` على
  `PricingItem.Id`. هذا يعطّل إضافة بنود جديدة للكتالوج، ومنها استيراد ملحق الأسعار.
