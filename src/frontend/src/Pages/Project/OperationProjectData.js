import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import InputField from "../../Component/Input/Input";
import { Url } from "../../function/FunctionApi";
import SharedFiles from "./SharedFiles";
import axiosInstance from "../../api/apiClient";

function OperationProjectData({ data }) {
  const [formData, setFormData] = useState({ ...data });
   const updateUrl = "OperationsAndMaintenaceRequest/update";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const confirmation = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: "هل تريد تحديث البيانات؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "نعم، قم بالتحديث!",
        cancelButtonText: "إلغاء",
      });

      if (confirmation.isConfirmed) {
        // Create FormData object
        const formDataToSend = new FormData();

        for (const key in formData) {
          if (formData.hasOwnProperty(key)) {
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            formDataToSend.append(capitalizedKey, formData[key]);
          }
        }
 

        // formDataToSend.append("FaultNumber", '');

      const response = await axiosInstance.put(updateUrl, formDataToSend, {
         headers: { "Content-Type": "multipart/form-data" },
       });

        // Success alert in Arabic
        await Swal.fire({
          title: "تم التحديث!",
          text: "تم تحديث البيانات بنجاح.",
          icon: "success",
          confirmButtonText: "موافق",
        });
      } else {
        Swal.fire({
          title: "تم الإلغاء",
          text: "لم يتم تحديث البيانات.",
          icon: "info",
          confirmButtonText: "موافق",
        });
      }
    } catch (error) {
      console.error("Error updating data", error);

      // Error alert in Arabic
      Swal.fire({
        title: "خطأ!",
        text: "فشل تحديث البيانات. يرجى المحاولة مرة أخرى.",
        icon: "error",
        confirmButtonText: "موافق",
      });
    }
  };

  return (
    <>
      <div className="w-full">
        {/* Branch Name */}
        <div className="input-group">
          <div className="groub_fe">
            <label>الفرع</label>
            <select
              name="branchName"
              className="selectSituation"
              onChange={handleChange}
              value={formData.branchName}
            >
              <option value="" disabled>
                اختر الفرع
              </option>
              <option value="Riyadh">الرياض</option>
              <option value="Hail">جدة</option>
            </select>
          </div>
        </div>

        {/* Office */}
        <div className="input-group">
          <div className="groub_fe">
            <label>المكتب</label>
            <select
              name="office"
              className="selectSituation"
              onChange={handleChange}
              value={formData.office}
            >
              <option value="" disabled>
                اختر المكتب
              </option>
              {formData.branchName === "Riyadh" ? (
                <>
                  <option value="Khurais">خريص</option>
                  <option value="North">الشمال</option>
                  <option value="East">الشرق</option>
                  <option value="South">الجنوب</option>
                  <option value="Diriyah">الدرعية</option>
                </>
              ) : (
                <>
                  <option value="Hail">الحائل</option>
                  <option value="Baqaa">بقعاء</option>
                  <option value="Al Ghazalah">الغزاله</option>
                  <option value="Al Hulayfah">الحليفه</option>
                  <option value="Moqaq">موقق</option>
                  <option value="Al Shumli">الشملي</option>
                  <option value="Al Shanan">الشنان</option>
                  <option value="Al Qaed">القاعد</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Reusable Input Fields */}
        <div className="flex gap-5 flex-wrap mb-4">
          <InputField
            label="المستشار"
            name="consultant"
            value={formData.consultant}
            onChange={handleChange}
            placeholder="المستشار"
          />
          <InputField
            label="المقاول"
            name="contractor"
            value={formData.contractor}
            onChange={handleChange}
            placeholder="المقاول"
          />
          <InputField
            label="الحي"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="الحي"
          />
        </div>
        <div className="flex gap-5 flex-wrap mb-4">
          <InputField
            label="مده التنفيذ"
            name="durationOfImplementation"
            value={formData.durationOfImplementation}
            onChange={handleChange}
            placeholder="مده التنفيذ"
          />
          <InputField
            label="وصف المشروع"
            name="workDescription"
            value={formData.workDescription}
            onChange={handleChange}
            placeholder="وصف المشروع"
          />
          <InputField
            label="رقم المحطه"
            name="stationNumber"
            value={formData.stationNumber}
            onChange={handleChange}
            placeholder="رقم المحطه"
          />
        </div>
        <div className="flex gap-5 flex-wrap mb-4">
          <InputField
            label="القيمه الفعليه"
            name="actualValue"
            value={formData.actualValue}
            onChange={handleChange}
            placeholder="القيمه الفعليه"
          />
          <InputField
            label="القيمه المقدره"
            name="estimatedValue"
            value={formData.estimatedValue}
            onChange={handleChange}
            placeholder="القيمه المقدره"
          />
        </div>

        {/* Situation Select */}
        <div className="input-group">
          <div className="groub_fe">
            <label>موقف التنفيذ</label>
            <select
              name="situation"
              className="selectSituation"
              onChange={handleChange}
              value={formData.situation}
            >
              <option value="" disabled>
                اختر الحالة
              </option>
              <option value="pending">جاري</option>
              <option value="finish">تم التنفيذ</option>
              <option value="notFinished">لم يتم التنفيذ</option>
            </select>
          </div>
        </div>
      </div>

      <SharedFiles data={formData} onNoteUpdate={() => {}} />


      <div className="input-group">
        <textarea
          name="note"
          placeholder="ملاحظات"
          value={formData.note}
          onChange={handleChange}
          style={{ width: "100%", minHeight: "100px", padding: "10px" }}
        />
      </div>
      <button
        onClick={handleSubmit}
        className="bg-green-600 w-[90%] text-white rounded-md mb-4 px-4 py-2"
      >
        تعديل
      </button>
    </>
  );
}

export default OperationProjectData;
