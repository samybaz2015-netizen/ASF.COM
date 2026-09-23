import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { domain, Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import { useParams, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaHistory, FaMoneyBillWave, FaTools } from "react-icons/fa";
import SelectConsultant from "../../Component/SelectConsultant/SelectConusltant";
import SelectDistrict from "../../Component/SelectDistrict/SelectDistrict";
import {
  ErrorModal,
  LoadingModal,
  SuccessModal,
} from "../../Component/Common/ModelComponents";
import SelectSituation from "../../Component/SelectSitution/SelectSitudation";
import WorkDescriptionInput from "../../Component/WorkDescriptionInput/WorkDescriptionInput";
import RequestBtns from "../../Component/RequestBtns/RquestBtns";
import renderUploadSection from "../../Component/RenderFile/RenderFile";
import RadioGroup from "../../Component/RadioGroup/RadioGroup";
import endpointMap from "../../util/ModelsProjectsUrls";
import SelectOffice from "../../Component/SelectOffice/SelectOffice";
import SelectWorkOrderType from "../../Component/SelectWorkOrderType/SelectWorkOrderType";
import OfficeSelect from "../../Component/SelectOffice/SelectOffice";
import PricingItemsSelector from "../Construction/Pricingitemsselector";
import { readOnlyBoxStyle } from "../Maintains/FomInputs";
import ExecutedQuantityLogsModal from "../Construction/ExecutedQuantityLogsModal/ExecutedQuantityLogsModal";
import { OwnerSelect, PartySelect } from "../../Component/ProjectLookupSelects/ProjectLookupSelects";

import { SectionLabel } from "../../Component/Common/SectionLabel";
/* ─── Tab config ─── */
const TABS = [
  { id: 0, label: "بيانات المقايسة",           Icon: FaClipboardList  },
  { id: 1, label: "البيانات المالية للمقايسة", Icon: FaMoneyBillWave  },
  { id: 2, label: "أعمال المقايسة",            Icon: FaTools          },
  { id: 3, label: "سجل التعديلات",              Icon: FaHistory },
];

/* ─── Section label helper ─── */

const blue   = { bg: "#f0f9ff", border: "#2563eb", text: "#1e40af" };
const yellow = { bg: "#fefce8", border: "#ca8a04", text: "#92400e" };
const green  = { bg: "#f0fdf4", border: "#16a34a", text: "#14532d" };

/* ─── Nav buttons ─── */
const NavBtns = ({ activeTab, setActiveTab, total }) => (
  <div
    style={{
      display: "flex",
      justifyContent: activeTab === 0 ? "flex-start" : activeTab === total - 1 ? "flex-end" : "space-between",
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
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);

  const createUrl = `${Url}RehabilitationWorks/create-rehabilitationWorks\n`;
  const updateUrl = `${Url}RehabilitationWorks/update/${id}`;

  const [formData, setFormData] = useState({
    WorkOrderType: "",
    FaultNumber: "",
    FaultType: "",
    District: "",
    Office: "",
    OrderDate: "",
    WorkDescription: "",
    StationNumber: "",
    DurationOfImplementation: "",
    QualificationClassification: "",
    ReceiveDateTime: "",
    Situation: "",
    Contractor: "",
    Engineer: "",        
    Supervisor: "",      
    ProjectOwner: "", 
    Consultant: "",
    Note: "",
    SafetyViolationsExist: false,
    EstimatedValue: "",
    ActualValue: "",
    ExtractNumber: "",
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
      console.log(apiData);
      setFormData({
        WorkOrderType: apiData.workOrderType || "",
        Office: apiData.office || "",
        ReceiveDateTime: apiData.receiveDateTime.split("T")[0] || "",
        FaultType: apiData.faultType || "",
        FaultNumber: apiData.faultNumber || "",
        Contractor: apiData.contractor || "",
        Engineer: apiData.engineer || "",          
        Supervisor: apiData.supervisor || "",       
        ProjectOwner: apiData.projectOwner || "",
        District: apiData.district || "",
        Consultant: apiData.consultant || "",
        OrderDate: apiData?.orderDate?.split("T")[0] || "",
        Note: apiData.note || "",
        OrderType: apiData.orderType || "",
        WorkDescription: apiData.workDescription || "",
        StationNumber: apiData.stationNumber || "",
        DurationOfImplementation: apiData.durationOfImplementation || "",
        QualificationClassification: apiData.qualificationClassification || "",
        Situation: apiData.situation || "",
        SafetyViolationsExist: apiData.safetyViolationsExist,
        EstimatedValue: apiData.estimatedValue,
        ActualValue: apiData.actualValue,
        ExtractNumber: apiData.extractNumber,
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
      if (file.type === "application/pdf") return true;
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
    if (formData.Office === "") fieldErrors.push("المكتب");
    if (formData.WorkOrderType === "") fieldErrors.push("نوع  امر العمل");
    if (formData.DurationOfImplementation === "") fieldErrors.push("مدة التنفيذ");
    if (formData.ReceiveDateTime === "") fieldErrors.push(" تاريخ استلام امر العمل");
    if (formData.OrderDate === "") fieldErrors.push("تاريخ التنفيذ");
    if (formData.FaultNumber === "") fieldErrors.push("رقم امر العمل  ");
    if (formData.Contractor === "") fieldErrors.push(" المقاول");
    if (formData.WorkDescription === "") fieldErrors.push(" وصف المشروع");
    if (formData.SafetyViolationsExist === "") fieldErrors.push("هل اخطاء السلامه موجوده ");
    // ✅ شيل تعريف skipKeys من هنا خالص

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

    // ✅ التعريف الوحيد هنا، وهو المُحدَّث بـ 4 عناصر
    const skipKeys = new Set([
      "PricingItemIds",
      "pricingItemsObjects",
      "EstimatedValue",
      "ActualValue",
    ]);

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
      console.log(error);
      let errorMessage = error.response?.data?.message || "يرجي  التاكد من البيانات";
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
    const endpoint = `${Url}${endpointMap.RehabilitationWorks[fileType]}?photoId=${fileId}`;
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

  const handleDurationOrReceiveDateChange = (e) => {
      handleChange(e); 

      const { name, value } = e.target;

      setFormData((prev) => {
        const receiveDate = name === "ReceiveDateTime" ? value : prev.ReceiveDateTime;
        const duration = name === "DurationOfImplementation" ? value : prev.DurationOfImplementation;

        if (receiveDate && duration) {
          const date = new Date(receiveDate);
          date.setDate(date.getDate() + Number(duration));
          const formattedDate = date.toISOString().split("T")[0];
          return { ...prev, OrderDate: formattedDate };
        }

        return prev;
      });
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
                    borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
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

          {/* ── Progress bar ── */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
            {TABS.map(({ id }) => (
              <div
                key={id}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background:
                    id < activeTab ? "#2563eb" : id === activeTab ? "#93c5fd" : "#e5e7eb",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          {/* ══════════════════════════════════════════
              TAB 0 — بيانات المقايسة
          ══════════════════════════════════════════ */}
          <div style={{ display: activeTab === 0 ? "block" : "none" }}>
              {activeTab === 0 && (
                <div>
                  <SectionLabel color={blue}>معلومات المشروع الأساسية</SectionLabel>

                  <div className="input-group">
                    <OfficeSelect
                      selectedOffice={formData.Office}
                      onOfficeChange={handleChange}
                    />
                    <SelectWorkOrderType
                      value={formData.WorkOrderType}
                      handleChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <div className="groub_fe">
                      <label>رقم امر العمل</label>
                      <input
                        type="text"
                        name="FaultNumber"
                        placeholder="رقم امر العمل"
                        value={formData.FaultNumber || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <SelectDistrict
                      officeName={formData.Office}
                      value={formData.District}
                      onChange={handleChange}
                    />
                  </div>


                  <SectionLabel color={blue}>بيانات التنفيذ</SectionLabel>

                <div className="input-group">
                  <WorkDescriptionInput
                    onChange={handleChange}
                    value={formData.WorkDescription}
                  />
                 
                </div>

                 <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                   <div className="groub_fe">
                    <label>تاريخ استلام امر الطلب</label>
                    <input
                      type="date"
                      name="ReceiveDateTime"
                      placeholder="تاريخ استلام امر الطلب"
                      value={formData.ReceiveDateTime || ""}
                      onChange={handleDurationOrReceiveDateChange}
                      required
                    />
                  </div>
                  <div className="groub_fe">
                    <label>مدة التنفيذ</label>
                    <input
                      type="text"
                      name="DurationOfImplementation"
                      placeholder="مدة التنفيذ"
                      value={formData.DurationOfImplementation || ""}
                      onChange={handleDurationOrReceiveDateChange}
                      required
                    />
                  </div>

                  <div className="groub_fe">
                    <label>تاريخ التنفيذ</label>
                    <input
                      type="date"
                      name="OrderDate"
                      placeholder="تاريخ التنفيذ"
                      value={formData.OrderDate || ""}
                      readOnly
                    />
                  </div>
                </div>

                    <PartySelect type="المقاول" label="اسم المقاول" name="Contractor" value={formData.Contractor} onChange={handleChange} />
                    {/* <PartySelect type="المهندس" label="اسم المهندس" name="Engineer" value={formData.Engineer} onChange={handleChange} /> */}
                     <PartySelect type="المشرف"  label="اسم المشرف"  name="Supervisor" value={formData.Supervisor} onChange={handleChange} />
                    {/* <div className="groub_fe">
                      <label>اسم المشرف</label>
                      <input
                        type="text"
                        name="Supervisor"
                        placeholder="اسم المشرف"
                        value={formData.Supervisor || ""}
                        onChange={handleChange}
                      />
                    </div> */}
                    <OwnerSelect label="مالك المشروع" name="ProjectOwner" value={formData.ProjectOwner} onChange={handleChange} />

                

                  <NavBtns activeTab={activeTab} setActiveTab={setActiveTab} total={TABS.length} />
                </div>
              )}
          </div>
          {/* ══════════════════════════════════════════
              TAB 1 — البيانات المالية للمقايسة
          ══════════════════════════════════════════ */}
          <div style={{ display: activeTab === 1 ? "block" : "none" }}>
            {activeTab === 1 && (
              <div>
                <SectionLabel color={yellow}>القيم والمستخلصات</SectionLabel>

              <div className="input-group">
                    <div className="groub_fe">
                      <label>القيمة التقديرية</label>
                      <div style={readOnlyBoxStyle}>{formData.EstimatedValue || "0.00"}</div>
                    </div>

                    <div className="groub_fe">
                      <label>القيمة الفعلية المنفذة</label>
                      <div style={readOnlyBoxStyle}>{formData.ActualValue || "0.00"}</div>
                    </div>

                    <div className="groub_fe">
                            <label>الفرق (تقديري - فعلي)</label>
                            {(() => {
                              const estimated = parseFloat(formData.EstimatedValue) || 0;
                              const actual = parseFloat(formData.ActualValue) || 0;
                              const diff = estimated - actual;
                              const isPositive = diff >= 0;

                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    border: `1px solid ${isPositive ? "#2563eb33" : "#ea580c33"}`,
                                    background: isPositive ? "#2563eb0d" : "#ea580c0d",
                                    fontWeight: 600,
                                    fontSize: "15px",
                                    color: isPositive ? "#1d4ed8" : "#c2410c",
                                  }}
                                >
                                  <span>{Math.abs(diff).toFixed(2)}</span>
                                  <span style={{ fontSize: "13px", fontWeight: 500, opacity: 0.8 }}>
                                    {isPositive ? "أقل من التقديري" : "أعلى من التقديري"}
                                  </span>
                                </div>
                              );
                            })()}
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

                <SectionLabel color={yellow}>الحالة والتصنيف</SectionLabel>

                <div className="input-group">
                  <SelectSituation
                    value={formData.Situation}
                    onChange={handleChange}
                  />
                  <div className="groub_fe">
                    <label htmlFor="">تصنيف التأهيل</label>
                    <select
                      name="QualificationClassification"
                      onChange={handleChange}
                      value={formData.QualificationClassification}
                      className="border border-gray-300 rounded-lg p-2 w-full"
                    >
                      <option value="محطات">تأهيل محطات</option>
                      <option value="عدادات">تأهيل عدادات</option>
                      <option value="كباين">تأهيل كباين</option>
                      <option value="هوائي">تأهيل هوائي</option>
                      <option value="مسح-وإغلاق">تأهيل مسح وإغلاق المعدات</option>
                    </select>
                  </div>
                </div>

                <NavBtns activeTab={activeTab} setActiveTab={setActiveTab} total={TABS.length} />
              </div>
            )}
          </div>
          {/* ══════════════════════════════════════════
              TAB 2 — أعمال المقايسة
          ══════════════════════════════════════════ */}
          <div style={{ display: activeTab === 2 ? "block" : "none" }}>
            {activeTab === 2 && (
              <div>
                <SectionLabel color={green}>المستندات والمرفقات</SectionLabel>

                <PricingItemsSelector
                    value={formData.PricingItemIds || []}
                    initialItems={formData.pricingItemsObjects || []}
                    entityType="RehabilitationWorks"   
                    projectId={id}
                    token={token}
                    onChange={(ids, dtos, totals) => {
                      handleChange({ target: { name: "PricingItemIds", value: ids } });
                      handleChange({ target: { name: "pricingItemsObjects", value: dtos } });
                      if (totals) {
                        setFormData((prev) => ({
                          ...prev,
                          EstimatedValue: totals.totalEstimatedValue.toFixed(2),
                          ActualValue: totals.totalExecutedValue.toFixed(2),
                        }));
                      }
                    }}
                  />

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
                  apiData?.projectType || "أعمال التأهيل"
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
                  apiData?.projectType || "أعمال التأهيل"
                )}

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
                  apiData?.projectType || "أعمال التأهيل"
                  
                  )}

                <div className="input-group">
                  <textarea
                    name="Note"
                    placeholder="الملاحظات"
                    value={formData.Note}
                    onChange={handleChange}
                  />
                </div>

                <RequestBtns
                  loading={loading}
                  Situation={formData.Situation}
                  handleSubmit={handleSubmit}
                />

                <NavBtns activeTab={activeTab} setActiveTab={setActiveTab} total={TABS.length} />
              </div>
            )}
          </div>

            {/* ============================================================
                                    TAB 4 — سجل التغيرات
                  ============================================================ */}
                      
              <div style={{ display: activeTab === 3 ? "block" : "none" }}>
                          {activeTab === 3 && ( 
                             <>
                               <ExecutedQuantityLogsModal 
                                 entityType="RehabilitationWorks"
                                 projectId={id}
                                 token={token}
                               />
                             </>
            
                           )}
              </div>

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