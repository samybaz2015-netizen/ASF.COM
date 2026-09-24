import React, { useEffect, useState } from "react";
import {
  ErrorModal,
  LoadingModal,
  SuccessModal,
} from "../../Component/Common/ModelComponents";
import RequestBtns from "../../Component/RequestBtns/RquestBtns";
import renderUploadSection from "../../Component/RenderFile/RenderFile";
import RadioGroup from "../../Component/RadioGroup/RadioGroup";
import SelectConsultant from "../../Component/SelectConsultant/SelectConusltant";
import WorkDescriptionInput from "../../Component/WorkDescriptionInput/WorkDescriptionInput";
import SelectDistrict from "../../Component/SelectDistrict/SelectDistrict";
import OfficeSelect from "../../Component/SelectOffice/SelectOffice";
import RequestStatus from "../../Component/RequestStatus/RequestStatus";
import SelectWorkOrderType from "../../Component/SelectWorkOrderType/SelectWorkOrderType";
import EquipmentTestTypeSelect from "../../Component/EquipmentTestTypeSelect/EquipmentTestTypeSelect";
import NumberOfEquipment from "../../Component/NumberOfEquipment/NumberOfEquipment";
import CableLengthInputs from "./CableLengthInputs";
import { FaClipboardList, FaHistory, FaMoneyBillWave, FaTools } from "react-icons/fa";
import PricingItemsSelector from "./Pricingitemsselector";
import ExecutedQuantityLogsModal from "./ExecutedQuantityLogsModal/ExecutedQuantityLogsModal";
import ExecutedQuantityLogs from "./ExecutedQuantityLogsModal/ExecutedQuantityLogsModal";
import { OwnerSelect, PartySelect } from "../../Component/ProjectLookupSelects/ProjectLookupSelects";
import BranchSelect from "../../Component/SelectBranch/SelectBranch";

import { SectionLabel } from "../../Component/Common/SectionLabel";
const TABS = [
  { id: 0, label: "بيانات المقايسة", icon: FaClipboardList },
  { id: 1, label: "البيانات المالية للمقايسة", icon: FaMoneyBillWave },
  { id: 2, label: "أعمال المقايسة", icon: FaTools },
  { id: 3, label: "سجل التعديلات",   icon: FaHistory },
];
const readOnlyBoxStyle = {
  padding: "9px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb",
  borderRadius: "8px", fontSize: "13px", fontWeight: 700, color: "#111827",
};

