# تحديث التنفيذ اليومي — Daily Execution Update

مواصفة مبنية على فحص النظام الفعلي (قاعدة البيانات المحلية + 216 نقطة نهاية + كود الواجهة)
بتاريخ 19 سبتمبر 2026.

---

## 1. الخلاصة قبل أي شيء

المطلوب في الطلب **ليس نظاماً جديداً** — النظام ينفّذ نحو **60٪ منه بالفعل**.
والمتبقي ينقسم قسمين:

| القسم | الحالة |
|-------|--------|
| شاشة موحّدة + حسابات + تحقق + سجل + ربط بالصلاحيات | ✅ قابل للتنفيذ الآن على نقاط النهاية القائمة |
| دورة اعتماد + حالة معلّقة + نماذج إشراف + تقرير مخصص | ⏸️ يحتاج كود الواجهة الخلفية (مع المطور) |

---

## 2. واقع النظام — ثلاث حقائق تغيّر التصميم

### 2.1 لا يوجد جدول `WorkOrders`
الطلب يفترض `WorkOrderId` و `WorkOrderItemId` كمفتاحين موحّدين. الواقع **خمسة أنواع متوازية**،
لكل نوع جدوله وجدول بنوده وسجل تحديثاته:

| النوع | جدول أمر العمل | جدول البنود | سجل التحديثات |
|-------|----------------|-------------|----------------|
| إنشاءات | `Constructions` | `ConstructionPricingItems` | `ConstructionPricingItemUpdateLogs` |
| طوارئ | `Emergencys` | `EmergencyPricingItems` | `EmergencyPricingItemUpdateLogs` |
| صيانة | `Maintenances` | `MaintenancePricingItems` | `MaintenancePricingItemUpdateLogs` |
| مشاريع جديدة | `NewProjects` | `NewProjectPricingItems` | `NewProjectPricingItemUpdateLogs` |
| مشاريع خاصة | `PrivateProjects` | `ProjectPricingItems` | — |

**الأثر:** أي جدول جديد يجب أن يحمل مفتاحاً مركّباً `(WorkOrderType, WorkOrderId, PricingItemId)`
بدل `WorkOrderId` وحده. وإلا استحال ربطه بالأنواع الخمسة.

### 2.2 حقول التنفيذ موجودة بالفعل
`ConstructionPricingItems` (ومثيلاتها) تحتوي:

```
ConstructionId | PricingItemId | TotalPrice | EstimatedQuantity
ExecutedQuantity | ExecutedWorksValue | ExecutionPercentage
```

أي أن الكمية المنفذة والقيمة المنفذة ونسبة الإنجاز **محسوبة ومخزّنة أصلاً على البند**.
شرط الطلب "ممنوع إنشاء نسخة مستقلة من بنود أمر العمل" مُحقَّق تلقائياً بالبناء على هذه الحقول.

### 2.3 نقاط النهاية للتحديث اليومي موجودة
أربعة من الأنواع الخمسة لديها:

```
PUT  /api/Construction/{id}/pricing-items/executed-quantity      (بند واحد)
PUT  /api/Construction/{id}/pricing-items/executed-quantities    (عدة بنود)
GET  /api/Construction/{id}/pricing-items/executed-quantity-logs
PUT  /api/Maintenance/{id}/update-executed-quantity(-ies)
PUT  /api/Emergency/{id}/update-executed-quantity(-ies)
PUT  /api/RehabilitationWorks/{id}/update-executed-quantity(-ies)
```

**والأهم:** فحص `services/ExecutedQuantityApi.js` و `ExecutedQuantityCell.jsx` أثبت أن الحقل
`executedQuantity` في الطلب هو **كمية اليوم (زيادة)** لا الإجمالي، والخادم يجمعها ويعيد
`data.totalExecutedQuantity`، ويكتب سطراً في سجل التحديثات بالقيمة قبل وبعد والمستخدم والوقت والملاحظة.

هذا **بالضبط** منطق البنود 4 و5 و11 و12 في الطلب.

عقد الطلب الجماعي:
```jsonc
PUT /api/{Type}/{id}/pricing-items/executed-quantities
{ "note": "ملاحظة عامة", "items": [ { "pricingItemId": 12, "executedQuantity": 15, "note": "" } ] }
```

### 2.4 نظام الصلاحيات قائم ومنظّم
`GET /api/Permissions/available` يعيد صلاحيات مجزّأة بالوحدة:

```
Construction.View | Construction.Create | Construction.Update | Construction.Delete
Construction.Approve | Construction.Archive
... ونفس النمط لـ Emergency / Maintenance / NewProject / PrivateProject
```

`GET /api/Permissions/my` يعيد صلاحيات المستخدم الحالي.

**الأثر:** الصلاحيات الثماني المطلوبة في البند 2 تُبنى على نفس النمط، ولا حاجة لنظام موازٍ.

---

## 3. فجوة التنفيذ — ما الذي ينقص فعلاً

