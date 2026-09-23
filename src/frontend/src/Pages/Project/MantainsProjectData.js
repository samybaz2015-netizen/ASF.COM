import React, { useState, useEffect } from "react";
import axios from "axios";
import { officeNameMap } from "../../util/officeConstants";
import SharedFiles from "./SharedFiles";

import { Url } from "../../function/FunctionApi";
import Swal from "sweetalert2";
import axiosInstance from "../../api/apiClient";

function MantainsProjectData({ data }) {
  const [formData, setFormData] = useState({ ...data });
  const updateUrl = "OrderMain/update";

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

        // Send the PUT request
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
        <div>
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

          {/* Other Fields */}
          <div className="input-group">
            <div className="groub_fe">
              <label>المستشار</label>
              <input
                type="text"
                name="consultant"
                placeholder="المستشار"
                value={formData.consultant || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label>المقاول</label>
              <input
                type="text"
                name="contractor"
                placeholder="المقاول"
                value={formData.contractor || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="groub_fe">
              <label>الحي</label>
              <input
                type="text"
                name="district"
                placeholder="الحي"
                value={formData.district || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="groub_fe">
              <label>مده التنفيذ</label>
              <input
                type="text"
                name="durationOfImplementation"
                placeholder="مده التنفيذ"
                value={formData.durationOfImplementation || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label>وصف المشروع</label>
              <input
                type="text"
                name="workDescription"
                placeholder="وصف المشروع"
                value={formData.workDescription || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label>رقم المحطه</label>
              <input
                type="text"
                name="stationNumber"
                placeholder="رقم المحطه"
                value={formData.stationNumber || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="groub_fe">
              <label>القيمه الفعليه</label>
              <input
                type="text"
                name="actualValue"
                placeholder="القيمه الفعليه"
                value={formData.actualValue || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="groub_fe">
              <label>القيمه المقدره</label>
              <input
                type="text"
                name="estimatedValue"
                placeholder="القيمه المقدره"
                value={formData.estimatedValue || ""}
                onChange={handleChange}
                required
              />
            </div>

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

export default MantainsProjectData;
