import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilterCircleXmark, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

/**
 * فلتر عام لمتابعة التنفيذ.
 *
 * كل حقل اختياري والفارغ لا يقيّد. الصفحة تعرض كل ما يحقّ للمستخدم رؤيته فور
 * فتحها، والفلتر يضيّق النتائج ولا يشترط لظهورها.
 */
export function TrackingFilters({ value, contracts, types, busy, onChange, onSearch, onReset }) {
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.value });

  // زرّ المسح يُعطَّل ما دام لا شيء ليُمسح، فلا يوهم بأن الصفحة تحتاج ضغطه.
  const dirty = Object.values(value).some((v) => v !== "");

  const submit = (event) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <form className="asf-toolbar" onSubmit={submit}>
      <label className="asf-field">
        <span>العقد</span>
        <select value={value.contractId} onChange={set("contractId")}>
          <option value="">كل العقود</option>
          {contracts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.contractNumber} — {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="asf-field">
        <span>نوع أمر العمل</span>
        <select value={value.workOrderTypeId} onChange={set("workOrderTypeId")}>
          <option value="">كل الأنواع</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      <label className="asf-field">
        <span>الاستلام من</span>
        <input type="date" value={value.receivedFrom} onChange={set("receivedFrom")} />
      </label>

      <label className="asf-field">
        <span>إلى</span>
        <input type="date" value={value.receivedTo} onChange={set("receivedTo")} />
      </label>

      <label className="asf-field">
        <span>مكوث أكثر من (يوم)</span>
        <input type="number" min="0" value={value.minDaysInBasket} onChange={set("minDaysInBasket")} />
      </label>

      <label className="asf-field">
        <span>بحث</span>
        <input
          value={value.search}
          onChange={set("search")}
          placeholder="رقم الأمر، الوصف، المقاول، الحي…"
        />
      </label>

      <div className="asf-toolbar__actions">
        <button type="submit" className="asf-btn asf-btn--primary" disabled={busy}>
          <FontAwesomeIcon icon={faMagnifyingGlass} /> بحث
        </button>
        <button
          type="button"
          className="asf-btn"
          onClick={onReset}
          disabled={busy || !dirty}
          title="مسح الفلاتر والعودة إلى كل البيانات المسموحة في هذا القسم"
        >
          <FontAwesomeIcon icon={faFilterCircleXmark} /> مسح الفلاتر
        </button>
      </div>
    </form>
  );
}
