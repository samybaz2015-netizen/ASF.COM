import React from "react";

const DeleteConfirmModal = ({ open, onCancel, onConfirm, deleting }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 text-center" dir="rtl">
        <p className="text-gray-800 mb-5">هل أنت متأكد من حذف هذه الجهة؟</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm border border-gray-300"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-md text-sm bg-red-500 text-white disabled:opacity-60"
          >
            {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;