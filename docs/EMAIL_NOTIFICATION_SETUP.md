# تكوين نظام الإشعارات البريدية - نظام عصف
## Email Notification Configuration

**التاريخ**: 2026-09-28  
**الحالة**: ✅ مكتملة  
**البريد المستخدم**: info@asf.consulting.com

---

## 📋 الملخص

تم تطوير نظام متكامل لإرسال إشعارات بريدية عند:
- ✅ الذكرات (@mentions) في التعليقات
- ✅ الردود على التعليقات
- ✅ تغيير حالة أمر العمل
- ✅ ملخصات يومية للأنشطة

---

## 🔧 الخطوات اللازمة للتكوين

### 1. تحضير بريد Gmail (info@asf.consulting.com)

#### أ. تفعيل المصادقة ثنائية العوامل (2FA):
1. انتقل إلى https://myaccount.google.com
2. اختر "الأمان" من القائمة الجانبية
3. فعّل "المصادقة ثنائية الخطوات"

#### ب. إنشاء App Password:
1. بعد تفعيل 2FA، ستظهر خيار "كلمات مرور التطبيق"
2. اختر "Mail" و "Windows Computer"
3. سيعطيك Google كلمة مرور من 16 حرف (مثال: `abcd efgh ijkl mnop`)

### 2. تحديث appsettings.json

حدّث الملف `/ASF.API/appsettings.json`:

```json
{
    "MailSettings": {
        "Port": 587,
        "SmtpServer": "smtp.gmail.com",
        "Email": "info@asf.consulting.com",
        "DisplayedName": "نظام عصف",
        "Password": "xxxx xxxx xxxx xxxx"  // App Password من Gmail
    }
}
```

### 3. تحديث appsettings.Production.json

بنفس الطريقة، حدّث `/ASF.API/appsettings.Production.json`:

```json
{
    "MailSettings": {
        "Port": 587,
        "SmtpServer": "smtp.gmail.com",
        "Email": "info@asf.consulting.com",
        "DisplayedName": "نظام عصف",
        "Password": "xxxx xxxx xxxx xxxx"  // App Password من Gmail
    }
}
```

**⚠️ تحذير أمني:**
- لا تحفظ كلمات المرور في الكود
- استخدم Azure Key Vault أو AWS Secrets Manager في الإنتاج
- يمكن تخزينها في متغيرات البيئة (Environment Variables)

### 4. استخدام متغيرات البيئة (الأفضل)

في الإنتاج، استخدم:

```bash
# Windows
set MailSettings__Password=xxxx xxxx xxxx xxxx

# Linux/Mac
export MailSettings__Password=xxxx xxxx xxxx xxxx
```

---

## 🔌 الخدمات المستحدثة

### 1. NotificationEmailService
**الملف**: `ASF.Service/NotificationEmailService.cs`

**الدوال الرئيسية**:

```csharp
// إرسال إشعار الذكرات
await emailService.SendMentionNotificationAsync(
    mentionedUserEmail,
    mentionedUserName,
    mentioningUserName,
    commentContent,
    workOrderId,
    workOrderTitle
);

// إرسال إشعار الردود
await emailService.SendCommentReplyNotificationAsync(
    recipientEmail,
    recipientName,
    replyAuthorName,
    replyContent,
    workOrderId,
    workOrderTitle
);

// إرسال إشعار تغيير الحالة
await emailService.SendStatusChangeNotificationAsync(
    recipientEmails,
    workOrderTitle,
    oldStatus,
    newStatus,
    workOrderId,
    changedByUserName
);

// إرسال ملخص يومي
await emailService.SendDailySummaryNotificationAsync(
    recipientEmail,
    recipientName,
    activitiesData
);
```

### 2. WorkOrderActivityService (محدثة)
**الملف**: `ASF.Service/WorkOrderActivityService.cs`

تم تحديث الدالة `AddMentionAsync` لإرسال بريد تلقائي:

```csharp
await _activityService.AddMentionAsync(
    commentId,
    workOrderId,
    mentionedUserId,
    createdByUserId,
    notificationId,
    mentionedUserEmail,      // جديد
    mentionedUserName,       // جديد
    createdByUserName,       // جديد
    workOrderTitle           // جديد
);
```

---

## 📧 Template البريد الإلكتروني

### 1. template الذكرات (@Mentions)

```html
تم ذكرك في أمر عمل
━━━━━━━━━━━━━━━━━━━━
المستخدم: [اسم المستخدم]
أمر العمل: [عنوان أمر العمل]
التعليق: [محتوى التعليق]

[زر: عرض أمر العمل]
```

### 2. Template الردود على التعليقات

```html
رد جديد على تعليقك
━━━━━━━━━━━━━━━━━━━
المستخدم: [اسم المستخدم]
أمر العمل: [عنوان أمر العمل]
الرد: [محتوى الرد]

[زر: عرض التعليقات]
```

### 3. Template تغيير الحالة

```html
تم تغيير حالة أمر العمل
━━━━━━━━━━━━━━━━━━━━━━
أمر العمل: [عنوان]
الحالة السابقة: [حالة قديمة]
الحالة الجديدة: [حالة جديدة]
تم بواسطة: [اسم المستخدم]

[زر: عرض أمر العمل]
```

---

## 🔗 API Endpoints

### إضافة ذكر مع إرسال بريد

**الطلب:**
```http
POST /api/workorderactivity/add-mention
Content-Type: application/json

{
  "commentId": 1,
  "workOrderId": 123,
  "mentionedUserId": "user-id-123",
  "notificationId": 456,
  "mentionedUserEmail": "user@example.com",
  "mentionedUserName": "أحمد محمد",
  "createdByUserName": "محمد علي",
  "workOrderTitle": "إنشاء موقع جديد"
}
```

**الاستجابة:**
```json
{
  "id": 1,
  "commentId": 1,
  "workOrderId": 123,
  "mentionedUserId": "user-id-123",
  "createdByUserId": "user-id-456",
  "createdAt": "2026-09-28T10:30:00Z",
  "isRead": false
}
```

---

## 🧪 اختبار الإرسال

### اختبار يدوي للبريد

```csharp
// في أي controller
private readonly NotificationEmailService _emailService;

public YourController(NotificationEmailService emailService)
{
    _emailService = emailService;
}

[HttpPost("test-email")]
public async Task<IActionResult> TestEmail()
{
    await _emailService.SendMentionNotificationAsync(
        "recipient@example.com",
        "المستقبل",
        "المُرسل",
        "هذا تعليق اختبار",
        1,
        "أمر عمل اختبار"
    );
    
    return Ok("تم إرسال البريد");
}
```

---

## 📊 Integration مع Work Order Controllers

### مثال في ConstructionController:

```csharp
[HttpPost("{id}/comment")]
public async Task<IActionResult> AddComment(
    int id,
    [FromBody] AddCommentRequest request)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    // إضافة التعليق
    var comment = await _activityService.AddCommentAsync(
        id,
        request.Content,
        userId
    );
    
    // البحث عن الذكرات في المحتوى (@username)
    var mentions = ExtractMentions(request.Content);
    foreach (var mention in mentions)
    {
        var mentionedUser = await _userManager.FindByNameAsync(mention);
        if (mentionedUser != null)
        {
            await _activityService.AddMentionAsync(
                comment.Id,
                id,
                mentionedUser.Id,
                userId,
                null,
                mentionedUser.Email,
                mentionedUser.UserName,
                currentUser.UserName,
                workOrder.Title
            );
        }
    }
    
    return Ok(comment);
}

// دالة مساعدة لاستخراج الذكرات
private List<string> ExtractMentions(string content)
{
    var regex = new Regex(@"@(\w+)");
    return regex.Matches(content)
        .Cast<Match>()
        .Select(m => m.Groups[1].Value)
        .Distinct()
        .ToList();
}
```

---

## ⚠️ معالجة الأخطاء

الخدمة مصممة لعدم إيقاف العملية الأساسية عند فشل البريد:

```csharp
try
{
    await _emailService.SendMentionNotificationAsync(...);
}
catch (Exception ex)
{
    // تسجيل الخطأ فقط
    _logger.LogError($"فشل إرسال البريد: {ex.Message}");
    // لا توقف العملية
}
```

---

## 📝 الملفات المُعدّلة والمُنشأة

**ملفات مُنشأة:**
- ✅ `ASF.Service/NotificationEmailService.cs`

**ملفات معدّلة:**
- ✅ `ASF.Service/WorkOrderActivityService.cs`
- ✅ `ASF.API/Controllers/WorkOrderActivityController.cs`
- ✅ `ASF.API/Extentions/ApplicationServicesExtention.cs`
- ⏳ `ASF.API/appsettings.json` (تحتاج لتحديث من المستخدم)
- ⏳ `ASF.API/appsettings.Production.json` (تحتاج لتحديث من المستخدم)

---

## 🚀 خطوات النشر على الإنتاج

### 1. تحضير البيانات
- [ ] إنشاء App Password من Gmail
- [ ] تحديث appsettings.json (محلي)
- [ ] تحديث appsettings.Production.json (إنتاج)

### 2. نشر الكود
```bash
git add -A
git commit -m "إضافة نظام الإشعارات البريدية"
git push origin claude/new-session-yvbqzq
```

### 3. التحديث على الاستضافة
- رفع الملفات الجديدة والمحدثة
- تحديث `web.config` إن لزم الأمر
- التأكد من بيانات الاتصال البريدي

### 4. الاختبار
- [ ] اختبار إرسال بريد تجريبي
- [ ] اختبار الذكرات والبريد
- [ ] اختبار الردود والبريد
- [ ] فحص السجلات (logs)

---

## 🔍 استكشاف الأخطاء

### البريد لا يُرسل
1. تحقق من بيانات الاتصال في appsettings.json
2. تأكد من تفعيل App Password في Gmail
3. تحقق من firewall/proxy الخادم
4. راجع السجلات للأخطاء التفصيلية

### الدرجات الأمنية من Gmail
إذا واجهت مشكلة في الدخول:
1. انتقل إلى https://accounts.google.com/device-activity
2. اسمح للتطبيق بالدخول من الخادم

### البريد يدخل Spam
- تأكد من إعداد SPF و DKIM للبريد
- جرب إرسال بريد اختبار من نفس الحساب
- راجع سياسات البريد لديك

---

## 📞 الدعم

للمساعدة:
1. راجع السجلات (Logs)
2. تحقق من إعدادات Gmail
3. تأكد من الاتصال بالإنترنت
4. اختبر SMTP بأداة خارجية

---

**الحالة**: ✅ جاهز للاستخدام  
**التاريخ**: 2026-09-28  
**النسخة**: v1.0
