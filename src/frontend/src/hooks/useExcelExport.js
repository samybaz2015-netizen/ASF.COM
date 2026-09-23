import { useState } from "react";
import * as XLSX from "xlsx";

export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "غير محدد";
    try {
      return new Date(dateString).toLocaleDateString("ar-EG");
    } catch (error) {
      return "غير محدد";
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "null") return "غير محدد";
    return value;
  };

  const exportToExcel = async (data, filename) => {
    try {
      setIsExporting(true);
console.log(data)
      // Transform data to match ExportExcel.js format
      const transformedData = data.map((request) => ({
        "رقم الطلب": request.id || "غير محدد",
        "نوع المشروع": request.type || "غير محدد",
        "رقم امر العمل": request.faultNumber || "غير محدد",
        "نوع امر العمل": request.workOrderType || "غير محدد",
        "وصف العمل": request.workDescription || "غير محدد", 
        "نسبه الحفريه المنجزه": request.completionStatusReport || "غير محدد", 
        "نسبه الكبل المنجز": request.cableCompletion || "غير محدد",
        "مدة التنفيذ": request.durationOfImplementation || "غير محدد",
        "مرحلة التنفيذ": request.implementationPhase || "غير محدد",
        "الحالة": request.situation || "غير محدد",
        "تاريخ الطلب": formatDate(request.orderDate),
        "تاريخ الاستلام": formatDate(request.receiveDateTime),
        "المنطقة": request.district || "غير محدد",
        "المكتب": request.office || "غير محدد",
        "المقاول": request.contractor || "غير محدد",
        " اسم مهندس الاستشاري": request.consultant || "غير محدد",
        "القيمه التقديريه": formatValue(request.estimatedValue),
        "القيمه الفعليه": formatValue(request.actualValue),
        "رقم المستخلص": formatValue(request.extractNumber),
        "نوع الاختبار ": request.typeOfStomachTest || "غير محدد",
        "عدد المعدات": request.numberOfEquipment || 0,
        "مخالفات السلامة": request.safetyViolationsExist ? "نعم" : "لا",
        "وصف المخالفات": formatValue(request.descriptionViolation),
        "أرشيف": request.isArchive ? "نعم" : "لا",
        "عدد صور الموقع": request.sitePhotos?.length || 0,
        "عدد صور السلامة": request.safetyWastePhotos?.length || 0,
        "عدد صور النماذج": request.modelPhotos?.length || 0,
        "عدد النماذج": request.testModels?.length || 0,
        "ملاحظات": formatValue(request.note),
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(transformedData);

      // Define table style
      const tableStyle = {
        theme: "TableStyleMedium2",
        showFirstColumn: true,
        showLastColumn: true,
        showRowStripes: true,
        showColumnStripes: false,
      };

      // Apply table style
      worksheet["!ref"] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: transformedData.length, c: Object.keys(transformedData[0]).length - 1 },
      });

      // Apply header styling
      const headerStyle = {
        font: { bold: true, color: { rgb: "#FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { vertical: "center", horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      // Apply data cell styling
      const dataStyle = {
        alignment: { vertical: "center", horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      // Apply styles to all cells
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;

          // Apply header style to first row
          if (R === 0) {
            worksheet[cellAddress].s = headerStyle;
          } else {
            // Apply alternating row colors
            const rowStyle = {
              ...dataStyle,
              fill: { fgColor: { rgb: R % 2 === 0 ? "F2F2F2" : "FFFFFF" } },
            };
            worksheet[cellAddress].s = rowStyle;
          }
        }
      }

      // Set column widths
      worksheet["!cols"] = [
        { wch: 10 }, // رقم الطلب
        { wch: 15 }, // نوع المشروع
        { wch: 15 }, // رقم امر العمل
        { wch: 15 }, // نوع امر العمل
        { wch: 15 }, // المقاول
        { wch: 15 }, // الحالة
        { wch: 15 }, // مرحلة التنفيذ
        { wch: 20 }, // وصف العمل
        { wch: 30 }, // ملاحظات
        { wch: 15 }, // مدة التنفيذ
        { wch: 15 }, // تاريخ الطلب
        { wch: 15 }, // تاريخ الاستلام
        { wch: 15 }, // المنطقة
        { wch: 20 }, // المكتب
        { wch: 15 }, // المستشار
        { wch: 15 }, // القيمه التقديريه
        { wch: 15 }, // القيمه الفعليه
        { wch: 15 }, // رقم المستخلص
        { wch: 15 }, // نوع اختبار البطن
        { wch: 15 }, // عدد المعدات
        { wch: 15 }, // مخالفات السلامة
        { wch: 20 }, // وصف المخالفات
        // { wch: 10 }, // أرشيف
        { wch: 15 }, // عدد صور الموقع
        // { wch: 15 }, // عدد صور السلامة
        // { wch: 15 }, // عدد صور النماذج
        // { wch: 15 }, // عدد النماذج
      ];

      // Create workbook and save file
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "طلبات");
      XLSX.writeFile(workbook, filename || "طلبات_محددة.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw new Error("حدث خطأ أثناء تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToExcel, isExporting };
};

export default useExcelExport;
