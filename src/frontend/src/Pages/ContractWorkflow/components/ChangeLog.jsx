/** ترجمة رموز التغيير إلى عربية مقروءة. */
const LABELS = {
  CreateContract: "إنشاء عقد",
  UpdateContract: "تعديل عقد",
  CreateDepartment: "إضافة قسم",
  UpdateDepartment: "تعديل قسم",
  ReorderDepartments: "ترتيب الأقسام",
  CreateDraft: "فتح مسودة",
  PublishWorkflow: "اعتماد المسار",
  AddBasket: "إضافة سلة",
  UpdateBasket: "تعديل سلة",
  DeleteBasket: "حذف سلة",
  ReorderBaskets: "ترتيب السلال",
  AddTask: "إضافة مهمة",
  UpdateTask: "تعديل مهمة",
  DeleteTask: "حذف مهمة",
  ReorderTasks: "ترتيب المهام",
};

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

/** سجل تعديلات إعدادات العقد: ماذا تغيّر ومن غيّره ومتى. */
export function ChangeLog({ entries, loading }) {
  if (loading) return <p className="cw-empty cw-empty--sm">جارٍ تحميل السجل…</p>;
  if (!entries.length) return <p className="cw-empty cw-empty--sm">لا تغييرات مسجّلة.</p>;

  return (
    <table className="cw-log">
      <thead>
        <tr>
          <th>التغيير</th>
          <th>قبل</th>
          <th>بعد</th>
          <th>بواسطة</th>
          <th>التاريخ</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{LABELS[entry.changeType] || entry.changeType}</td>
            <td className="cw-log__val">{entry.oldValue || "—"}</td>
            <td className="cw-log__val">{entry.newValue || "—"}</td>
            <td>{entry.changedByUserName || entry.changedByUserId}</td>
            <td className="cw-log__date">{formatDate(entry.changedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