function ConstructionFormInput({
  formData,
  handleChange,
  apiData,
  handleFileChange,
  fileInputRefs,
  openFileSelector,
  fileData,
  handleApiFileDelete,
  handleFileDelete,
  errorMessage,
  setShowModal,
  showModal,
  uploadProgress,
  handleSubmit,
  setLoading,
  refreshPage,
  loading,
  successMessage,
  isUpdate = false,
  userData,
   id,           
  token,       
  setFormData,  
}) {
  const isContractor = userData?.userType === "contractor";
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
  const start = formData.CompletionDate;
  const duration = parseInt(formData.DurationOfImplementation, 10);

  if (start && !isNaN(duration) && duration >= 0) {
    const d = new Date(start);
    d.setDate(d.getDate() + duration);
    const calculated = d.toISOString().split("T")[0]; 

    if (formData.OrderDate !== calculated) {
      setFormData((prev) => ({ ...prev, OrderDate: calculated }));
    }
  }

}, [formData.CompletionDate, formData.DurationOfImplementation]);

  return (
    <div className="form-container" dir="rtl">
      <div className="w-full max-w-none px-4">
        <div className="FormData w-full max-w-none">

          {/* ===== Header ===== */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h3 style={{ marginBottom: "6px" }}>بيانات الطلب</h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Get a Quote Immediately Upon Form Submission
            </p>
          </div>

          {/* ===== Tab Navigation ===== */}
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
           {TABS.map((tab) => {
            const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: activeTab === tab.id ? "600" : "400",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      activeTab === tab.id
                        ? "2px solid #2563eb"
                        : "2px solid transparent",
                    marginBottom: "-2px",
                    color: activeTab === tab.id ? "#2563eb" : "#6b7280",
                    transition: "all 0.2s ease",
                    borderRadius: "0",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={16} />

                  <span>{tab.label}</span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: activeTab === tab.id ? "#2563eb" : "#e5e7eb",
                      color: activeTab === tab.id ? "#fff" : "#6b7280",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {tab.id + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ===== Progress Indicator ===== */}
          <div
            // style={{
            //   display: "flex",
            //   gap: "6px",
            //   marginBottom: "24px",
            //   alignItems: "center",
            // }}
            className="flex flex-wrap mb-12 items-center"
          >
            {TABS.map((tab) => (
              <React.Fragment key={tab.id}>
                <div
                  style={{
                    flex: 1,
                    height: "4px",
                    borderRadius: "2px",
                    background:
                      tab.id < activeTab
                        ? "#2563eb"
                        : tab.id === activeTab
                        ? "#93c5fd"
                        : "#e5e7eb",
                    transition: "background 0.3s ease",
                  }}
                />
              </React.Fragment>
            ))}
          </div>

          {/* ============================================================
              TAB 1 — بيانات المقايسة
          ============================================================ */}

          <div style={{ display: activeTab === 0 ? "block" : "none" }}>
            {activeTab === 0 && (
              <div>
                {!isContractor && (
                  <>
                    {/* Section: معلومات أساسية */}
                    <SectionLabel>معلومات المشروع الأساسية</SectionLabel>

                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                      {userData?.userType?.toLowerCase() === "admin" && (
  <BranchSelect
    value={formData.BranchId}
    onChange={(e) => {
      const branchId = e.target.value;

      setFormData((prev) => ({
        ...prev,
        BranchId: branchId,
        Office: "",
        District: "",
        Contractor: "",
        Supervisor: "",
        ProjectOwner: "",
        PricingItemIds: [],
        pricingItemsObjects: [],
      }));
    }}
  />
)}
                      <OfficeSelect
                        selectedOffice={formData.Office}
                        onOfficeChange={handleChange}
                        branchId={
                          userData?.userType?.toLowerCase() === "admin"
                            ? formData.BranchId
                            : undefined
                        }
                      />
                      <div className="groub_fe">
                        <label>نوع الانشاء</label>
                        <select
                          name="OrderType"
                          value={formData.OrderType}
                          onChange={handleChange}
                          className="border w-full"
                        >
                          <option value="">اختر نوع الانشاء</option>
                          <option value="مشاريع">مشاريع</option>
                          <option value="توصيلات">توصيلات</option>
                        </select>
                      </div>
                      <SelectWorkOrderType
                        value={formData.WorkOrderType}
                        handleChange={handleChange}
                      />
                    </div>


                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
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

                    <RequestStatus
                      situation={formData.Situation}
                      handleChange={handleChange}
                      implementationPhase={formData.ImplementationPhase}
                    />

                    <WorkDescriptionInput
                      onChange={handleChange}
                      value={formData.WorkDescription}
                    />

                    {/* Section: بيانات التنفيذ */}
                    <SectionLabel>بيانات التنفيذ</SectionLabel>

                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                        <div className="groub_fe">
                          <label>تاريخ الاسناد</label>
                          <input
                            type="date"
                            name="CompletionDate"
                            placeholder="تاريخ الاسناد"
                            value={formData.CompletionDate || ""}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="groub_fe">
                          <label>مدة التنفيذ (بالأيام)</label>
                          <input
                            type="text"
                            name="DurationOfImplementation"
                            placeholder="مدة التنفيذ"
                            value={formData.DurationOfImplementation || ""}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="groub_fe">
                          <label>تاريخ التنفيذ (تلقائي)</label>
                          <input
                            type="date"
                            name="OrderDate"
                            placeholder="تاريخ التنفيذ"
                            value={formData.OrderDate || ""}
                            readOnly
                          />
                        </div>
                      </div>

                      {isUpdate && (
                        <div className="groub_fe">
                          <label>عدد ايام التاخير</label>
                          <input
                            type="text"
                            name="NumberOfDaysDelayed"
                            placeholder="عدد ايام التاخير"
                            value={formData.NumberOfDaysDelayed || ""}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>
                      )}
                      {isUpdate && (
                        <div className="groub_fe">
                          <label>عدد الايام المتبقيه</label>
                          <input
                            type="text"
                            name="NumberOfDaysRemaining"
                            placeholder="NumberOfDaysRemaining"
                            value={formData.NumberOfDaysRemaining || ""}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>
                      )}
                      {isUpdate && (
                        <div className="groub_fe">
                          <label>نسبه الانجاز</label>
                          <input
                            type="text"
                            name="CompletionStatusReport"
                            placeholder="نسبه الانجاز"
                            value={formData.CompletionStatusReport || ""}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>
                      )}
                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
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

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <PartySelect
                        type="المقاول"
                        label="اسم المقاول"
                        name="Contractor"
                        value={formData.Contractor}
                        onChange={handleChange}
                        branchId={
                          userData?.userType?.toLowerCase() === "admin"
                            ? formData.BranchId
                            : undefined
                        }
                      />

                      <PartySelect
                        type="المشرف"
                        label="اسم المشرف"
                        name="Supervisor"
                        value={formData.Supervisor}
                        onChange={handleChange}
                        branchId={
                          userData?.userType?.toLowerCase() === "admin"
                            ? formData.BranchId
                            : undefined
                        }
                      />

                      <OwnerSelect
                        label="مالك المشروع"
                        name="ProjectOwner"
                        value={formData.ProjectOwner}
                        onChange={handleChange}
                        branchId={
                          userData?.userType?.toLowerCase() === "admin"
                            ? formData.BranchId
                            : undefined
                        }
                      />
                    </div>
                    <div className="input-group">
                      <textarea
                        name="Note"
                        placeholder="الملاحظات."
                        value={formData.Note}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {/* Tab Nav Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginTop: "24px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    style={{
                      padding: "10px 24px",
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
                    التالي ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              TAB 2 — البيانات المالية للمقايسة
          ============================================================ */}

          <div style={{ display: activeTab === 1 ? "block" : "none" }}>
            {activeTab === 1 && (
              <div>
                {!isContractor && (
                  <>
                    {/* Section: القيم */}
                    <SectionLabel>القيم والمستخلصات</SectionLabel>

                   <div className="input-group">
                        <div className="groub_fe">
                          <label>القيمة التقديرية (تُحسب تلقائيًا من البنود)</label>
                          <div style={readOnlyBoxStyle}>{formData.EstimatedValue || "0.00"}</div>
                        </div>
                        <div className="groub_fe">
                          <label>القيمة الفعلية المنفذه(تُحسب تلقائيًا من البنود) </label>
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
                    {/* Section: الحفريات */}
                    <SectionLabel>بيانات الحفريات</SectionLabel>

                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                      <div className="groub_fe">
                        <label>طول الحفرييه للمشروع</label>
                        <input
                          type="text"
                          name="ProjectExcavationLength"
                          placeholder="طول الحفريه للمشروع"
                          value={formData.ProjectExcavationLength || ""}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="groub_fe">
                        <label>طول التمديد</label>
                        <input
                          type="text"
                          name="DailyExcavationLength"
                          placeholder="طول التمديد"
                          value={formData.DailyExcavationLength || ""}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {isUpdate && (
                        <div className="groub_fe">
                          <label>طول الحفريه المنفذه</label>
                          <input
                            type="text"
                            name="ExcavationLength"
                            placeholder="طول الحفريه المنفذه"
                            value={formData.ExcavationLength || ""}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>
                      )}
                    </div>

                    {/* Section: الكابلات */}
                    <SectionLabel>بيانات الكابلات</SectionLabel>

                    <CableLengthInputs
                      handleChange={handleChange}
                      apiData={apiData}
                      CableCompletion={formData.CableCompletion}
                      CableLength={formData.CableLength}
                      DailyCableLength={formData.DailyCableLength}
                      ProjectCableLength={formData.ProjectCableLength}
                    />
                  </>
                )}

                {/* Tab Nav Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "24px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(0)}
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
                  <button
                    type="button"
                    onClick={() => setActiveTab(2)}
                    style={{
                      padding: "10px 24px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    التالي ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              TAB 3 — أعمال المقايسة
          ============================================================ */}

          <div style={{ display: activeTab === 2 ? "block" : "none" }}>
            {activeTab === 2 && (
              <div>
                {!isContractor && (
                  <>
                    {/* Section: التجهيزات */}
                    <SectionLabel>التجهيزات والمعدات</SectionLabel>

                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                      <EquipmentTestTypeSelect
                        value={formData.TypeOfStomachTest}
                        handleChange={handleChange}
                      />
                    </div>

                    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
                      <NumberOfEquipment
                        value={formData.NumberOfEquipment}
                        handleChange={handleChange}
                      />
                    </div>
                        <PricingItemsSelector
  value={formData.PricingItemIds || []}
  initialItems={formData.pricingItemsObjects || []}
  entityType="Construction"
  projectId={id}
  token={token}
  branchId={
    userData?.userType?.toLowerCase() === "admin"
      ? formData.BranchId
      : undefined
  }
  onChange={(ids, dtos, totals) => {
    handleChange({
      target: {
        name: "PricingItemIds",
        value: ids,
      },
    });

    handleChange({
      target: {
        name: "pricingItemsObjects",
        value: dtos,
      },
    });

    if (totals) {
      setFormData((prev) => ({
        ...prev,
        EstimatedValue: totals.totalEstimatedValue.toFixed(2),
        ActualValue: totals.totalExecutedValue.toFixed(2),
      }));
    }
  }}
/>
                    {/* Section: السلامة */}
                    <SectionLabel>مخالفات السلامة</SectionLabel>

                    <RadioGroup
                      label="مخالفات السلامة"
                      options={[
                        { label: "يوجد", value: "exists" },
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
                        () => {},
                        () => {},
                        apiData?.projectType || "الإنشاءات"
                      )}

                    <div className="input-group">
                      <textarea
                        name="DescriptionViolation"
                        placeholder="وصف المخالفه"
                        value={formData.DescriptionViolation}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {/* Section: المرفقات — ظاهرة للكل */}
                <SectionLabel>المستندات والمرفقات</SectionLabel>

                {renderUploadSection(
                  "المستندات",
                  "ModelPhotos",
                
                  "تصوير مستندات مع الختم",
                  handleFileChange,
                  fileInputRefs,
                  openFileSelector,
                  fileData,
                  
                  () => {},
                  () => {},
                  true,
                  isContractor,
                  apiData?.projectType || "الإنشاءات"
                )}
                {renderUploadSection(
                  "صور الموقع",
                  "SitePhotos",
                  "صور الموقع",
                  handleFileChange,
                  fileInputRefs,
                  openFileSelector,
                  fileData,
                  () => {},
                  () => {},
                  true,
                  isContractor,
                  apiData?.projectType || "الإنشاءات"
                )}
                {renderUploadSection(
                  "مستندات الاختبار",
                  "TestModels",
                  "مستندات الاختبار",
                  handleFileChange,
                  fileInputRefs,
                  openFileSelector,
                  fileData,
                  () => {},
                  () => {},
                  true,
                  isContractor,
                apiData?.projectType || "الإنشاءات"
                )}

                {/* ===== أزرار الحفظ - ظاهرة للكل ===== */}
                <RequestBtns
                  loading={loading}
                  Situation={formData.Situation}
                  handleSubmit={handleSubmit}
                />

                {/* Tab Nav Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
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
                </div>
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
                    entityType="Construction"
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
}

export default ConstructionFormInput;