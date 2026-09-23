import { useCallback } from "react"; 
import logo from '../Image/logoo.png'
const usePrintHandler = (data) => {
  const {  modelPhotos = [], sitePhotos = [], safetyWastePhotos = [], note = "" } = data;

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${data.type}</title>
          <style>
            body { font-family: 'Amiri', sans-serif; direction: rtl; text-align: right; }
            .container { margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: right; }
            th { background-color: #f2f2f2; }
            .image-container { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .file-item { margin: 5px; }
            .logo { text-align: center; margin-bottom: 20px; }
            .logo img { width: 150px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logo}" alt="Company Logo" />
            </div>
            <h2>
              ${
                data.type === "المشاريع الخاصة"
                  ? `اسم المشروع: ${data.projectName}`
                  : data.type === "الصيانة"
                  ? `رقم المشروع: ${data.faultNumber}`
                  : `رقم المشروع: ${data.orderNumber}`
              }
            </h2>
            <table>
              <tr>
                <th>${
                  data.type === "المشاريع الخاصة"
                    ? "مكان المشروع"
                    : "المقاول"
                }</th>
                <td>${
                  data.type === "المشاريع الخاصة"
                    ? data.projectName
                    : data.contractor
                }</td>
              </tr>
              <tr><th>الحي</th><td>${data.district}</td></tr>
              <tr><th>رقم المحطه</th><td>${
                data.stationNumber || "غير متوفر"
              }</td></tr>
              <tr><th>تاريخ الطلب</th><td>${
                data.orderDate.split("T")[0]
              }</td></tr>
              <tr><th>ملاحظات</th><td>${
                data.note || "لا يوجد ملاحظات"
              }</td></tr>
            </table>
            <h4>النموزج و صور الموقع:</h4>
            <div class="image-container">
              <div class="file-list">
                <h5>النموزج:</h5>
                ${modelPhotos
                  .map((photo) => {
                    const isPdf = photo.url.endsWith(".pdf");
                    return isPdf
                      ? `<a href="https://www.rasmconsult.com${photo.url}" target="_blank" style="display: block; margin: 5px;">اضغط لرؤية الملف</a>`
                      : `<img src="https://www.rasmconsult.com${photo.url}" alt="Model Image" style="width: 250px; margin: 5px;" />`;
                  })
                  .join("")}
              </div>
              <div class="file-list">
                <h5>صور الموقع:</h5>
                ${sitePhotos
                  .map((photo) => {
                    const isPdf = photo.url.endsWith(".pdf");
                    return isPdf
                      ? `<a href="https://www.rasmconsult.com${photo.url}" target="_blank" style="display: block; margin: 5px;">اضغط لرؤية الملف</a>`
                      : `<img src="https://www.rasmconsult.com${photo.url}" alt="Site Image" style="width: 250px; margin: 5px;" />`;
                  })
                  .join("")}
              </div>
            </div>
            <h4>مخالفات السلامة:</h4>
            ${
              safetyWastePhotos.length > 0
                ? `<div class="file-list">
                    ${safetyWastePhotos
                      .map((photo) => {
                        const isPdf = photo.url.endsWith(".pdf");
                        return isPdf
                          ? `<a href="https://www.rasmconsult.com${photo.url}" target="_blank" style="display: block; margin: 5px;">اضغط لرؤية الملف</a>`
                          : `<img src="https://www.rasmconsult.com${photo.url}" alt="Safety Image" style="width: 250px; margin: 5px;" />`;
                      })
                      .join("")}
                  </div>`
                : `<p>لا توجد مخالفات سلامة.</p>`
            }
            <h4>ملاحظات إضافية:</h4>
            <p>${note || "لا توجد ملاحظات إضافية"}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [data, modelPhotos, sitePhotos, safetyWastePhotos, note]);
  

  return { handlePrint };
};

export default usePrintHandler;
