import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

const formatDate = (dateString) => {
  if (!dateString || dateString === "0001-01-01T00:00:00") return "غير محدد";
  try {
    return new Date(dateString).toLocaleDateString("ar-EG");
  } catch {
    return "غير محدد";
  }
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "null" || value === "") return "غير محدد";
  return value;
};

const buildRow = (request) => ({
  "رقم الطلب": request.id || "غير محدد",
  "نوع المشروع": request.type || "غير محدد",
  "رقم امر العمل": request.faultNumber || "غير محدد",
  "نسبه الكبل المنجز": request.cableCompletion || "غير محدد",
  "نوع امر العمل": request.workOrderType || "غير محدد",
  "وصف العمل": request.workDescription || "غير محدد",
  "مدة التنفيذ": request.durationOfImplementation || "غير محدد",
  "الحالة": request.situation || "غير محدد",
  "تاريخ الاسناد": formatDate(request.orderDate),
  "تاريخ الاستلام": formatDate(request.receiveDateTime),
  "المنطقة": request.district || "غير محدد",
  "المكتب": request.office || "غير محدد",
  "المقاول": request.contractor || "غير محدد",
  "مهندس استشاري": request.consultant || "غير محدد",
  "القيمه التقديريه": formatValue(request.estimatedValue),
  "القيمه الفعليه": formatValue(request.actualValue),
  "رقم المستخلص": formatValue(request.extractNumber),
  "مخالفات السلامة": request.safetyViolationsExist ? "نعم" : "لا",
  "أرشيف": request.isArchived ? "نعم" : "لا",
  "عدد صور الموقع": request.sitePhotos?.length || 0,
  "عدد صور السلامة": request.safetyWastePhotos?.length || 0,
  "عدد صور النماذج": request.modelPhotos?.length || 0,
  "ملاحظات": formatValue(request.note),
});

const writeStyledWorkbook = (data, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: data.length, c: Object.keys(data[0]).length - 1 },
  });

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F81BD" } },
    alignment: { vertical: "center", horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const dataStyle = {
    alignment: { vertical: "center", horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s =
        R === 0
          ? headerStyle
          : { ...dataStyle, fill: { fgColor: { rgb: R % 2 === 0 ? "F2F2F2" : "FFFFFF" } } };
    }
  }

  worksheet["!cols"] = Object.keys(data[0]).map(() => ({ wch: 15 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "طلبات");
  XLSX.writeFile(workbook, filename);
};

// الاستخدام الحالي: تصدير العناصر المحددة فقط من الصفحة الحالية
const useExportToExcel = (filteredRequests, selectedRequests) => {
  const exportToExcel = () => {
    try {
      const selectedData = filteredRequests
        .filter((_, index) => selectedRequests.includes(index))
        .map(buildRow);

      if (selectedData.length === 0) {
        throw new Error("لا يوجد بيانات محددة للتصدير");
      }

      writeStyledWorkbook(selectedData, "طلبات_محددة.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw new Error("حدث خطأ أثناء تصدير البيانات");
    }
  };

  return { exportToExcel };
};

// الاستخدام الجديد: تصدير كل البيانات (بعد جلبها بالكامل من useFetchAllForPrint)
export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback(async (allData, filename = "طلبات.xlsx") => {
    setIsExporting(true);
    try {
      if (!allData || allData.length === 0) {
        throw new Error("لا يوجد بيانات للتصدير");
      }
      const rows = allData.map(buildRow);
      writeStyledWorkbook(rows, filename);
    } catch (error) {
      console.error("Error exporting all to Excel:", error);
      throw new Error("حدث خطأ أثناء تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToExcel, isExporting };
};

export default useExportToExcel;