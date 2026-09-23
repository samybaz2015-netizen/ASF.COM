const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * يجعل خادم التطوير رابطاً واحداً للبرنامج كله.
 *
 * كل شيء يُفتح من http://localhost:3000 :
 *   /                  التطبيق — يتحدّث لحظياً عند أي تعديل، بلا بناء ولا سكربتات
 *   /api/...           يُمرَّر إلى الواجهة الخلفية
 *   /swagger           توثيق الخدمات
 *   /Photos, /uploads  ملفات الخادم المرفوعة
 *
 * ولأن النداءات تمرّ من نفس الأصل، لا حاجة لعنوان مطلق في Apiconfig ولا
 * لإعدادات CORS أثناء التطوير.
 */

const BACKEND = process.env.REACT_APP_BACKEND_ORIGIN || "http://localhost:5080";

module.exports = function (app) {
  app.use(
    ["/api", "/swagger", "/Photos", "/uploads", "/LeaveFiles"],
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      ws: false,
      logLevel: "warn",
      onError(err, req, res) {
        res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            message:
              "تعذّر الوصول إلى الواجهة الخلفية. تأكد أنها تعمل على " + BACKEND,
            detail: err.message,
          })
        );
      },
    })
  );
};