| # | مطلوب في الطلب | الحالة | يحتاج خلفية؟ |
|---|----------------|--------|---------------|
| 3 | البحث برقم أمر العمل | `GET /api/Search/search-by-orderidWithType` موجود | لا |
| 4 | عرض بنود الأعمال | موجود عبر `get-{type}/{id}` | لا |
| 5 | الحسابات التلقائية | تُحسب في الواجهة وتُعتمد من الخادم | لا |
| 6 | التحقق ومنع التكرار | جزئي — يحتاج قفل تفاؤلي | **جزئياً** |
| 7 | صور التنفيذ إلزامية | الصور تُرفع عبر `update/{id}` متعدد الأجزاء | **نعم** للإلزام |
| 8 | نماذج الإشراف | **غير موجود إطلاقاً** | **نعم** |
| 9 | كيان التحديث اليومي | لا يوجد رأس تحديث — السجل على مستوى البند | **نعم** |
| 10 | دورة الاعتماد | **غير موجودة** — التحديث يُطبَّق فوراً | **نعم** |
| 11 | أثر الاعتماد | يحدث فوراً اليوم | لا (بعد 10) |
| 12 | سجل التحديث اليومي | موجود على مستوى البند | لا |
| 13 | سجل الأحداث | موجود `{id}/changes` | لا |
| 14 | تصنيف المرفقات | جزئي | **نعم** |
| 15 | تقرير التنفيذ اليومي | **غير موجود** | **نعم** |

**الفجوة الجوهرية:** النظام اليوم يطبّق التحديث **فوراً** على أمر العمل. الطلب يريده **معلّقاً**
حتى اعتماد المشرف. هذا تغيير في سلوك الخلفية لا يمكن عمله من الواجهة.

---

## 4. المرحلة الأولى — ما يُنفَّذ الآن محلياً

صفحة **تحديث التنفيذ اليومي** كاملة على نقاط النهاية القائمة:

- البحث برقم أمر العمل / الطلب / البلاغ، مع احترام صلاحيات المستخدم
- بطاقة أمر العمل: النوع، المكتب، الموقع، الحالة، نسبة الإنجاز، القيمة الإجمالية والمنفذة
- جدول البنود بالأعمدة الثلاثة عشر المطلوبة في البند 4
- إدخال "كمية تنفيذ اليوم" فقط، والباقي محسوب لحظياً
- تحقق كامل قبل الإرسال: لا سالب، لا تجاوز الكمية المعتمدة بلا صلاحية، لا إرسال مزدوج
- رفع صور التنفيذ مع معاينة وتصنيف ووصف
- الملاحظات
- إرسال جماعي واحد عبر `executed-quantities` داخل طلب واحد
- سجل التحديث اليومي من `executed-quantity-logs`
- إخفاء/تعطيل الأزرار حسب صلاحيات `{Type}.Update` و `{Type}.Approve`

**حدّ هذه المرحلة بوضوح:** الإلزام (صور/نماذج) و منع التجاوز مطبَّقان في الواجهة فقط.
مستخدم يستدعي الـ API مباشرة يتجاوزهما. البند 2 يشترط التطبيق في الخلفية — وهذا في المرحلة الثانية.

---

## 5. المرحلة الثانية — تصميم الخلفية للمطور

### 5.1 الجداول

```sql
DailyExecutionUpdates
  Id                    int identity PK
  WorkOrderType         nvarchar(32)  NOT NULL  -- Construction|Emergency|Maintenance|NewProject|PrivateProject
  WorkOrderId           int           NOT NULL
  ExecutionDate         date          NOT NULL
  CreatedByUserId       nvarchar(450) NOT NULL
  CreatedAt             datetime2     NOT NULL
  SubmittedAt           datetime2     NULL
  Status                nvarchar(24)  NOT NULL  -- Draft|Submitted|Approved|Returned
  ProgressBefore        float         NULL
  ProgressAfter         float         NULL
  TotalDailyValue       decimal(18,2) NULL
  Notes                 nvarchar(max) NULL
  RowVersion            rowversion              -- للقفل التفاؤلي
  UNIQUE (WorkOrderType, WorkOrderId, ExecutionDate, CreatedByUserId)

DailyExecutionUpdateItems
  Id                    int identity PK
  DailyExecutionUpdateId int FK -> DailyExecutionUpdates
  PricingItemId         int NOT NULL
  DailyQuantity         float NOT NULL
  UnitPriceSnapshot     decimal(18,2) NOT NULL   -- السعر وقت التسجيل
  DailyValue            decimal(18,2) NOT NULL
  ExecutedBefore        float NULL
  ExecutedAfter         float NULL
  UNIQUE (DailyExecutionUpdateId, PricingItemId)

DailyExecutionAttachments
  Id, DailyExecutionUpdateId FK, PricingItemId NULL,
  Category nvarchar(24),   -- Before|During|After|Other
  FileUrl, FileName, ContentType, SizeBytes,
  Description, UploadedByUserId, UploadedAt

DailyExecutionSupervisionForms
  Id, DailyExecutionUpdateId FK,
  FormName, FormType, FormDate, FileUrl, FileName,
  UploadedByUserId, UploadedAt, Notes

DailyExecutionApprovals
  Id, DailyExecutionUpdateId FK,
  Action nvarchar(16),     -- Submit|Approve|Return
  ActedByUserId, ActedAt, Reason nvarchar(max)
```

