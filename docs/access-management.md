# إدارة الصلاحيات — Access & Permissions Management

مواصفة مبنية على فحص المنظومة القائمة: 6 نقاط نهاية للصلاحيات، وكتالوج فعلي من
93 صلاحية في 21 قسماً، وواجهة صلاحيات موجودة داخل صفحة الحسابات.

---

## 1. ما هو قائم فعلاً

| المكوّن | الحالة |
|---------|--------|
| صلاحيات على مستوى المستخدم، نصوص `{Module}.{Action}` | ✅ |
| `GET Permissions/available` · `my` · `user/{id}` | ✅ |
| `POST assign` · `PUT replace` · `POST revoke` | ✅ |
| أدوار Identity بالاسم (`Account/create-role` · `roles` · `assign-role`) | ⚠️ أسماء فقط |
| ربط الأدوار بالصلاحيات وتوريثها | ❌ |
| منع صريح للمستخدم (Deny) | ❌ |
| نطاق البيانات | ❌ |
| بيانات وصفية للصلاحية (اسم عربي، أب، ترتيب، وصف) | ❌ |
| سجل تغييرات الصلاحيات | ❌ |
| إبطال الجلسة عند سحب صلاحية | ❌ |

**الكتالوج الفعلي:** 93 صلاحية في 21 قسماً، بـ12 نوع إجراء فقط:
`View · Create · Update · Delete · Approve · Archive · CheckIn · CheckOut ·
AddNote · AddInvoice · Close · ManagePermissions`

**ناقص من أنواع البند 11:** `Export` · `Print` · `Return` · `Reject` · `Upload` ·
`Download` · `Assign` · `Manage`. عملياً: صلاحيات التصدير والطباعة والرفض والإعادة
**غير قابلة للمنح اليوم** لأنها غير معرّفة في الخلفية أصلاً.

---

## 2. ما نُفّذ الآن — صفحة `/access-management`

بُنيت على **نفس** نقاط النهاية القائمة، فلا توجد منظومتان (البند 56).

| البند | العنصر | الحالة |
|-------|--------|--------|
| 7 | شجرة الصلاحيات: قسم ← إجراء | ✅ 21 قسماً / 93 صلاحية |
| 8 | تحديد الكل وإلغاؤه على مستوى القسم والنظام | ✅ |
| 9 | الحالة الجزئية Indeterminate | ✅ مُختبَرة |
| 10 | البحث داخل الصلاحيات بالعربية أو بالكود | ✅ مُختبَر |
| 12 | فصل صلاحية الصفحة عن الإجراء | ✅ كل إجراء مستقل |
| 23 | الرأس والمسار والتبويبات الأربعة | ✅ |
| 24 | تبويب المستخدمين: بحث وفلترة بالدور والإدارة | ✅ |
| 25 | شاشة تعديل صلاحيات المستخدم | ✅ |
| 27 | معاينة الصلاحيات الفعلية | ✅ |
| 32 | ملخّص الفروق قبل الحفظ (إضافة/إزالة) | ✅ |
| 38 | إخفاء عناصر القائمة حسب الصلاحية | ✅ قائم أصلاً |
| 53 | التناسق مع هيدر ومسار وأزرار عصف | ✅ |

الحفظ عبر `PUT Permissions/replace` في نداء واحد — مفضّل على `assign` + `revoke`
لأنه ذرّي ولا يترك حالة وسيطة إن فشل أحد النداءين.

**الصلاحيات الحساسة** (`Delete` · `Approve` · `Archive` · `ManagePermissions` …)
موسومة بصرياً في الشجرة تمهيداً لإلزام «سبب التعديل» في البند 36.

---

## 3. الفجوة — ما يحتاج الخلفية

### 3.1 جداول جديدة

```sql
Permissions                     -- البيانات الوصفية للصلاحية (البند 47)
  Id, Code UNIQUE, NameAr, NameEn, Description,
  Module, Page, Action, ParentPermissionId NULL,
  SortOrder int, IsActive bit, IsSystemPermission bit

RolePermissions                 -- الربط الناقص اليوم (البند 4)
  RoleId FK -> AspNetRoles, PermissionId FK, UNIQUE (RoleId, PermissionId)

UserPermissionOverrides         -- السماح والمنع الصريح (البندان 17 و18)
  UserId FK, PermissionId FK, Effect nvarchar(8),   -- Allow | Deny
  GrantedByUserId, GrantedAt, Reason nvarchar(max),
  UNIQUE (UserId, PermissionId)

DataScopes                      -- نطاق البيانات (البند 13)
  Id, ScopeType nvarchar(32),   -- All|Branch|Office|WorkOrderType|Region|Own|Assigned
  Code, NameAr, NameEn

UserDataScopes                  -- يدعم التعدد: صفّان للرياض والخرج (البند 15)
  Id, UserId FK, ScopeType, ScopeValue nvarchar(64),
  GrantedByUserId, GrantedAt

PermissionAuditLogs             -- البندان 34 و35
  Id, ActorUserId, TargetUserId NULL, TargetRoleId NULL,
  Action nvarchar(32), PermissionCode NULL,
  OldValue nvarchar(max), NewValue nvarchar(max),
  Reason nvarchar(max) NULL, IpAddress NULL, ChangedAt
```

وعلى `AspNetUsers`:

```sql
ALTER TABLE AspNetUsers ADD PermissionVersion int NOT NULL DEFAULT 1;
```

تُزاد عند أي تغيير، ويتحقق منها الخادم في العمليات الحساسة — حل البندين 33 و51
دون انتظار انتهاء صلاحية الـ token.

### 3.2 ترتيب الأولوية عند الحساب (البند 18)

```
User Deny  >  User Allow  >  Role Permission  >  Default Deny
```

