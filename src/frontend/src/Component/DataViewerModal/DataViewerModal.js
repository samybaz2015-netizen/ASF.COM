import React, { useState } from "react";
import * as XLSX from "xlsx";
import { domain } from "../../function/FunctionApi";
import { FaTimes, FaFileExcel } from "react-icons/fa";

const DataViewerModal = ({ isOpen, onClose, data }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !data) return null;

  const getArabicName = (field) => {
    const names = {
      id: "رقم الطلب",
      estimatedValue: "القيمة التقديرية",
      actualValue: "القيمة الفعلية",
      extractNumber: "رقم المستخلص",
      type: "النوع",
      faultNumber: "رقم امر العمل",
      stationNumber: "رقم المحطة",
      orderDate: "تاريخ التنفيذ",
      district: "المنطقة",
      contractor: "المقاول",
      consultant: "الاستشاري",
      safetyViolationsExist: "وجود مخالفات السلامة",
      isArchive: "مؤرشف",
      note: "ملاحظات",
      implementationPhase: "مرحلة التنفيذ",
      notificationNumber: "رقم الإشعار",
      taskNumber: "رقم المهمة",
      typeOfStomachTest: "نوع اختبار المعدة",
      descriptionViolation: "وصف المخالفة",
      numberOfEquipment: "عدد المعدات",
      modelPhotos: "صور النموذج",
      testModels: "نماذج الاختبار",
      sitePhotos: "صور الموقع",
      safetyWastePhotos: "صور مخلفات السلامة",
      projectPlace: "موقع المشروع",
      office: "المكتب",
      projectValue: "قيمة المشروع",
      workOrderType: "نوع امر العمل",
      workDescription: "وصف العمل",
      durationOfImplementation: "مدة التنفيذ",
      situation: "الحالة",
      receiveDateTime: "تاريخ الاستلام",
      coordinates: "الإحداثيات",
    };
    return names[field] || field;
  };

  const formatDate = (date) => {
    if (!date) return "لا يوجد";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "لا يوجد";

      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      let formattedDate = `${day}/${month}/${year}`;

      if (typeof date === "string" && date.includes("T")) {
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        formattedDate += ` ${hours}:${minutes}`;
      }

      return formattedDate;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "لا يوجد";
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "لا يوجد";
    if (typeof value === "boolean") return value ? "نعم" : "لا";
    if (typeof value === "number") {
      return value.toLocaleString("en-US");
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "لا يوجد";
    }
    if (
      typeof value === "string" &&
      (value.includes("T") ||
        /^\d{4}-\d{2}-\d{2}/.test(value) ||
        /^\d{2}\/\d{2}\/\d{4}/.test(value))
    ) {
      return formatDate(value);
    }
    return value;
  };

  // استخراج ID ملف جوجل درايف من أي شكل لينك بيرجعه (file/d/ID أو ?id=ID)
  const getDriveFileId = (url) => {
    if (!url) return null;
    const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // لو اللينك كامل (http/https) استخدمه زي ما هو، غير كده ضيف الدومين
  const formatFileUrl = (url) => {
    if (!url) return null;
    const urlString = String(url);
    if (/^https?:\/\//i.test(urlString)) {
      return urlString;
    }
    return `${domain}${urlString}`;
  };

  // ⚠️ السبب الحقيقي لعدم ظهور الصور: روابط Google Drive بصيغة
  // /file/d/ID/view هي روابط لصفحة عرض HTML وليست روابط صور مباشرة،
  // ولا يمكن استخدامها كما هي داخل <img>. أيضًا صيغة
  // "uc?export=view&id=" القديمة توقفت Google عن دعمها بشكل موثوق
  // (بترجع 403 أو صفحة تسجيل دخول). البديل الموثوق حاليًا هو
  // مسار lh3.googleusercontent.com المخصص فعليًا لعرض الصور.
  const getDisplayImageUrl = (url) => {
    const driveId = getDriveFileId(url);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}=w1000`;
    }
    // أي رابط صورة عادي (مش من درايف) بيتعرض زي ما هو من غير أي تعديل
    return formatFileUrl(url);
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const urlString = String(url).toLowerCase();
    if (getDriveFileId(urlString)) return true; // لينكات درايف تتعامل كصور
    return !!urlString.match(/\.(jpg|jpeg|png|gif|bmp|webp|jfif)$/);
  };

  const renderFilePreview = (file, title) => {
    if (!file || !file.url) return null;
    const fullUrl = formatFileUrl(file.url);

    if (isImageFile(file.url)) {
      return (
        <button
          type="button"
          className="relative block w-full group"
          onClick={() => {
            setSelectedImage({ url: getDisplayImageUrl(file.url), title });
            setIsFullscreen(true);
          }}
        >
          <img
            src={getDisplayImageUrl(file.url)}
            alt={title}
            loading="lazy"
            className="w-full h-48 print:h-24 object-cover rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-image.png";
            }}
          />
        </button>
      );
    } else {
      const fileName = file.url.split("/").pop();
      return (
        <div className="flex items-center p-2 bg-gray-50 rounded-lg">
          <svg
            className="w-6 h-6 text-gray-500 mr-2 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 truncate"
          >
            {fileName}
          </a>
        </div>
      );
    }
  };

  const FILE_FIELDS = ["modelPhotos", "sitePhotos", "safetyWastePhotos", "testModels"];

  const handleExportExcel = () => {
    // شيت 1: البيانات الأساسية (كل حقل غير الملفات)
    const detailsRows = Object.entries(data)
      .filter(([key]) => !FILE_FIELDS.includes(key) && key !== "userImage")
      .map(([key, value]) => ({
        الحقل: getArabicName(key),
        القيمة: String(formatValue(value)),
      }));

    // شيت 2: روابط الملفات والصور (كل صنف مع الرابط المباشر)
    const filesRows = FILE_FIELDS.flatMap((field) => {
      const list = Array.isArray(data[field]) ? data[field] : [];
      return list.map((file, index) => ({
        النوع: getArabicName(field),
        الترتيب: index + 1,
        الرابط: formatFileUrl(file.url),
      }));
    });

    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };

    const detailsSheet = XLSX.utils.json_to_sheet(detailsRows);
    detailsSheet["!cols"] = [{ wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, detailsSheet, "تفاصيل الطلب");

    if (filesRows.length > 0) {
      const filesSheet = XLSX.utils.json_to_sheet(filesRows);
      filesSheet["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, filesSheet, "الملفات والصور");
    }

    const fileName = `طلب-${data.id ?? "بدون-رقم"}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const renderDataRow = (key, value) => {
    const isFile = key.includes("Photos") || key.includes("Models");
    const hasFiles = Array.isArray(value)
      ? value.length > 0
      : value && typeof value === "object" && value.url;

    return (
      <div key={key} className="mb-4 print:mb-1 print:text-xs">
        <span className="font-semibold text-gray-700">{getArabicName(key)}:</span>
        <span className="ml-2">
          {isFile && hasFiles ? (
            <div className="mt-2">
              {Array.isArray(value) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {value.map((file, index) => (
                    <div key={file.id || index}>
                      {renderFilePreview(file, `${getArabicName(key)} ${index + 1}`)}
                    </div>
                  ))}
                </div>
              ) : (
                renderFilePreview(value, getArabicName(key))
              )}
            </div>
          ) : (
            formatValue(value)
          )}
        </span>
      </div>
    );
  };

  const renderDataSection = (title, fields) => (
    <div className="mb-9 bg-white rounded-lg p-4 sm:p-6 shadow-sm print:shadow-none print:p-2 print:mb-2 print:break-inside-avoid print:border print:border-gray-200 print:rounded-none">
      <div className="mb-5 print:mb-1">
        <h3 className="m-0 text-[#2c3e50] border-b-2 border-gray-200 pb-3 text-lg sm:text-xl print:text-xs print:pb-1 print:border-b print:font-bold">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-5 print:gap-1">
        {Object.entries(data)
          .filter(([key]) => fields.includes(key))
          .map(([key, value]) => renderDataRow(key, value))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9999] p-2 sm:p-4 print:static print:bg-transparent print:backdrop-blur-none print:p-0 print:m-0"
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body * { visibility: hidden; }
          .data-viewer-print-area, .data-viewer-print-area * { visibility: visible; }
          .data-viewer-print-area { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div
        className="data-viewer-print-area bg-white w-[95%] sm:w-[90%] max-w-[1200px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl [direction:rtl] relative print:w-full print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 sticky top-0 z-[2] print:static print:bg-white">
          <div className="flex justify-between items-center gap-3">
            <h2 className="m-0 text-[#2c3e50] text-lg sm:text-2xl">تفاصيل الطلب</h2>
            <div className="flex gap-2 sm:gap-4 print:hidden">
              <button
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 border-none rounded-md cursor-pointer font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-0.5 text-sm sm:text-base"
                onClick={handleExportExcel}
              >
                <FaFileExcel />
                <span className="hidden sm:inline">تصدير Excel</span>
              </button>
              <button
                className="px-3 sm:px-5 py-2 sm:py-2.5 border-none rounded-md cursor-pointer font-bold transition-all bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 text-sm sm:text-base"
                onClick={() => window.print()}
              >
                طباعة
              </button>
              <button
                className="bg-red-500 text-white text-xl sm:text-2xl leading-none w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-md hover:bg-red-600 hover:rotate-90 transition-all"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 print:p-2">
          <div className="mb-6 sm:mb-10 p-4 sm:p-5 bg-gray-50 rounded-lg print:mb-3 print:p-2 print:bg-white print:rounded-none print:border-b print:border-gray-300">
            <div className="flex flex-wrap justify-between items-center gap-4 print:gap-2 print:flex-nowrap">
              <img src="/logoo.png" alt="Company Logo" className="h-12 sm:h-16 print:h-8" />

              <div className="text-center order-3 sm:order-2 w-full sm:w-auto print:order-2 print:w-auto">
                <h1 className="text-xl sm:text-2xl font-bold print:text-sm print:font-bold">نموذج تفاصيل الطلب</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base print:hidden">
                  تاريخ الطباعة: {formatDate(new Date())}
                </p>
              </div>

              <div className="flex flex-col items-center order-2 sm:order-3 print:order-3 print:flex-row print:gap-2">
                <img
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 print:w-8 print:h-8"
                  src={getDisplayImageUrl(data.userImage)}
                  alt="User Profile"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <p className="mt-2 font-semibold text-sm sm:text-base print:mt-0 print:text-xs">{data.userName}</p>
              </div>
            </div>
          </div>

          <div>
            {renderDataSection("المعلومات الأساسية", ["id", "type", "situation", "office", "district"])}
            {renderDataSection("معلومات المقاول والاستشاري", ["contractor", "consultant"])}
            {renderDataSection("معلومات العمل", [
              "workOrderType",
              "faultNumber",
              "workDescription",
              "durationOfImplementation",
            ])}
            {renderDataSection("المعلومات المالية", [
              "actualValue",
              "extractNumber",
              "estimatedValue",
              "projectValue",
            ])}
            {renderDataSection("التواريخ", ["orderDate", "receiveDateTime"])}
            {renderDataSection("معلومات السلامة", [
              "safetyViolationsExist",
              "descriptionViolation",
              "numberOfEquipment",
            ])}
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200 print:p-2 print:border-t-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 print:text-xs print:mb-2 print:break-after-avoid">الملفات والصور</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 print:gap-2">
              <div className="print:break-inside-avoid">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base print:text-[10px] print:mb-1">الصور</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 print:gap-1">
                  {data.modelPhotos?.map((file, index) => (
                    <div key={file.id || index}>{renderFilePreview(file, `صورة ${index + 1}`)}</div>
                  ))}
                  {data.sitePhotos?.map((file, index) => (
                    <div key={file.id || index}>{renderFilePreview(file, `صورة الموقع ${index + 1}`)}</div>
                  ))}
                  {data.safetyWastePhotos?.map((file, index) => (
                    <div key={file.id || index}>{renderFilePreview(file, `صورة السلامة ${index + 1}`)}</div>
                  ))}
                </div>
              </div>

              <div className="print:break-inside-avoid">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base print:text-[10px] print:mb-1">الملفات</h4>
                <div className="space-y-3 print:space-y-1">
                  {data.testModels?.map((file, index) => (
                    <div key={file.id || index}>{renderFilePreview(file, `نموذج ${index + 1}`)}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className={`fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] transition-opacity duration-300 print:hidden ${
            isFullscreen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
          onClick={() => {
            setSelectedImage(null);
            setIsFullscreen(false);
          }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 bg-transparent border-none text-white text-2xl cursor-pointer p-2 transition-transform hover:scale-110"
              onClick={() => {
                setSelectedImage(null);
                setIsFullscreen(false);
              }}
            >
              <FaTimes />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder-image.png";
              }}
            />
            <div className="text-white mt-4 text-base text-center">{selectedImage.title}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataViewerModal;