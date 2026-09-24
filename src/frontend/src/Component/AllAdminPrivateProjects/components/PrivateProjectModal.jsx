import React, { useEffect, useState } from "react";
import {
  X,
  Upload,
  Save,
  Loader2,
} from "lucide-react";
import ProjectPhotos from "./ProjectPhotos";

const initialForm = {
  ProjectName: "",
  ProjectPlace: "",
  ContractNumber: "",
  Customer: "",
  Consultant: "",
  Contractor: "",
  ProjectOwner: "",
  ProjectParty: "",
  ProjectValue: "",
  StationNumber: "",
  TimeOfProject: "",
  SafetyViolationsExist: false,
  WorkDescription: "",
  Note: "",
  IsArchived: false,
  OrderDate: "",
  Coordinates: "",
  BranchId: "",
  BranchName: "",
};

const fields = [
  ["ProjectName", "اسم المشروع"],
  ["ProjectPlace", "مكان المشروع"],
  ["ContractNumber", "رقم العقد"],
  ["Customer", "العميل"],
  ["Consultant", "الاستشاري"],
  ["Contractor", "المقاول"],
  ["ProjectOwner", "مالك المشروع"],
  ["ProjectParty", "جهة المشروع"],
  ["ProjectValue", "قيمة المشروع"],
  ["StationNumber", "رقم المحطة"],
  ["TimeOfProject", "مدة المشروع"],
  ["BranchName", "اسم الفرع"],
  ["Coordinates", "الإحداثيات"],
];

const PrivateProjectModal = ({
  open,
  mode,
  project,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(initialForm);

  const [modelPhotos, setModelPhotos] = useState([]);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [safetyPhotos, setSafetyPhotos] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (project) {
      setForm({
        ProjectName:
          project.ProjectName ||
          project.projectName ||
          "",
        ProjectPlace:
          project.ProjectPlace ||
          project.projectPlace ||
          "",
        ContractNumber:
          project.ContractNumber ||
          project.contractNumber ||
          "",
        Customer:
          project.Customer ||
          project.customer ||
          "",
        Consultant:
          project.Consultant ||
          project.consultant ||
          "",
        Contractor:
          project.Contractor ||
          project.contractor ||
          "",
        ProjectOwner:
          project.ProjectOwner ||
          project.projectOwner ||
          "",
        ProjectParty:
          project.ProjectParty ||
          project.projectParty ||
          "",
        ProjectValue:
          project.ProjectValue ||
          project.projectValue ||
          "",
        StationNumber:
          project.StationNumber ||
          project.stationNumber ||
          "",
        TimeOfProject:
          project.TimeOfProject ||
          project.timeOfProject ||
          "",
        SafetyViolationsExist:
          project.SafetyViolationsExist ??
          project.safetyViolationsExist ??
          false,
        WorkDescription:
          project.WorkDescription ||
          project.workDescription ||
          "",
        Note:
          project.Note ||
          project.note ||
          "",
        IsArchived:
          project.IsArchived ??
          project.isArchived ??
          false,
        OrderDate:
          project.OrderDate ||
          project.orderDate ||
          "",
        Coordinates:
          project.Coordinates ||
          project.coordinates ||
          "",
        BranchId:
          project.BranchId ||
          project.branchId ||
          "",
        BranchName:
          project.BranchName ||
          project.branchName ||
          "",
      });

      setModelPhotos(
        project.ModelPhotos ||
          project.modelPhotos ||
          []
      );

      setSitePhotos(
        project.SitePhotos ||
          project.sitePhotos ||
          []
      );

      setSafetyPhotos(
        project.SafetyWastePhotos ||
          project.safetyWastePhotos ||
          []
      );
    } else {
      setForm(initialForm);
      setModelPhotos([]);
      setSitePhotos([]);
      setSafetyPhotos([]);
    }
  }, [open, project]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFiles = (name, files) => {
    const list = Array.from(files || []);

    if (name === "ModelPhotos") {
      setModelPhotos((prev) => [...prev, ...list]);
    }

    if (name === "SitePhotos") {
      setSitePhotos((prev) => [...prev, ...list]);
    }

    if (name === "SafetyWastePhotos") {
      setSafetyPhotos((prev) => [...prev, ...list]);
    }
  };

  const submit = (e) => {
    e.preventDefault();

    onSubmit({
      form,
      modelPhotos,
      sitePhotos,
      safetyPhotos,
    });
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {mode === "edit"
                ? "تعديل المشروع"
                : "إضافة مشروع جديد"}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              أدخل بيانات المشروع والصور المطلوبة
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fields.map(([name, label]) => (
              <div key={name}>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  {label}
                </label>

                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#0F766E]/10"
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                تاريخ الطلب
              </label>

              <input
                type="datetime-local"
                name="OrderDate"
                value={form.OrderDate}
                onChange={handleChange}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0F766E]"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <input
                id="SafetyViolationsExist"
                type="checkbox"
                name="SafetyViolationsExist"
                checked={form.SafetyViolationsExist}
                onChange={handleChange}
                className="h-4 w-4 accent-[#0F766E]"
              />

              <label
                htmlFor="SafetyViolationsExist"
                className="text-sm font-semibold text-slate-600"
              >
                توجد مخالفات سلامة
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <input
                id="IsArchived"
                type="checkbox"
                name="IsArchived"
                checked={form.IsArchived}
                onChange={handleChange}
                className="h-4 w-4 accent-[#0F766E]"
              />

              <label
                htmlFor="IsArchived"
                className="text-sm font-semibold text-slate-600"
              >
                المشروع مؤرشف
              </label>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              وصف العمل
            </label>

            <textarea
              name="WorkDescription"
              value={form.WorkDescription}
              onChange={handleChange}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#0F766E] focus:bg-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              ملاحظات
            </label>

            <textarea
              name="Note"
              value={form.Note}
              onChange={handleChange}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#0F766E] focus:bg-white"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <PhotoUploader
              label="صور الموديل"
              files={modelPhotos}
              onChange={(files) =>
                handleFiles("ModelPhotos", files)
              }
            />

            <PhotoUploader
              label="صور الموقع"
              files={sitePhotos}
              onChange={(files) =>
                handleFiles("SitePhotos", files)
              }
            />

            <PhotoUploader
              label="صور مخلفات السلامة"
              files={safetyPhotos}
              onChange={(files) =>
                handleFiles("SafetyWastePhotos", files)
              }
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#115E59] disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {mode === "edit"
              ? "حفظ التعديلات"
              : "إضافة المشروع"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PhotoUploader = ({
  label,
  files,
  onChange,
}) => {
  return (
    <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-[#0F766E] hover:bg-[#0F766E]/5">
      <Upload
        size={25}
        className="mx-auto mb-2 text-[#0F766E]"
      />

      <div className="text-sm font-bold text-slate-600">
        {label}
      </div>

      <div className="mt-1 text-xs text-slate-400">
        {files.length
          ? `${files.length} صورة`
          : "اضغط لاختيار الصور"}
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />
    </label>
  );
};

export default PrivateProjectModal;