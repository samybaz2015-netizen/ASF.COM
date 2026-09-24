import React from "react";

function RequestStatus({ handleChange, situation, implementationPhase }) {
  return (
    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
      <div className="groub_fe">
        <label>مرحله التنفيذ</label>
        <select
          name="ImplementationPhase"
          value={implementationPhase}
          onChange={handleChange}
          className="border py-3 w-full"
        >
          <option value="اختر مرحله التنفيذ">اختر مرحله التنفيذ</option>
          <option value="التصاريح">التصاريح</option>
          <option value="مرحله التنفيذ">مرحله التنفيذ</option>
          <option value="مرحله التشغيل">مرحله التشغيل</option>
          <option value="مرحله الاغلاق">مرحله الاغلاق</option>
        </select>
      </div>
      <div className="groub_fe">
        <label>حاله المرحله</label>
        <select
          name="Situation"
          value={situation}
          onChange={handleChange}
          className="border w-full py-3"
        >
          <option value="لم ينشا تصريح">لم ينشا تصريح</option>
          <option value="تم اصدار تصريح">تم اصدار تصريح</option>
          <option value="لا يحتاج تصريح">لا يحتاج تصريح</option>
          <option value="حفر تمديد">حفر تمديد</option>
          <option value="تركيب استبدال معدات">تركيب استبدال معدات</option>
          <option value="عوائق التنفيذ">عوائق التنفيذ</option>
          <option value="تم التنفيذ">تم التنفيذ</option>
          <option value="اختبارات ما قبل التنفيذ">اختبارات ما قبل التنفيذ</option>
          <option value="عوائق التشغيل">عوائق التشغيل</option>
          <option value="نشغيل جزئ">نشغيل جزئ</option>
          <option value="تم التشغيل">تم التشغيل</option>
          <option value="تم اعاده الوضع">تم اعاده الوضع</option>
          <option value="استلام مستندات">استلام مستندات</option>
          <option value="توقيعات موظفين الكهرباء">توقيعات موظفين الكهرباء</option>
          <option value="عمل اشعار">عمل اشعار</option>
          <option value="عمل امر عمل">عمل امر عمل</option>
          <option value="عمل po">عمل po</option>
          <option value="مستخلص">مستخلص</option>
          <option value="تحت التنفيذ">تحت التنفيذ</option>
          <option value="تم التنفيذ">تم التنفيذ</option>
          <option value="صدور شهادة الإنجاز">صدور شهادة الإنجاز</option>
          <option value="دخلت مستخلص">دخلت مستخلص</option>
          <option value="تم الصرف">تم الصرف</option>
        </select>
      </div>
    </div>
  );
}

export default RequestStatus;
