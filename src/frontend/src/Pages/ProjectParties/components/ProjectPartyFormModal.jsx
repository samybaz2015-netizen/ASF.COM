import React, { useEffect, useState } from "react";

const TYPES = ["المقاول", "المهندس", "المشرف"];
const emptyForm = { name: "", type: TYPES[0], branchId: "" };

const ProjectPartyFormModal = ({
  open,
  onClose,
  onSubmit,
  initialData,
  branches,
  saving,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            name: initialData.name || "",
            type: initialData.type || TYPES[0],
            branchId: initialData.branchId ?? "",
          }
        : emptyForm
    );
    setFormError("");
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("الاسم مطلوب");
      return;
    }
    if (!form.branchId) {
      setFormError("اختر الفرع");
      return;
    }
    try {
      await onSubmit({ ...form, branchId: Number(form.branchId) });
    } catch (err) {
      console.error(err);
      setFormError("حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6" dir="rtl">
        <h2 className="text-lg font-bold mb-4 text-mainColor">
          {initialData ? "تعديل الجهة" : "إضافة جهة جديدة"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">الاسم</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="اسم الجهة"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">النوع</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">الفرع</label>
            <select
              value={form.branchId}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">اختر الفرع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          {formError && <div className="text-red-600 text-sm">{formError}</div>}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm border border-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md text-sm bg-mainColor text-white disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectPartyFormModal;