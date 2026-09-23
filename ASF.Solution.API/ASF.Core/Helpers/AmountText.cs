namespace ASF.Core.Helpers
{
    /// <summary>
    /// قراءة المبالغ المكتوبة نصّاً.
    ///
    /// مصدر واحد يستعمله الحفظ وإعادة الحساب معاً. لو كُتبت القاعدة مرّتين —
    /// مرّة في الكود ومرّة في SQL — لاختلف ما يُحسب وقت الإدخال عمّا يُحسب في
    /// الترحيل، فتظهر أرقام لا تُفسَّر.
    /// </summary>
    public static class AmountText
    {
        /// <summary>
        /// يقرأ مبلغاً من نصّ كتبه المستخدم.
        ///
        /// الحقل نصّي، فيصله «١٢٬٥٠٠٫٥٠» و«12,500.50 ريال» و«—» و«». تُوحَّد
        /// الأرقام العربية، وتُزال الفواصل والحروف والرموز، ثم يُقرأ ما بقي.
        ///
        /// ما لا يُقرأ يُترك فارغاً لا صفراً: الصفر يعني «قيمة معروفة تساوي
        /// صفراً» ويدخل في المتوسّطات، والفارغ يعني «غير معروفة».
        /// </summary>
        public static decimal? Parse(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;

            var builder = new System.Text.StringBuilder(text.Length);
            var seenSeparator = false;

            foreach (var raw in text)
            {
                // الأرقام العربية-الهندية (٠-٩) والفارسية (۰-۹) تُحوَّل.
                var c = raw;
                if (c >= '٠' && c <= '٩') c = (char)(c - '٠' + '0');
                else if (c >= '۰' && c <= '۹') c = (char)(c - '۰' + '0');

                if (char.IsDigit(c))
                {
                    builder.Append(c);
                    continue;
                }

                // فاصلة عشرية واحدة تُقبل — عربية كانت (٫) أو لاتينية.
                if ((c == '.' || c == '٫') && !seenSeparator)
                {
                    seenSeparator = true;
                    builder.Append('.');
                    continue;
                }

                if (c == '-' && builder.Length == 0)
                {
                    builder.Append('-');
                    continue;
                }

                // ما عداه — فواصل الآلاف، الحروف، أسماء العملات — يُهمل.
            }

            var cleaned = builder.ToString();
            if (cleaned.Length == 0 || cleaned == "-" || cleaned == ".") return null;

            return decimal.TryParse(cleaned,
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture,
                out var value)
                ? value
                : null;
        }
    }
}
