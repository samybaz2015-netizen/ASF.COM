import React from "react";

const ProjectPartyTable = ({ items, loading, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-right">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">الاسم</th>
            <th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">الفرع</th>
            <th className="px-4 py-3">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500">
                جاري التحميل...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500">
                لا توجد بيانات
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id} className="border-t border-gray-200">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{item.branchName || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
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
  );
};

export default ProjectPartyTable;