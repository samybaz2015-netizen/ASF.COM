using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;

namespace ASF.Service
{
    /// <summary>
    /// خدمة إرسال الإشعارات البريدية المرتبطة بسجل نشاط أمر العمل
    /// </summary>
    public class NotificationEmailService
    {
        private readonly IEmailSender _emailSender;
        private readonly ApplicationDbContext _context;

        public NotificationEmailService(
            IEmailSender emailSender,
            ApplicationDbContext context)
        {
            _emailSender = emailSender;
            _context = context;
        }

        /// <summary>
        /// إرسال إشعار عند الذكر في تعليق
        /// </summary>
        public async Task SendMentionNotificationAsync(
            string mentionedUserEmail,
            string mentionedUserName,
            string mentioningUserName,
            string commentContent,
            int workOrderId,
            string workOrderTitle)
        {
            if (string.IsNullOrEmpty(mentionedUserEmail))
                return;

            var subject = "تم ذكرك في أمر عمل - عصف";
            var htmlBody = BuildMentionEmailTemplate(
                mentionedUserName,
                mentioningUserName,
                commentContent,
                workOrderId,
                workOrderTitle
            );

            await _emailSender.SendEmailAsync(mentionedUserEmail, subject, htmlBody);
        }

        /// <summary>
        /// إرسال إشعار عند إضافة رد على التعليق
        /// </summary>
        public async Task SendCommentReplyNotificationAsync(
            string recipientEmail,
            string recipientName,
            string replyAuthorName,
            string replyContent,
            int workOrderId,
            string workOrderTitle)
        {
            if (string.IsNullOrEmpty(recipientEmail))
                return;

            var subject = "رد جديد على تعليقك - عصف";
            var htmlBody = BuildCommentReplyEmailTemplate(
                recipientName,
                replyAuthorName,
                replyContent,
                workOrderId,
                workOrderTitle
            );

            await _emailSender.SendEmailAsync(recipientEmail, subject, htmlBody);
        }

        /// <summary>
        /// إرسال إشعار عند تغيير حالة أمر العمل
        /// </summary>
        public async Task SendStatusChangeNotificationAsync(
            List<string> recipientEmails,
            string workOrderTitle,
            string oldStatus,
            string newStatus,
            int workOrderId,
            string changedByUserName)
        {
            if (recipientEmails == null || recipientEmails.Count == 0)
                return;

            var subject = $"تم تغيير حالة أمر العمل: {workOrderTitle}";
            var htmlBody = BuildStatusChangeEmailTemplate(
                workOrderTitle,
                oldStatus,
                newStatus,
                workOrderId,
                changedByUserName
            );

            foreach (var email in recipientEmails)
            {
                if (!string.IsNullOrEmpty(email))
                {
                    await _emailSender.SendEmailAsync(email, subject, htmlBody);
                }
            }
        }

        /// <summary>
        /// إرسال إشعار يومي بملخص الأنشطة
        /// </summary>
        public async Task SendDailySummaryNotificationAsync(
            string recipientEmail,
            string recipientName,
            List<(string WorkOrderTitle, int Count, int WorkOrderId)> activitiesData)
        {
            if (string.IsNullOrEmpty(recipientEmail) || activitiesData.Count == 0)
                return;

            var subject = $"ملخص النشاطات اليومي - {DateTime.Now:yyyy-MM-dd}";
            var htmlBody = BuildDailySummaryEmailTemplate(
                recipientName,
                activitiesData
            );

            await _emailSender.SendEmailAsync(recipientEmail, subject, htmlBody);
        }

        // ─── HTML Templates ────────────────────────────────────────────

        private string BuildMentionEmailTemplate(
            string mentionedUserName,
            string mentioningUserName,
            string commentContent,
            int workOrderId,
            string workOrderTitle)
        {
            return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 20px 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .logo {{ text-align: center; margin-bottom: 30px; font-size: 18px; color: #3385a0; font-weight: bold; }}
        .content {{ color: #333; line-height: 1.8; font-size: 14px; }}
        .content p {{ margin: 10px 0; }}
        .message-box {{ background-color: #f9f9f9; border-right: 4px solid #3385a0; padding: 15px; margin: 20px 0; border-radius: 4px; font-style: italic; }}
        .link-button {{ display: inline-block; background-color: #3385a0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
        .footer {{ color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }}
        .signature {{ margin-top: 30px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'>نظام عصف الاستشاري</div>

        <div class='content'>
            <p><strong>السيد: {mentionedUserName}</strong></p>

            <p>مرحباً</p>

            <p>أشار إليك <strong>السيد: {mentioningUserName}</strong></p>

            <div class='message-box'>
                \"{commentContent}\"
            </div>

            <p>في أمر العمل: <strong>{workOrderTitle}</strong></p>

            <p>نأمل اتخاذ اللازم</p>

            <div class='signature'>
                <p><a href='https://asf-consulting.com/work-order/{workOrderId}' class='link-button'>عرض أمر العمل</a></p>
            </div>

            <p>تحياتي</p>
            <p><strong>نظام عصف الاستشاري</strong></p>
        </div>

        <div class='footer'>
            <p>هذا البريد تم إرساله تلقائياً من نظام عصف الاستشاري.</p>
            <p>© 2026 ASF Consult. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string BuildCommentReplyEmailTemplate(
            string recipientName,
            string replyAuthorName,
            string replyContent,
            int workOrderId,
            string workOrderTitle)
        {
            return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #3385a0 0%, #2a6d8d 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }}
        .content {{ color: #333; line-height: 1.6; }}
        .reply-box {{ background-color: #f0f8ff; border-right: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .work-order-link {{ display: inline-block; background-color: #3385a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; text-align: center; }}
        .footer {{ color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }}
        .user-name {{ color: #3385a0; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>رد جديد على تعليقك</h2>
            <p>نظام عصف الاستشاري</p>
        </div>

        <div class='content'>
            <p><strong>السيد: {recipientName}</strong></p>

            <p>مرحباً</p>

            <p>أشار إليك <strong>السيد: {replyAuthorName}</strong> برد على تعليقك</p>

            <div class='reply-box'>
                \"{replyContent}\"
            </div>

            <p>في أمر العمل: <strong>{workOrderTitle}</strong></p>

            <p>نأمل اتخاذ اللازم</p>

            <center>
                <a href='https://asf-consulting.com/work-order/{workOrderId}' class='work-order-link'>عرض التعليقات</a>
            </center>

            <p>تحياتي</p>
            <p><strong>نظام عصف الاستشاري</strong></p>
        </div>

        <div class='footer'>
            <p>هذا البريد تم إرساله تلقائياً من نظام عصف الاستشاري.</p>
            <p>© 2026 ASF Consult. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string BuildStatusChangeEmailTemplate(
            string workOrderTitle,
            string oldStatus,
            string newStatus,
            int workOrderId,
            string changedByUserName)
        {
            return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #f57c00 0%, #e65100 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }}
        .content {{ color: #333; line-height: 1.6; }}
        .status-box {{ background-color: #fff3e0; border-right: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .status-old {{ color: #d32f2f; text-decoration: line-through; }}
        .status-new {{ color: #388e3c; font-weight: bold; }}
        .work-order-link {{ display: inline-block; background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; text-align: center; }}
        .footer {{ color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }}
        .user-name {{ color: #f57c00; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>تغيير حالة أمر العمل</h2>
            <p>نظام عصف الاستشاري</p>
        </div>

        <div class='content'>
            <p>تم تحديث أمر العمل <strong>{workOrderTitle}</strong>.</p>

            <div class='status-box'>
                <p><strong>التفاصيل:</strong></p>
                <p>الحالة السابقة: <span class='status-old'>{oldStatus}</span></p>
                <p>الحالة الجديدة: <span class='status-new'>{newStatus}</span></p>
                <p>تم التحديث بواسطة: <span class='user-name'>{changedByUserName}</span></p>
            </div>

            <p>يمكنك الاطلاع على التفاصيل الكاملة من خلال الرابط أدناه:</p>

            <center>
                <a href='https://asf-consulting.com/work-order/{workOrderId}' class='work-order-link'>عرض أمر العمل</a>
            </center>
        </div>

        <div class='footer'>
            <p>هذا البريد تم إرساله تلقائياً من نظام عصف الاستشاري.</p>
            <p>© 2026 ASF Consult. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string BuildDailySummaryEmailTemplate(
            string recipientName,
            List<(string WorkOrderTitle, int Count, int WorkOrderId)> activitiesData)
        {
            var activitiesHtml = new StringBuilder();
            foreach (var activity in activitiesData)
            {
                activitiesHtml.AppendLine($@"
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>
                            <a href='https://asf-consulting.com/work-order/{activity.WorkOrderId}' style='color: #3385a0; text-decoration: none;'>
                                {activity.WorkOrderTitle}
                            </a>
                        </td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>
                            <span style='background-color: #e3f2fd; padding: 5px 10px; border-radius: 4px;'>
                                {activity.Count} نشاط
                            </span>
                        </td>
                    </tr>");
            }

            return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #3385a0 0%, #2a6d8d 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }}
        .content {{ color: #333; line-height: 1.6; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th {{ background-color: #3385a0; color: white; padding: 12px; text-align: right; }}
        .footer {{ color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>ملخص النشاطات اليومي</h2>
            <p>{DateTime.Now:yyyy-MM-dd}</p>
        </div>

        <div class='content'>
            <p>السلام عليكم ورحمة الله وبركاته <strong>{recipientName}</strong>,</p>

            <p>إليك ملخص النشاطات على أوامر العمل الخاصة بك اليوم:</p>

            <table>
                <thead>
                    <tr>
                        <th>أمر العمل</th>
                        <th>عدد النشاطات</th>
                    </tr>
                </thead>
                <tbody>
                    {activitiesHtml}
                </tbody>
            </table>

            <p>لمزيد من التفاصيل، يمكنك زيارة النظام مباشرة.</p>
        </div>

        <div class='footer'>
            <p>هذا البريد تم إرساله تلقائياً من نظام عصف الاستشاري.</p>
            <p>© 2026 ASF Consult. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
