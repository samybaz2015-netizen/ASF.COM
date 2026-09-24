import { useCallback } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const usePrintProjectsHandler = (projectsIds, data) => {
  const projects = data?.filter((_, index) => projectsIds.includes(index)) || []; 


  
  const handlePrint = useCallback(() => {
    if (!projects || projects.length === 0) {
      alert("لا يوجد مشاريع للطباعة");
      return;
    }

    console.log(projectsIds, projects);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>قائمة المشاريع</title>
          <style>
            @media print {
              body {
                font-family: 'Amiri', sans-serif;
                direction: rtl;
                text-align: right;
                margin: 0;
                padding: 20px;
                font-size: 16px;
              }

              .container {
                width: 100%;
                max-width: 100%;
              }

              h2 {
                text-align: center;
                font-size: 22px;
                margin-bottom: 20px;
                font-weight: bold;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                page-break-inside: auto;
              }

              th, td {
                border: 1px solid #000;
                padding: 10px;
                text-align: right;
                font-size: 12px;
                word-wrap: break-word;
                white-space: pre-wrap;
                overflow: hidden;
              }

              th {
                background-color: #f2f2f2;
                font-size: 11px;
                font-weight: bold;
              }

              // @page {
              //   size: A4 portrait;
              //   margin: 20mm;
              // }

              // tr {
              //   page-break-inside: avoid;
              // }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>قائمة المشاريع</h2>
            <table>
              <thead>
                <tr>
                  <th>رقم المشروع</th>
                  <th>رقم أمر العمل</th>
                  <th>الفرع</th>
                  <th>الاستشاري</th>
                  <th>المقاول</th>
                  <th>الحي</th>
                  <th>نوع أمر العمل</th>
                  <th>نوع العمل</th>
                  <th>رقم المستخلص</th>
                  <th>رقم المحطة</th>
                  <th>تاريخ الطلب</th>
                  <th>مدة التنفيذ</th>
                  <th>ملاحظات</th>
                  <th>وصف العمل</th>
                  <th>اسم المستخدم</th>
                </tr>
              </thead>
              <tbody>
                ${projects
                  .map(
                    (project) => `
                    <tr>
                      <td>${project.id ?? "لا يوجد"}</td>
                      <td>${project.faultNumber ?? "لا يوجد"}</td>
                      <td>${project.branchName ?? "لا يوجد"}</td>
                      <td>${project.consultant ?? "لا يوجد"}</td>
                      <td>${project.contractor ?? "لا يوجد"}</td>
                      <td>${project.district ?? "لا يوجد"}</td>
                      <td>${project.workOrderType ?? "لا يوجد"}</td>
                      <td>${project.orderType ?? "لا يوجد"}</td>
                      <td>${project.extractNumber ?? "لا يوجد"}</td>
                      <td>${project.stationNumber ?? "لا يوجد"}</td>
                      <td>${
                        project.orderDate
                          ? project.orderDate.split("T")[0]
                          : "لا يوجد"
                      }</td>
                      <td>${project.durationOfImplementation ?? "لا يوجد"}</td>
                      <td>${project.note ?? "لا توجد ملاحظات"}</td>
                      <td>${project.workDescription ?? "لا يوجد"}</td>
                      <td>${project.userName ?? "لا يوجد"}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }, [projectsIds, projects]);

  const handleDownloadPDF = useCallback(() => {
    if (!projects || projects.length === 0) {
      alert("لا يوجد مشاريع للتنزيل");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("Amiri", "normal");

    doc.text("قائمة المشاريع", 140, 15, { align: "center" });

    const tableData = projects.map((project) => [
      project.id ?? "لا يوجد",
      project.faultNumber ?? "لا يوجد",
      project.branchName ?? "لا يوجد",
      project.consultant ?? "لا يوجد",
      project.contractor ?? "لا يوجد",
      project.district ?? "لا يوجد",
      project.workOrderType ?? "لا يوجد",
      project.orderType ?? "لا يوجد",
      project.extractNumber ?? "لا يوجد",
      project.stationNumber ?? "لا يوجد",
      project.orderDate ? project.orderDate.split("T")[0] : "لا يوجد",
      project.durationOfImplementation ?? "لا يوجد",
      project.note ?? "لا توجد ملاحظات",
      project.workDescription ?? "لا يوجد",
      project.userName ?? "لا يوجد",
    ]);

    doc.autoTable({
      head: [
        [
          "رقم المشروع",
          "رقم أمر العمل",
          "الفرع",
          "الاستشاري",
          "المقاول",
          "الحي",
          "نوع أمر العمل",
          "نوع العمل",
          "رقم المستخلص",
          "رقم المحطة",
          "تاريخ الطلب",
          "مدة التنفيذ",
          "ملاحظات",
          "وصف العمل",
          "اسم المستخدم",
        ],
      ],
      body: tableData,
      startY: 25,
      styles: { font: "Amiri", fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [242, 242, 242], textColor: 0 },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } },
    });

    doc.save("قائمة_المشاريع.pdf");
  }, [projects]);

  return { handlePrint, handleDownloadPDF };
};

export default usePrintProjectsHandler;
