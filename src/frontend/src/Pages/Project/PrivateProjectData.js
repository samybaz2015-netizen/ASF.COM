import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import InputField from "../../Component/Input/Input"; 
import { Url } from "../../function/FunctionApi";
import SharedFiles from "./SharedFiles";
import axiosInstance from "../../api/apiClient";

function PrivateProjectData({ data }) {
  const [formData, setFormData] = useState({ ...data });
   const updateUrl = "PrivateProject/update";

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
            label="العميل"
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            placeholder="العميل"
          />
          <InputField
            label="الحي"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="الحي"
          />
        </div>
        <div className=" flex gap-5  mb-4 flex-wrap">
          <InputField
            label="اسم المشروع"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            placeholder="اسم المشروع"
          />
          <InputField
            label="مكان المشروع"
            name="projectPlace"
            value={formData.projectPlace}
            onChange={handleChange}
            placeholder="مكان المشروع"
          />
        </div>
        <div className=" flex gap-5  mb-4 flex-wrap">
          <InputField
            label="قيمة المشروع"
            name="projectValue"
            value={formData.projectValue}
            onChange={handleChange}
            placeholder="قيمة المشروع"
          />

          <InputField
            label="رقم المحطه"
            name="stationNumber"
            value={formData.stationNumber}
            onChange={handleChange}
            placeholder="رقم المحطه"
          />
        </div>
        <InputField
          label="وقت المشروع"
          name="timeOfProject"
          value={formData.timeOfProject}
          onChange={handleChange}
          placeholder="وقت المشروع"
        />
      </div>
      <SharedFiles data={data} onNoteUpdate={() => {}} />
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

export default PrivateProjectData;
