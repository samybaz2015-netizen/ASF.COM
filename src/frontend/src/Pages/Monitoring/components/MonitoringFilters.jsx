import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilterCircleXmark, faRotate } from "@fortawesome/free-solid-svg-icons";

const PROJECT_TYPES = [
  ["Construction", "إنشاءات"],
  ["Maintenance", "صيانة"],
  ["Emergency", "طوارئ"],
  ["NewProject", "مشاريع جديدة"],
];

/**
 * فلاتر اللوحة.
 *
 * كلّها اختيارية. بلا فلتر تُعرض كل البيانات التي يحقّ للمستخدم رؤيتها، وهو
 * السلوك الافتراضي — لا شاشة فارغة تنتظر أن يملأ أحدٌ حقلاً ليرى شيئاً.
 *
 * فترتان منفصلتان: فترة **استلام** أمر العمل، وفترة **نشاط** الموظفين. خلطهما
 * في فترة واحدة يجعل قياس نشاط هذا الشهر مقصوراً على أوامر استُلمت فيه.
 */
export function MonitoringFilters({ filter, options, busy, onChange, onReset, onRefresh }) {
  const set = (key) => (event) => onChange({ ...filter, [key]: event.target.value });

  const active = Object.entries(filter).filter(([, v]) => v !== "" && v != null).length;

  // أقسام العقد المختار وحده: عرض أقسام عقد آخر يُربك.
  //
  // المطابقة بمعرّف العقد لا باسمه: الاسم قد يتشابه أو تفصله مسافة.
  const departments = filter.contractId
    ? (options.departments || []).filter(
        (d) => String(d.parentId) === String(filter.contractId)
      )
    : options.departments || [];

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>الفلاتر</h3>
          <p>بلا فلتر تُعرض كل البيانات ضمن صلاحيتك. الفلتر يُضيّق ولا يوسّع.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {active > 0 && (
            <button type="button" className="asf-btn asf-btn--sm" onClick={onReset} disabled={busy}>
              <FontAwesomeIcon icon={faFilterCircleXmark} /> مسح ({active})
            </button>
          )}
          <button type="button" className="asf-btn asf-btn--sm" onClick={onRefresh} disabled={busy}>
            <FontAwesomeIcon icon={faRotate} /> تحديث
          </button>
        </div>
      </header>

      <div className="asf-panel__body">
        <div className="mon-filters">
          <Select label="العقد" value={filter.contractId} onChange={set("contractId")}
                  options={options.contracts} placeholder="كل العقود" />

          <Select label="القسم" value={filter.departmentId} onChange={set("departmentId")}
                  options={departments} placeholder="كل الأقسام" />

          <label className="asf-field">
            <span>نوع المشروع</span>
            <select value={filter.projectTypeCode || ""} onChange={set("projectTypeCode")}>
              <option value="">الكل</option>
              {PROJECT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <Select label="نوع أمر العمل" value={filter.workOrderTypeRefId}
                  onChange={set("workOrderTypeRefId")}
                  options={options.workOrderTypes} placeholder="كل الأنواع" />

          <Select label="المقاول" value={filter.contractorRefId} onChange={set("contractorRefId")}
                  options={options.contractors} placeholder="كل المقاولين" />

          <Select label="الحي" value={filter.districtRefId} onChange={set("districtRefId")}
                  options={options.districts} placeholder="كل الأحياء" />

          <Select label="المرحلة" value={filter.basketStableKey} onChange={set("basketStableKey")}
                  options={options.baskets} placeholder="كل المراحل" />
        </div>

        <div className="mon-periods">
          <fieldset>
            <legend>فترة الاستلام</legend>
            <label className="asf-field">
              <span>من</span>
              <input type="date" value={filter.receivedFrom || ""} onChange={set("receivedFrom")} />
            </label>
            <label className="asf-field">
              <span>إلى</span>
              <input type="date" value={filter.receivedTo || ""} onChange={set("receivedTo")} />
            </label>
          </fieldset>

          <fieldset>
            <legend>فترة نشاط الموظفين</legend>
            <label className="asf-field">
              <span>من</span>
              <input type="date" value={filter.activityFrom || ""} onChange={set("activityFrom")} />
            </label>
            <label className="asf-field">
              <span>إلى</span>
              <input type="date" value={filter.activityTo || ""} onChange={set("activityTo")} />
            </label>
          </fieldset>
        </div>
      </div>
    </section>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  const list = options || [];

  return (
    <label className="asf-field">
      <span>{label}</span>
      <select value={value || ""} onChange={onChange} disabled={list.length === 0}>
        <option value="">{list.length === 0 ? "لا خيارات" : placeholder}</option>
        {list.map((o) => (
          <option key={o.id} value={o.id}>
            {o.group ? `${o.name} — ${o.group}` : o.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default MonitoringFilters;