```csharp
public async Task<HashSet<string>> GetEffectivePermissionsAsync(string userId)
{
    var roleCodes = await RolePermissionCodes(userId);
    var overrides = await UserOverrides(userId);

    var effective = new HashSet<string>(roleCodes);
    effective.UnionWith(overrides.Where(o => o.Effect == "Allow").Select(o => o.Code));
    effective.ExceptWith(overrides.Where(o => o.Effect == "Deny").Select(o => o.Code));
    return effective;
}
```

### 3.3 نطاق البيانات — التطبيق في الاستعلام لا في الواجهة

البند 43 صريح: لا تُحمَّل بيانات كل الإدارات ثم تُخفى. الفلترة في الخلفية:

```csharp
IQueryable<T> ApplyScope<T>(IQueryable<T> query, UserScope scope) where T : IScoped
    => scope.Type switch
    {
        ScopeType.All      => query,
        ScopeType.Branch   => query.Where(x => scope.BranchIds.Contains(x.BranchId)),
        ScopeType.Office   => query.Where(x => scope.OfficeIds.Contains(x.OfficeId)),
        ScopeType.Own      => query.Where(x => x.CreatedByUserId == scope.UserId),
        ScopeType.Assigned => query.Where(x => x.AssignedToUserId == scope.UserId),
        _                  => query.Where(_ => false)      // Default Deny (البند 45)
    };
```

يُطبَّق على الشاشات والبحث والتقارير والتصدير و Dashboard من **نفس** الدالة، فلا
يمكن أن يُصدِّر المستخدم بيانات لا يراها (البند 42).

### 3.4 منع رفع الصلاحيات (البند 21)

```csharp
// المانح لا يمنح ما لا يملك، ولا نطاقاً أوسع من نطاقه
if (!granter.Effective.IsSupersetOf(requested)) return Forbid();
if (!granter.Scope.Covers(requestedScope))      return Forbid();
if (requested.Contains("Permissions.Manage") && !granter.IsSuperAdmin) return Forbid();
```

### 3.5 حماية آخر مسؤول (البند 37)

قبل أي سحب لصلاحية إدارية أو تعطيل حساب: تحقق من بقاء مسؤول واحد فعّال على الأقل،
وإلا ارفض العملية.

---

## 4. نقاط النهاية المطلوبة

```
GET    /api/Permissions/catalog                 الشجرة ببياناتها الوصفية
GET    /api/Permissions/effective/{userId}      بعد دمج الأدوار والتجاوزات
POST   /api/Permissions/overrides               { userId, code, effect, reason }
DELETE /api/Permissions/overrides/{id}

GET    /api/Roles                               مع صلاحيات كل دور
POST   /api/Roles · PUT /api/Roles/{id} · DELETE /api/Roles/{id}
PUT    /api/Roles/{id}/permissions              { permissions[] }
GET    /api/Roles/{id}/users

GET    /api/DataScopes/user/{userId}
PUT    /api/DataScopes/user/{userId}            { scopes[] }

GET    /api/Permissions/audit?userId=&from=&to=
POST   /api/Permissions/copy                    { fromUserId, toUserId }
POST   /api/Permissions/bulk                    { userIds[], add[], remove[] }
GET    /api/Permissions/preview-access/{userId} البند 28
```

### الصلاحيات الناقصة التي يجب تسجيلها

أنواع الإجراءات الثمانية الناقصة تُضاف إلى Permission Registry مركزي يعمل بـ Seeder
**Idempotent** (البند 48): تشغيله مراراً لا ينشئ تكراراً. وحينها تظهر تلقائياً في
الشجرة بلا تعديل في الواجهة (البند 49).

---

## 5. معايير القبول — الحالة

| # | المعيار | الحالة |
|---|---------|--------|
| 1–3 | إنشاء دور ومنحه صلاحيات وربط مستخدم | ⚠️ إنشاء الدور فقط؛ الربط بالصلاحيات ❌ |
| 4–5 | ظهور القوائم المسموحة ومنع الصفحات | ✅ قائم |
| 6 | منع API غير المسموح | ⚠️ جزئي |
| 7–8 | منح صلاحية إضافية وظهورها | ✅ |
| 9–10 | سحب صلاحية وتوقفها فوراً | ⚠️ تُسحب، والإبطال الفوري ❌ |
| 11 | منع موروث بـ User Deny | ❌ |
| 12–16 | نطاق البيانات في البحث والتقارير والتصدير | ❌ |
| 17 | أكثر من دور | ❌ |
| 18–19 | نسخ الصلاحيات والتحديث الجماعي | ❌ |
| 20–23 | الشجرة وتحديد الكل والحالة الجزئية والبحث | ✅ **مُختبَرة** |
| 24 | صلاحيات الإجراءات داخل الصفحة | ✅ |
| 25–26 | منع رفع الصلاحيات والنطاق | ❌ |
| 27–28 | سجل التغييرات وقبل/بعد | ❌ |
| 29–31 | العربية والإنجليزية و RTL/LTR والأجهزة | ✅ |
| 32 | عدم التأثير على وظائف قائمة | ✅ لا تغيير في سلوك قائم |

**12 محقَّقة · 4 جزئية · 16 تنتظر الخلفية.**

---

## 6. ترتيب التنفيذ المقترح

1. **Permission Registry و Seeder** — وأضف أنواع الإجراءات الثمانية الناقصة.
2. `RolePermissions` والتوريث — أكبر أثر لأقل جهد.
3. `UserPermissionOverrides` بترتيب الأولوية.
4. `PermissionVersion` وإبطال الجلسة.
5. نطاق البيانات مع دالة `ApplyScope` موحّدة.
6. سجل التغييرات ومنع رفع الصلاحيات.
7. النسخ والتحديث الجماعي والقوالب.
