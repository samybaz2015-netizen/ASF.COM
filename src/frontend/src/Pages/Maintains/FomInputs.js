import React, { useState } from "react";
import { FaClipboardList, FaHistory, FaMoneyBillWave, FaTools } from "react-icons/fa";
import {
  ErrorModal,
  LoadingModal,
  SuccessModal,
} from "../../Component/Common/ModelComponents";
import RequestBtns from "../../Component/RequestBtns/RquestBtns";
import renderUploadSection from "../../Component/RenderFile/RenderFile";
import SelectSituation from "../../Component/SelectSitution/SelectSitudation";
import SelectConsultant from "../../Component/SelectConsultant/SelectConusltant";
import WorkDescriptionInput from "../../Component/WorkDescriptionInput/WorkDescriptionInput";
import SelectDistrict from "../../Component/SelectDistrict/SelectDistrict";
import RequestStatus from "../../Component/RequestStatus/RequestStatus";
import SelectOffice from "../../Component/SelectOffice/SelectOffice";
import RadioGroup from "../../Component/RadioGroup/RadioGroup";
import SelectWorkOrderType from "../../Component/SelectWorkOrderType/SelectWorkOrderType";
import OfficeSelect from "../../Component/SelectOffice/SelectOffice";
import EquipmentTestTypeSelect from "../../Component/EquipmentTestTypeSelect/EquipmentTestTypeSelect";
import NumberOfEquipment from "../../Component/NumberOfEquipment/NumberOfEquipment";
import PricingItemsSelector from "../Construction/Pricingitemsselector";
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
export const readOnlyBoxStyle = {
  padding: "9px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb",
  borderRadius: "8px", fontSize: "13px", fontWeight: 700, color: "#111827",
};
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
   Main Component
════════════════════════════════════════════ */
function FomInputs({
  handleChange,
  handleFileChange,
  fileInputRefs,
  openFileSelector,
  fileData,
  handleApiFileDelete,
  handleFileDelete,
  errorMessage,
  setShowModal,
  showModal,
  successMessage,
  refreshPage,
  uploadProgress,
  setLoading,
  loading,
  formData,
  handleSubmit,
  apiData,
  id,           
  token,        
  setFormData,  
}) {
  const [activeTab, setActiveTab] = useState(0);

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

  return (
    <div className="form-container" dir="rtl">
      <div  className="w-full max-w-none px-4">
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

        <div style={{ display: activeTab === 0 ? "block" : "none" }}>
          {activeTab === 0 && (
            <div>
              <SectionLabel color={blue}>معلومات المشروع الأساسية</SectionLabel>

              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                <OfficeSelect
                  selectedOffice={formData.Office}
                  onOfficeChange={handleChange}
                />
                <div className="groub_fe">
                  <label>رقم امر العمل</label>
                  <input
                    type="text"
                    name="FaultNumber"
                    placeholder="نوع امر العمل"
                    value={formData.FaultNumber || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                <div className="groub_fe">
                  <label>رقم الاشعار</label>
                  <input
                    type="text"
                    name="NotificationNumber"
                    placeholder="رقم الاشعار"
                    value={formData.NotificationNumber || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="groub_fe">
                  <label>رقم المهمة</label>
                  <input
                    type="text"
                    name="TaskNumber"
                    placeholder="رقم المهمه"
                    value={formData.TaskNumber || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <EquipmentTestTypeSelect
                  value={formData.TypeOfStomachTest}
                  handleChange={handleChange}
                />
              </div>

              {/* Second Group */}
              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                <NumberOfEquipment
                  value={formData.NumberOfEquipment}
                  handleChange={handleChange}
                />
                <SelectWorkOrderType
                  value={formData.WorkOrderType}
                  handleChange={handleChange}
                />
              </div>

              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
               
                <SelectDistrict
                  officeName={formData.Office}
                  value={formData.District}
                  onChange={handleChange}
                />
              </div>

              <SectionLabel color={blue}>بيانات التنفيذ</SectionLabel>

              {/* Fourth Group */}
              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                <div className="groub_fe">
                  <label>تاريخ استلام امر العمل</label>
                  <input
                    type="date"
                    name="ReceiveDateTime"
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
                    value={formData.OrderDate || ""}
                    readOnly
                  />
                </div>
              </div>

              {/* Fifth Group */}
              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                <WorkDescriptionInput
                  onChange={handleChange}
                  value={formData.WorkDescription}
                />
               
                <div className="groub_fe">
                  <label>رقم المحطه</label>
                  <input
                    type="text"
                    name="StationNumber"
                    placeholder="رقم المحطه"
                    value={formData.StationNumber || ""}
                    onChange={handleChange}
                    required
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

              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                  <div className="input-group">
                    <div className="groub_fe">
                      <label>القيمة التقديرية (تُحسب تلقائيًا)</label>
                      <div style={readOnlyBoxStyle}>{formData.EstimatedValue || "0.00"}</div>
                    </div>
                    <div className="groub_fe">
                      <label>القيمة الفعلية المنفذه(تُحسب تلقائيًا)</label>
                      <div style={readOnlyBoxStyle}>{formData.ActualValue || "0.00"}</div>
                    </div>
                    <div className="groub_fe">
                      <label>رقم المستخلص</label>
                      <input type="text" name="ExtractNumber" value={formData.ExtractNumber || ""} onChange={handleChange} />
                    </div>
                  </div>
              </div>

              <SectionLabel color={yellow}>الحالة والملاحظات</SectionLabel>

              <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                <SelectSituation
                  value={formData.Situation}
                  onChange={handleChange}
                />
              </div>

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
        </div>

          {/* ══════════════════════════════════════════
              TAB 2 — أعمال المقايسة
          ══════════════════════════════════════════ */}

        <div style={{ display: activeTab === 2 ? "block" : "none" }}>
          {activeTab === 2 && (
            <div>
                <PricingItemsSelector
                  value={formData.PricingItemIds || []}
                  initialItems={formData.pricingItemsObjects || []}
                  entityType="Maintenance"   
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
                  apiData?.projectType || "الصيانة"

                )}

              <div className="input-group">
                <textarea
                  name="DescriptionViolation"
                  placeholder="وصف المخالفه"
                  value={formData.DescriptionViolation}
                  onChange={handleChange}
                />
              </div>

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
                  apiData?.projectType || "الصيانة"
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
                  apiData?.projectType || "الصيانة"
              )}
              {renderUploadSection(
                "مستندات الاختبار",
                "TestModels",
                "مستندات الاختبار",
                handleFileChange,
                fileInputRefs,
                openFileSelector,
                fileData,
                handleApiFileDelete,
                handleFileDelete,
                 true,
                  false,
                  apiData?.projectType || "الصيانة"
              )}

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
                    entityType="Maintenance"
                    projectId={id}
                    token={token}
                  />
                </>

              )}
            </div>

        </div>
      </div>

      {/* Progress Modal */}
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
}

export default FomInputs;