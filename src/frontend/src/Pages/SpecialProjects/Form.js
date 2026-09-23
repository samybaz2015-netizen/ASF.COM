import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import { FaClipboardList, FaHistory, FaMoneyBillWave, FaTools } from "react-icons/fa";
import SelectConsultant from "../../Component/SelectConsultant/SelectConusltant";
import SelectDistrict from "../../Component/SelectDistrict/SelectDistrict";
import renderUploadSection from "../../Component/RenderFile/RenderFile";
import RadioGroup from "../../Component/RadioGroup/RadioGroup";
import {
  ErrorModal,
  LoadingModal,
  SuccessModal,
} from "../../Component/Common/ModelComponents";
import WorkDescriptionInput from "../../Component/WorkDescriptionInput/WorkDescriptionInput";
import PricingItemsSelector from "../Construction/Pricingitemsselector";

import { SectionLabel } from "../../Component/Common/SectionLabel";
const createUrl = `${Url}PrivateProject/CreatePrivateProject`;
const updateUrl = `${Url}PrivateProject/update`;

/* ─── Tab config ─── */
const TABS = [
  { id: 0, label: "بيانات المقايسة",          Icon: FaClipboardList  },
  { id: 1, label: "البيانات المالية للمقايسة", Icon: FaMoneyBillWave  },
  { id: 2, label: "أعمال المقايسة",            Icon: FaTools          },
  { id: 3, label: "سجل التعديلات",              Icon: FaHistory },
];

/* ─── Section label ─── */

const blue   = { bg: "#f0f9ff", border: "#2563eb", text: "#1e40af" };
const yellow = { bg: "#fefce8", border: "#ca8a04", text: "#92400e" };
const green  = { bg: "#f0fdf4", border: "#16a34a", text: "#14532d" };

/* ─── Nav Buttons ─── */
const NavBtns = ({ activeTab, setActiveTab, total }) => (
  <div
    style={{
      display: "flex",
      justifyContent:
        activeTab === 0
          ? "flex-start"
          : activeTab === total - 1
          ? "flex-end"
          : "space-between",
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #e5e7eb",
      gap: "10px",
    }}
  >
    {activeTab > 0 && (
      <button
        type="button"
        onClick={() => setActiveTab((p) => p - 1)}
        style={{
          padding: "10px 24px",
          background: "transparent",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
        }}
      >
        → السابق
      </button>
    )}
    {activeTab < total - 1 && (
      <button
        type="button"
        onClick={() => setActiveTab((p) => p + 1)}
        style={{
          padding: "10px 28px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {React.createElement(TABS[activeTab + 1].Icon, { size: 13 })}
        التالي ←
      </button>
    )}
  </div>
);

/* ════════════════════════════════════════════
   Main Form Component
════════════════════════════════════════════ */
const Form = ({ userData, apiData }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);

  const office = searchParams.get("office");

  const [formData, setFormData] = useState({
    ProjectPlace: "",
    Customer: "",
    ProjectName: "",
    TimeOfProject: "",
    projectValue: "",
    Office: office || "",
    Consultant: "",
    Note: "",
    SafetyViolationsExist: false,
    EstimatedValue: 2345,
    ActualValue: 2345,
    ExtractNumber: "",
    OrderDate: "",
    StationNumber: "",
    District: "",
    Contractor: "",
    WorkDescription: "",
    PricingItemIds: [],
    pricingItemsObjects: [],
  });

  const [fileData, setFileData] = useState({
    ModelPhotos: [],
    SitePhotos: [],
    SafetyWastePhotos: [],
  });

  const fileInputRefs = {
    ModelPhotos: useRef(null),
    SitePhotos: useRef(null),
    SafetyWastePhotos: useRef(null),
  };

  const [errorMessage, setErrorMessage] = useState("");
  const token = userData?.token;
  const [showModal, setShowModal] = useState({ success: false, error: false });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (apiData) {
      setFormData({
        ProjectPlace: apiData.projectPlace || "",
        ProjectName: apiData.projectName || "",
        Customer: apiData.customer || "",
        Office: apiData.office || "",
        TimeOfProject: apiData.timeOfProject || "",
        projectValue: apiData.projectValue || "",
        District: apiData.district || "",
        Consultant: apiData.consultant || "",
        Resources: apiData.resources || "",
        Note: apiData.note || "",
        SafetyViolationsExist: apiData.safetyViolationsExist,
        EstimatedValue: apiData.estimatedValue,
        ActualValue: apiData.actualValue,
        OrderDate: apiData.orderDate.split("T")[0] || "",
        StationNumber: apiData.stationNumber,
        Contractor: apiData.contractor,
        ExtractNumber: apiData.extractNumber,
        WorkDescription: apiData.workDescription,
        PricingItemIds: apiData.pricingItems?.map(i => i.id) || [],
        pricingItemsObjects: apiData.pricingItems || [],
      });
      setFileData({
        ModelPhotos: apiData.modelPhotos || [],
        SitePhotos: apiData.sitePhotos || [],
        SafetyWastePhotos: apiData.safetyWastePhotos || [],
      });
    }
  }, [apiData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "SafetyViolationsExist"
          ? value === "exists"
            ? true
            : false
          : value,
    }));
  };

  const openFileSelector = (fileType) => {
    fileInputRefs[fileType].current.click();
  };

  const handleFileChange = (event, fileType) => {
    const uploadedFiles = Array.from(event.target.files);
    const newFiles = uploadedFiles.filter((file) => {
      if (file.type === "application/pdf") {
        return true;
      }
      return file.size <= 1 * 1024 * 1024 * 1024;
    });
    const rejectedFiles = uploadedFiles.filter((file) => {
      return (
        file.type !== "application/pdf" && file.size > 1 * 1024 * 1024 * 1024
      );
    });
    if (rejectedFiles.length) {
      setErrorMessage("بعض الملفات كانت كبيرة جدًا ولا يمكن رفعها.");
    } else {
      setErrorMessage("");
    }
    setFileData((prev) => ({
      ...prev,
      [fileType]: [...prev[fileType], ...newFiles],
    }));
  };

  const handleFileDelete = (fileType, fileToDelete) => {
    setFileData((prev) => ({
      ...prev,
      [fileType]: prev[fileType].filter(
        (file) => file.name !== fileToDelete.name
      ),
    }));
  };

  const handleSubmit = async (isArchive) => {
    let fieldErrors = [];
    if (formData.ProjectPlace === "") fieldErrors.push("مكان المشروع");
    if (formData.Customer === "") fieldErrors.push("اسم العميل");
    if (formData.ProjectName === "") fieldErrors.push("اسم المشوع");
    if (formData.TimeOfProject === "") fieldErrors.push("مده التنفيذ");
    if (formData.StationNumber === "") fieldErrors.push(" رقم المحطه");
    // if (formData.District === "") fieldErrors.push("  الحي");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    // if (formData.OrderDate === "") fieldErrors.push("تاريخ التنفيذ");
    if (formData.Contractor === "") fieldErrors.push(" المقاول");
    if (formData.SafetyViolationsExist === "")
      fieldErrors.push("هل اخطاء السلامه موجوده ");
    if (fileData.ModelPhotos.length === 0) fieldErrors.push("المتسندات ");

    if (fieldErrors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        html: `يرجى ملء الحقول التالية: <br> ${fieldErrors.join(", ")}`,
      });
      return;
    }
    fieldErrors = [];

    const submissionData = new FormData();

    const skipKeys = new Set(["PricingItemIds", "pricingItemsObjects"]);

    Object.entries(formData).forEach(([key, value]) => {
      if (skipKeys.has(key)) return;
      if (value !== null && value !== undefined && value !== "" && value !== "null") {
        submissionData.append(key, value);
      }
    });

    formData.pricingItemsObjects?.forEach((dto, index) => {
      submissionData.append(`PricingItems[${index}].pricingItemId`,       dto.pricingItemId);
      submissionData.append(`PricingItems[${index}].estimatedQuantity`,   dto.estimatedQuantity  ?? 0);
      submissionData.append(`PricingItems[${index}].totalPrice`,          dto.totalPrice         ?? 0);
      submissionData.append(`PricingItems[${index}].executedQuantity`,    dto.executedQuantity   ?? 0);
      submissionData.append(`PricingItems[${index}].executedWorksValue`,  dto.executedWorksValue ?? 0);
      submissionData.append(`PricingItems[${index}].executionPercentage`, dto.executionPercentage ?? 0);
    });

    submissionData.append("isArchive", isArchive);

    Object.entries(fileData).forEach(([key, files]) => {
        files.forEach((file) => {
          submissionData.append(key, file);
        });
    });

    setLoading(true);
    setUploadProgress(0);

    try {
      const url = apiData ? updateUrl : createUrl;
      const method = apiData ? "PUT" : "POST";
      console.log(submissionData);
      await axios({
        method,
        url,
        data: submissionData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      setSuccessMessage(apiData ? "تم تحديث الطلب بنجاح." : "تم إرسال الطلب بنجاح.");
      setShowModal({ success: true, error: false });
    } catch (error) {
      console.error(error);
      let errorMessage =
        error.response?.data?.message || "يرجي  التاكد من البيانات";
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
        errorMessage = errorMessages || errorMessage;
      } else if (error?.response?.data?.data) {
        errorMessage = error.response.data.data;
      }
      setErrorMessage(errorMessage);
      setShowModal({ success: false, error: true });
    } finally {
      setLoading(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const handleApiFileDelete = async (fileType, fileId) => {
    const endpointMap = {
      ModelPhotos: "PrivateProject/model-photo",
      SitePhotos: "PrivateProject/site-photo",
      SafetyWastePhotos: "PrivateProject/safety-photo",
    };
    const endpoint = `${Url}${endpointMap[fileType]}?photoId=${fileId}`;
    try {
      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        setFileData((prev) => ({
          ...prev,
          [fileType]: prev[fileType].filter((item) => item.id !== fileId),
        }));
        Swal.fire({
          position: "center",
          icon: "success",
          title: "تم حذف الصوره بنجاح.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "فشل حذف الصورة",
        text: "يرجى المحاولة مرة أخرى.",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  /* ════ RENDER ════ */
  return (
    <div className="form-container" dir="rtl">
      <div className="w-full max-w-none px-4">
        <div className="FormData w-full max-w-none">

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h3 style={{ marginBottom: "6px" }}>بيانات الطلب</h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Get a Quote Immediately Upon Form Submission
            </p>
          </div>

          {/* ── Tab Bar ── */}
          <div
            style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "28px",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "8px",
          }}
          >
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: active ? "600" : "400",
                    cursor: "pointer",
                    background: active ? "#eff6ff" : "transparent",
                    border: "none",
                    borderBottom: active
                      ? "2px solid #2563eb"
                      : "2px solid transparent",
                    marginBottom: "-2px",
                    color: active ? "#2563eb" : "#6b7280",
                    borderRadius: "6px 6px 0 0",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={15} />
                  {label}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      fontSize: "10px",
                      fontWeight: "700",
                      background: active ? "#2563eb" : "#e5e7eb",
                      color: active ? "#fff" : "#6b7280",
                    }}
                  >
                    {id + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Progress Bar ── */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
            {TABS.map(({ id }) => (
              <div
                key={id}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background:
                    id < activeTab
                      ? "#2563eb"
                      : id === activeTab
                      ? "#93c5fd"
                      : "#e5e7eb",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          {/* ══════════════════════════════════════════
              TAB 0 — بيانات المقايسة
          ══════════════════════════════════════════ */}
          {activeTab === 0 && (
            <div>
              <SectionLabel color={blue}>معلومات المشروع الأساسية</SectionLabel>

              <div className="input-group">
                <div className="groub_fe">
                  <label>مكان المشروع</label>
                  <input
                    type="text"
                    name="ProjectPlace"
                    placeholder="مكان المشروع"
                    value={formData.ProjectPlace || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="groub_fe">
                  <label>اسم العميل</label>
                  <input
                    type="text"
                    name="Customer"
                    placeholder="اسم العميل"
                    value={formData.Customer || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="groub_fe">
                  <label>اسم المشروع</label>
                  <input
                    type="text"
                    name="ProjectName"
                    placeholder="اسم المشروع"
                    value={formData.ProjectName || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="groub_fe">
                  <label>مده التنفيذ</label>
                  <input
                    type="text"
                    name="TimeOfProject"
                    placeholder="مده التنفيذ"
                    value={formData.TimeOfProject || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="groub_fe">
                  <label>المنطقة</label>
                  <input
                    type="text"
                    name="Contractor"
                    placeholder="المقاول"
                    value={formData.Contractor || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* <SelectDistrict
                  officeName={"All"}
                  value={formData.District}
                  onChange={handleChange}
                /> */}
              </div>

              <SectionLabel color={blue}>بيانات التنفيذ</SectionLabel>

              <div className="input-group">
                <WorkDescriptionInput
                  onChange={handleChange}
                  value={formData.WorkDescription}
                />
                <SelectConsultant
                  value={formData.Consultant}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <div className="groub_fe">
                  <label>تاريخ الطلب</label>
                  <input
                    type="date"
                    name="OrderDate"
                    value={formData.OrderDate || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="groub_fe">
                  <label>رقم المحطة</label>
                  <input
                    type="text"
                    name="StationNumber"
                    placeholder="رقم المحطة"
                    value={formData.StationNumber || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <NavBtns activeTab={activeTab} setActiveTab={setActiveTab} total={TABS.length} />
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB 1 — البيانات المالية للمقايسة
          ══════════════════════════════════════════ */}
          {activeTab === 1 && (
            <div>
              <SectionLabel color={yellow}>القيم والمستخلصات</SectionLabel>

              <div className="input-group">
                <div className="groub_fe">
                  <label>القيمة المقدره</label>
                  <input
                    type="text"
                    name="projectValue"
                    placeholder="القيمة المقدره"
                    value={formData.projectValue || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="groub_fe">
                  <label>القيمة التقديرية</label>
                  <input
                    type="text"
                    name="EstimatedValue"
                    placeholder="القيمة التقديرية"
                    value={formData.EstimatedValue || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="groub_fe">
                  <label>القيمة الفعلية</label>
                  <input
                    type="text"
                    name="ActualValue"
                    placeholder="القيمة الفعلية"
                    value={formData.ActualValue || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="groub_fe">
                  <label>رقم المستخلص</label>
                  <input
                    type="text"
                    name="ExtractNumber"
                    placeholder="رقم المستخلص"
                    value={formData.ExtractNumber || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <SectionLabel color={yellow}>ملاحظات</SectionLabel>

              <div className="input-group">
                <textarea
                  name="Note"
                  placeholder="الملاحظات"
                  value={formData.Note}
                  onChange={handleChange}
                />
              </div>

              <NavBtns activeTab={activeTab} setActiveTab={setActiveTab} total={TABS.length} />
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB 2 — أعمال المقايسة
          ══════════════════════════════════════════ */}
          {activeTab === 2 && (
            <div>
              <PricingItemsSelector
                value={formData.PricingItemIds || []}
                initialItems={formData.pricingItemsObjects || []}
                onChange={(ids, dtos) => {
                  handleChange({ target: { name: "PricingItemIds",      value: ids  } });
                  handleChange({ target: { name: "pricingItemsObjects", value: dtos } });
                }}
              />
              <SectionLabel color={green}>مخالفات السلامة</SectionLabel>

              <RadioGroup
                label="مخالفات السلامة"
                options={[
                  { label: "يوجد",    value: "exists"     },
                  { label: "لا يوجد", value: "not-exists" },
                ]}
                name="SafetyViolationsExist"
                selectedValue={formData.SafetyViolationsExist}
                onChange={handleChange}
              />

              {formData.SafetyViolationsExist &&
                renderUploadSection(
                  "صور مخالفات السلامة",
                  "SafetyWastePhotos",
                  "صور المخالفات",
                  handleFileChange,
                  fileInputRefs,
                  openFileSelector,
                  fileData,
                  handleApiFileDelete,
                  handleFileDelete,
                  true,
                  false,
                  apiData?.projectType || "مشروع خاص"
                )}

              <SectionLabel color={green}>المستندات والمرفقات</SectionLabel>

              {renderUploadSection(
                "المستندات ",
                "ModelPhotos",
                "تصوير مستندات مع الختم",
                handleFileChange,
                fileInputRefs,
                openFileSelector,
                fileData,
                handleApiFileDelete,
                handleFileDelete,
                true,
                  false,
                  apiData?.projectType || "مشروع خاص"
              )}
              {renderUploadSection(
                "صور الموقع",
                "SitePhotos",
                "صور الموقع",
                handleFileChange,
                fileInputRefs,
                openFileSelector,
                fileData,
                handleApiFileDelete,
                handleFileDelete,
                true,
                  false,
                  apiData?.projectType || "مشروع خاص"
              )}

              {/* ── أزرار الإرسال ── */}
              <div className="flex flex-col gap-3">
                <button
                  className={`px-4 py-2 rounded ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-mainColor"
                  } text-white`}
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                >
                  {loading ? "جاري التحميل..." : "تم التنفيذ"}
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 !bg-secondaryColor rounded ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-secondaryColor"
                  } text-white`}
                  style={{ background: "rgba(244, 67, 54, 1)", color: "white" }}
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  {loading ? "جاري التحميل..." : "تحت التنفيذ"}
                </button>
              </div>

              <NavBtns activeTab={activeTab} setActiveTab={setActiveTab} total={TABS.length} />
            </div>
          )}

        </div>
      </div>

      <LoadingModal
        show={loading}
        onHide={() => setLoading(false)}
        uploadProgress={uploadProgress}
      />
      <SuccessModal
        show={showModal.success}
        onHide={refreshPage}
        message={successMessage}
      />
      <ErrorModal
        show={showModal.error}
        onHide={() => setShowModal({ error: false, success: false })}
        message={errorMessage}
      />
    </div>
  );
};

export default Form;