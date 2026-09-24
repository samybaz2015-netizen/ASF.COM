import { useCallback, useRef, useState } from "react";
import axios from "axios";
import axiosInstance from "../api/apiClient";

export const useFetchAllForPrint = (buildParams) => {
  const [isFetching, setIsFetching] = useState(false);
  const abortRef = useRef(null);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "غير محدد";
    try {
      return new Date(dateString).toLocaleDateString("ar-EG");
    } catch {
      return "غير محدد";
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "null") return "غير محدد";
    return value;
  };

  const fetchAll = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsFetching(true);
    try {
      const params = { ...buildParams(1), PageSize: 100000, PageIndex: 1 };

      const response = await axiosInstance.get("Admin/AllOrders", {
        params,
        signal: abortRef.current.signal,
      });

      const d = response.data;
      return [
        ...(d.emergencies?.data || []),
        ...(d.rehabilitationWorks?.data || []),
        ...(d.maintenances?.data || []),
        ...(d.constructions?.data || []),
        ...(d.privateProjects?.data || []),
      ];
    } catch (err) {
      if (axios.isCancel(err)) return null;
      console.error("فشل جلب كل البيانات:", err);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [buildParams]);

  const buildPrintHTML = useCallback((data) => {
    const columns = [
      { label: "رقم الطلب",             get: (r) => r.id || "غير محدد" },
      { label: "نوع المشروع",            get: (r) => r.type || "غير محدد" },
      { label: "رقم امر العمل",          get: (r) => r.faultNumber || "غير محدد" },
      { label: "نوع امر العمل",          get: (r) => r.workOrderType || "غير محدد" },
      { label: "وصف العمل",              get: (r) => r.workDescription || "غير محدد" },
      { label: "نسبه الحفريه المنجزه",   get: (r) => r.completionStatusReport || "غير محدد" },
      { label: "نسبه الكبل المنجز",      get: (r) => r.cableCompletion || "غير محدد" },
      { label: "مدة التنفيذ",            get: (r) => r.durationOfImplementation || "غير محدد" },
      { label: "مرحلة التنفيذ",          get: (r) => r.implementationPhase || "غير محدد" },
      { label: "الحالة",                 get: (r) => r.situation || "غير محدد" },
      { label: "تاريخ الاسناد",            get: (r) => formatDate(r.orderDate) },
      { label: "تاريخ الاستلام",         get: (r) => formatDate(r.receiveDateTime) },
      { label: "المنطقة",                get: (r) => r.district || "غير محدد" },
      { label: "المكتب",                 get: (r) => r.office || "غير محدد" },
      { label: "المقاول",                get: (r) => r.contractor || "غير محدد" },
      { label: "اسم مهندس الاستشاري",    get: (r) => r.consultant || "غير محدد" },
      { label: "القيمه التقديريه",        get: (r) => formatValue(r.estimatedValue) },
      { label: "القيمه الفعليه",          get: (r) => formatValue(r.actualValue) },
      { label: "رقم المستخلص",           get: (r) => formatValue(r.extractNumber) },
      { label: "نوع الاختبار",            get: (r) => r.typeOfStomachTest || "غير محدد" },
      { label: "عدد المعدات",             get: (r) => r.numberOfEquipment || 0 },
      { label: "مخالفات السلامة",         get: (r) => r.safetyViolationsExist ? "نعم" : "لا" },
      { label: "وصف المخالفات",           get: (r) => formatValue(r.descriptionViolation) },
      { label: "أرشيف",                  get: (r) => r.isArchive ? "نعم" : "لا" },
      { label: "عدد صور الموقع",          get: (r) => r.sitePhotos?.length || 0 },
      { label: "عدد صور السلامة",         get: (r) => r.safetyWastePhotos?.length || 0 },
      { label: "عدد صور النماذج",         get: (r) => r.modelPhotos?.length || 0 },
      { label: "عدد النماذج",             get: (r) => r.testModels?.length || 0 },
      { label: "ملاحظات",                get: (r) => formatValue(r.note) },
    ];

    const headerCells = columns.map((c) => `<th>${c.label}</th>`).join("");
    const bodyRows = data
      .map((row, i) => `
        <tr class="${i % 2 === 0 ? "even" : "odd"}">
          <td>${i + 1}</td>
          ${columns.map((c) => `<td>${c.get(row)}</td>`).join("")}
        </tr>`)
      .join("");

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8"/>
        <title>طباعة الطلبات</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 10px; direction: rtl; padding: 12px; color: #222; }
          h2 { text-align: center; font-size: 15px; margin-bottom: 4px; color: #1a3c6e; }
          .meta { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; table-layout: auto; }
          th { background: #4F81BD; color: #fff; font-weight: bold; padding: 5px 6px; border: 1px solid #aaa; text-align: center; white-space: nowrap; }
          td { padding: 4px 6px; border: 1px solid #ddd; text-align: center; word-break: break-word; }
          tr.even td { background: #F2F2F2; }
          tr.odd  td { background: #FFFFFF; }
          @page { size: landscape; margin: 10mm; }
        </style>
      </head>
      <body>
        <h2>قائمة الطلبات</h2>
        <p class="meta">إجمالي الطلبات: <strong>${data.length}</strong> &nbsp;|&nbsp; تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</p>
        <table>
          <thead><tr><th>#</th>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `;
  }, []);

  return { fetchAll, isFetching, buildPrintHTML };
};

export default useFetchAllForPrint;