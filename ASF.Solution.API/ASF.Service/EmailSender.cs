using Microsoft.Extensions.Configuration;
using ASF.Core.Services;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

public class EmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public EmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        var smtpSettings = _configuration.GetSection("MailSettings");

        var fromEmail = smtpSettings["Email"];
        var password = smtpSettings["Password"];
        var displayedName = smtpSettings["DisplayedName"];
        var smtpServer = smtpSettings["SmtpServer"];
        var port = int.Parse(smtpSettings["Port"]);

        var client = new SmtpClient(smtpServer, port)
        {
            Credentials = new NetworkCredential(fromEmail, password),
            EnableSsl = true
        };

        var mailMessage = new MailMessage()
        {
            From = new MailAddress(fromEmail, displayedName),
            Subject = subject,
            Body = htmlMessage,
            IsBodyHtml = true
        };

        mailMessage.To.Add(email);

        return client.SendMailAsync(mailMessage);
    }
}