`WorkOrderType + WorkOrderId` بدل `WorkOrderId` وحده — لأن النظام خمسة أنواع (راجع 2.1).
`UnitPriceSnapshot` يحفظ السعر وقت التسجيل حتى لا يغيّر تعديلُ سعرٍ لاحقٌ قيمةَ يوم مضى.

### 5.2 نقاط النهاية

```
GET    /api/DailyExecution/search?orderNumber=&type=
GET    /api/DailyExecution/work-order/{type}/{id}
GET    /api/DailyExecution/work-order/{type}/{id}/items
POST   /api/DailyExecution                      إنشاء مسودة
PUT    /api/DailyExecution/{id}                 تعديل مسودة
POST   /api/DailyExecution/{id}/attachments     رفع صور
DELETE /api/DailyExecution/attachments/{id}
POST   /api/DailyExecution/{id}/supervision-forms
POST   /api/DailyExecution/{id}/submit          إرسال للمراجعة
POST   /api/DailyExecution/{id}/approve         اعتماد
POST   /api/DailyExecution/{id}/return          إعادة (سبب إلزامي)
DELETE /api/DailyExecution/{id}                 حذف مسودة
GET    /api/DailyExecution/work-order/{type}/{id}/history
GET    /api/DailyExecution/report?from=&to=&...
GET    /api/DailyExecution/report/export
```

### 5.3 الصلاحيات الجديدة
على نمط النظام القائم، تُضاف إلى `PermissionsCatalog`:

```
DailyExecution.View        DailyExecution.Create     DailyExecution.Update
DailyExecution.Approve     DailyExecution.Return     DailyExecution.ViewAll
DailyExecution.Delete      DailyExecution.Export     DailyExecution.ExceedPlanned
```

`ExceedPlanned` هي صلاحية تجاوز الكمية المعتمدة المذكورة في البند 6.

### 5.4 الاعتماد — معاملة واحدة

```csharp
using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);

// 1) أعد قراءة الرأس مع RowVersion وتحقق من الحالة = Submitted
// 2) أعد قراءة كل بند من {Type}PricingItems (لا تثق بقيم الواجهة)
// 3) تحقق: Executed + Daily <= Estimated إلا بصلاحية ExceedPlanned
// 4) حدّث ExecutedQuantity و ExecutedWorksValue و ExecutionPercentage
// 5) أعد حساب نسبة أمر العمل = Σ ExecutedWorksValue ÷ Σ TotalPrice × 100
// 6) اكتب سطراً في {Type}PricingItemUpdateLogs لكل بند
// 7) Status = Approved، واكتب DailyExecutionApprovals
// 8) SaveChanges ثم Commit — DbUpdateConcurrencyException ترجع 409
```

نقطة حرجة من البند 6: **إعادة القراءة من قاعدة البيانات عند الاعتماد** لا من الطلب.
و `RowVersion` يمنع الاعتماد المزدوج عند الضغط المتكرر.

### 5.5 نسبة إنجاز أمر العمل
الطلب يفضّل نسبة مالية موزونة:

```
نسبة أمر العمل = Σ(ExecutedWorksValue) ÷ Σ(TotalPrice) × 100
```

وهذا متاح مباشرة لأن الحقلين مخزّنان على البند أصلاً.
**يجب على المطور التحقق** من منهجية الحساب القائمة في `RASM.Service` قبل تغييرها — البند 5
يشترط الالتزام بالمنهجية المعتمدة إن وُجدت.

---

## 6. افتراضات صرّحت بها

1. **النوع جزء من المفتاح.** لا يمكن `WorkOrderId` وحده مع خمسة أنواع.
2. **`executedQuantity` في الـ API زيادة لا إجمالي** — مستنتج من `ExecutedQuantityCell.jsx`
   الذي يسميه `delta` ويقرأ `totalExecutedQuantity` من الرد. على المطور تأكيدها.
3. **المرحلة الأولى بلا حالة معلّقة:** التحديث يُطبَّق فوراً كما يفعل النظام اليوم.
   تعليق الأثر حتى الاعتماد يأتي في المرحلة الثانية.
4. **`RehabilitationWorks`** لها نقاط نهاية لكن لا جدول بنفس الاسم — على الأرجح تخزَّن في أحد
   الجداول القائمة. يحتاج تأكيداً من المطور.
5. **`NewProjects` و `PrivateProjects`** لا نقاط نهاية لتحديث الكميات لديهما — تُستثنى من
   المرحلة الأولى وتضاف في الثانية.

---

## 7. ما لا يمكنني عمله ولماذا

البند 17 يشترط تنفيذ الصلاحيات والحسابات الحرجة في .NET 8. الواجهة الخلفية لدينا **ملفات DLL
مترجمة** لا كود مصدري (راجع `docs/source-status.md`). لا يمكن إضافة كيان ولا ترحيل ولا نقطة
نهاية ولا قاعدة صلاحية على ملف مترجم.

كل ما في القسم 5 جاهز للمطور لينفّذه فور عودته.
