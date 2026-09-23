import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UploadIcon from "../../Image/iconupload.jpeg";
import { faTrashCan, faCheckSquare, faSquare, faDownload, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { domain } from "../../function/FunctionApi";
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
// ✅ يحوّل لينك Google Drive العادي (/view) إلى لينك عرض مباشر
function toDriveDirectUrl(url, { isPdf = false } = {}) {
  if (!url) return url;

  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = match?.[1];
  if (!fileId) return url; // مش لينك Drive بالصيغة دي، رجّعه زي ما هو

  if (isPdf) {
    // ✅ لينك preview بيشتغل جوه iframe/embed للـ PDF
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  // ✅ لينك thumbnail بيرجع بايتات الصورة مباشرة، بيشتغل جوه <img>
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}
const UploadSection = ({
  label,
  fileType,
  buttonLabel,
  handleFileChange,
  fileInputRefs,
  openFileSelector,
  fileData,
  handleApiFileDelete,
  handleFileDelete,
  multiple = true,
  isContractor = false, 
  projectType = "",
}) => {
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const files = fileData[fileType] || [];

  const toggleSelect = (index) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map((_, i) => i)));
  };

  const clearAll = () => {
    setSelectedFiles(new Set());
  };

  const deleteSelected = () => {
    const indices = [...selectedFiles].sort((a, b) => b - a);
    indices.forEach((index) => {
      const file = files[index];
      if (file instanceof File) {
        handleFileDelete(fileType, file);
      } else {
        handleApiFileDelete(fileType, file.id);
      }
    });
    setSelectedFiles(new Set());
  };

  const [downloading, setDownloading] = useState(false);

 const downloadSelected = async () => {
  const indices = [...selectedFiles];
  if (indices.length === 0) return;
    const photoTypeMap = {
      "ModelPhotos": "model",
      "SitePhotos": "site",
      "SafetyWastePhotos": "safety",
      "TestModels": "model",
    };

  setDownloading(true);
  try {
    const localFiles = [];
    const serverFiles = [];

    indices.forEach((index) => {
      const file = files[index];
      if (file instanceof File) {
        localFiles.push(file);
      } else {
        serverFiles.push({
          id: file.id,        
          photoType: photoTypeMap[fileType] || fileType,   
        });
      }
    });

    // ملفات محلية
    localFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
      setSelectedFiles(new Set());
      Swal.fire({
        icon: "success",
        title: "تم التنزيل",
        text: "تم تنزيل الملفات بنجاح",
        timer: 1500,
        showConfirmButton: false,
        position: "center",
      });
    const projectTypeMap = {
      "الإنشاءات":         "construction",
      "الصيانة":          "maintenance",
      "الطوارئ":          "emergency",
      "مشروع جديد":       "newproject",
      "أعمال التأهيل":    "newproject",
      "مشروع خاص":        "privateproject",
      "أعمال التاهيل" :   "rehabilitation",
    };

const mappedProjectType = projectTypeMap[projectType] || projectType;
    // ملفات السيرفر
    if (serverFiles.length > 0) {
      const response = await fetch(`${domain}/api/Download/download-selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  projectType: mappedProjectType,
  selectedFiles: serverFiles,
}),
      });

      if (!response.ok) throw new Error("فشل التنزيل");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `files_${fileType}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("خطأ في التنزيل:", error);
  } finally {
    setDownloading(false);
  }
  };

  return (
    <div className="upload-section">
      <h4>{label}</h4>
      <div className="upload-box">
        <span className="upload-icon">
          <img className="w-8 cursor-pointer h-8" src={UploadIcon} alt="Upload" />
        </span>
        <p>{buttonLabel}</p>
        <input
          type="file"
          onChange={(e) => handleFileChange(e, fileType)}
          multiple={multiple}
          ref={fileInputRefs[fileType]}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.pdf"
        />
        <div>
          <button
            type="button"
            className="bg-mainColor px-4 py-2 text-white rounded-md hover:bg-mainColor/90"
            onClick={() => openFileSelector(fileType)}
          >
            رفع ملف
          </button>
        </div>
      </div>

      {/* Selection controls — تظهر بس لو في ملفات */}
      {files.length > 0 && (
        <div className="flex items-center gap-3 my-2 flex-wrap">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm px-3 py-1 rounded-md border border-mainColor text-mainColor hover:bg-mainColor hover:text-white transition-colors"
          >
            تحديد الكل ({files.length})
          </button>

          {selectedFiles.size > 0 && (
            <>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm px-3 py-1 rounded-md border border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                إلغاء التحديد
              </button>
               {!isContractor && (
              <button
                type="button"
                onClick={deleteSelected}
                className="text-sm px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faTrashCan} />
                حذف المحدد ({selectedFiles.size})
              </button>
               )}
              <button
                type="button"
                onClick={downloadSelected}
                disabled={downloading}
                className="text-sm px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1 disabled:opacity-60"
              >
                <FontAwesomeIcon icon={downloading ? faSpinner : faDownload} spin={downloading} />
                {downloading ? "جاري التنزيل..." : `تنزيل المحدد (${selectedFiles.size})`}
              </button>
            </>
          )}
        </div>
      )}

      {/* File list */}
      <div className="flex items-center gap-12 flex-wrap justify-center">
        {files.map((file, index) => (
          <div
            key={index}
            className={`bg-gray-200 rounded-lg p-2 relative cursor-pointer transition-all ${
              selectedFiles.has(index) ? "ring-2 ring-mainColor ring-offset-1" : ""
            }`}
            onClick={() => toggleSelect(index)}
          >
            {/* Checkbox indicator */}
            <div className="absolute top-1 right-1 z-10 text-mainColor bg-white rounded">
              <FontAwesomeIcon
                icon={selectedFiles.has(index) ? faCheckSquare : faSquare}
                className={selectedFiles.has(index) ? "text-mainColor" : "text-gray-400"}
              />
            </div>

            {file instanceof File ? (
              file.type === "application/pdf" ? (
                <embed
                  src={URL.createObjectURL(file)}
                  type="application/pdf"
                  width="400px"
                  className="p-4 border-10 border-purple-400"
                  height="500px"
                />
              ) : (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded file"
                  className="w-32 h-24"
                />
              )
           ) : file.url?.endsWith(".pdf") ? (
                <iframe
                  src={
                    file.url.startsWith("http")
                      ? toDriveDirectUrl(file.url, { isPdf: true })
                      : `${domain}/${file.url}`
                  }
                  title={`file-${index}`}
                  width="100%"
                  height="500px"
                  style={{ border: "none" }}
                />
              ) : (
                <img
                  src={
                    file.url.startsWith("http")
                      ? toDriveDirectUrl(file.url)
                      : `${domain}/${file.url}`
                  }
                  alt="Uploaded file"
                  className="w-32 h-24"
                  loading="lazy"
                />
              )}

            {/* Delete single file button */}

            {!isContractor && (
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation(); 
                  file instanceof File
                    ? handleFileDelete(fileType, file)
                    : handleApiFileDelete(fileType, file.id);
                  setSelectedFiles((prev) => {
                    const next = new Set(prev);
                    next.delete(index);
                    return next;
                  });
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
           )}

          </div>
        ))}
      </div>
    </div>
  );
};

const renderUploadSection = (
  label,
  fileType,
  buttonLabel,
  handleFileChange,
  fileInputRefs,
  openFileSelector,
  fileData,
  handleApiFileDelete,
  handleFileDelete,
  multiple = true,
  isContractor = false ,
  projectType = ""
) => (
  <UploadSection
    label={label}
    fileType={fileType}
    buttonLabel={buttonLabel}
    handleFileChange={handleFileChange}
    fileInputRefs={fileInputRefs}
    openFileSelector={openFileSelector}
    fileData={fileData}
    handleApiFileDelete={handleApiFileDelete}
    handleFileDelete={handleFileDelete}
    multiple={multiple}
    isContractor={isContractor}  
    projectType={projectType}
  />
);

export default renderUploadSection;