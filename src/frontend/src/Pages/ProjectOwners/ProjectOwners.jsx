import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/apiClient";

const emptyForm = { name: "" };

const ProjectOwners = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");   
    try {
      const res = await axiosInstance.get("/ProjectOwner");
      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name || "" });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("الاسم مطلوب");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await axiosInstance.put(`/ProjectOwner/${editingId}`, form);
      } else {
        await axiosInstance.post("/ProjectOwner", form);
      }
      closeModal();
      fetchItems();
    } catch (err) {
      console.error(err);
      setFormError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/ProjectOwner/${deleteId}`);
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-5 [direction:rtl]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h1 className="text-2xl font-bold text-mainColor">ملاك المشاريع</h1>
        <button
          onClick={openAddModal}
          className="bg-mainColor text-white px-4 py-2 rounded-md hover:opacity-90 transition"
        >
          + إضافة مالك جديد
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-right">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} className="border-t border-gray-200">
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => confirmDelete(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6" dir="rtl">
            <h2 className="text-lg font-bold mb-4 text-mainColor">
              {editingId ? "تعديل المالك" : "إضافة مالك جديد"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  الاسم
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="اسم المالك"
                />
              </div>

              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
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
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-6 text-center" dir="rtl">
            <p className="text-gray-800 mb-5">
              هل أنت متأكد من حذف هذا المالك؟
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-md text-sm border border-gray-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md text-sm bg-red-500 text-white disabled:opacity-60"
              >
                {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOwners;