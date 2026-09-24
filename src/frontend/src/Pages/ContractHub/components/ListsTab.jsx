import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faCheck,
  faEye,
  faEyeSlash,
  faFilter,
  faPlus,
  faTableCells,
  faTrash,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

import * as setup from "../../../services/ContractSetupApi";

const EMPTY = { name: "", code: "", departmentId: "" };

/**
 * القوائم الأربع. كلّها نفس البنية — اسم ورمز وإدارة تابعة — فتُعرض بمكوّن
 * واحد لا بأربع شاشات متطابقة تتباعد مع أول تعديل على إحداها.
 */
export const LIST_CATEGORIES = {
  WorkOrderType: {
    title: "أنواع أوامر العمل",
    nameLabel: "الاسم",
    namePlaceholder: "مثال: إيصال",
    hasCode: true,
    seedable: true,
  },
  WorkOrderCode: {
    title: "رموز أوامر العمل",
    nameLabel: "الرمز",
    namePlaceholder: "مثال: UG-01",
    hasCode: false,
  },
  District: {
    title: "الأحياء",
    nameLabel: "اسم الحي",
    namePlaceholder: "مثال: حي النزهة",
    hasCode: true,
  },
  Contractor: {
    title: "المقاولون",
    nameLabel: "اسم المقاول",
    namePlaceholder: "مثال: مؤسسة النور للمقاولات",
    hasCode: true,
  },
  Consultant: {
    title: "الاستشاريون",
    nameLabel: "اسم الاستشاري",
    namePlaceholder: "مثال: مكتب الخبرة الهندسية",
    hasCode: true,
  },
  Office: {
    title: "المكاتب",
    nameLabel: "اسم المكتب",
    namePlaceholder: "مثال: مكتب جدة",
    hasCode: true,
  },
  ProjectOwner: {
    title: "ملاك المشاريع",
    nameLabel: "اسم المالك",
    namePlaceholder: "مثال: أمانة جدة",
    hasCode: true,
  },
  ProjectParty: {
    title: "جهات المشاريع",
    nameLabel: "اسم الجهة",
    namePlaceholder: "مثال: الشركة السعودية للكهرباء",
    hasCode: true,
  },
};

/**
 * قوائم العقد: أنواع أوامر العمل.
 *
 * تُعرض بطاقاتٍ في شبكة لا صفوفَ جدول: القيمة سطرٌ واحد قصير، فالجدول يهدر
 * عرض الشاشة على عمودين ويُطيل التمرير. كل بطاقة تحمل إجراءاتها بجانبها —
 * تفعيل، ترتيب، إخفاء، حذف — فلا قائمة منسدلة تُخفي ما يمكن فعله.
 */
export function ListsTab({ category, contract, contractId, departments, types, busy, onChanged }) {
  const meta = LIST_CATEGORIES[category] || LIST_CATEGORIES.WorkOrderType;

  const [form, setForm] = useState(EMPTY);
  const [scope, setScope] = useState("all");
  const [working, setWorking] = useState(false);

  const disabled = busy || working;

  const fail = (err, fallback) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: setup.errorMessage(err, fallback) });

  // الترتيب المعروض هو ترتيب القاعدة نفسه، فما يراه المستخدم هو ما سيُصدَّر.
  const sorted = useMemo(
    () => [...types].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [types]
  );

  /**
   * التصفية بالإدارة.
   *
   * «all» تعرض كل ما يخصّ العقد. واختيار إدارة يعرض قيمها **والقيم العامة**
   * معاً، لأن القيمة العامة متاحة داخل تلك الإدارة فعلاً — إخفاؤها يوهم أن
   * الإدارة أفقر مما هي، فتُضاف القيمة مرّة ثانية.
   */
  const ordered = useMemo(() => {
    if (scope === "all") return sorted;
    if (scope === "general") return sorted.filter((x) => !x.departmentId);

    const id = Number(scope);
    return sorted.filter((x) => x.departmentId === id || !x.departmentId);
  }, [sorted, scope]);

  const departmentName = (id) =>
    departments.find((d) => d.id === id)?.name || null;

  const run = async (action, fallback) => {
    setWorking(true);
    try {
      await action();
      await onChanged?.();
      return true;
    } catch (err) {
      fail(err, fallback);
      return false;
    } finally {
      setWorking(false);
    }
  };

  const add = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const ok = await run(
      () =>
        setup.addType(contractId, {
          category,
          name,
          code: form.code.trim() || null,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          isActive: true,
        }),
      "تعذّرت إضافة القيمة."
    );

    if (ok) setForm(EMPTY);
  };

  /** التفعيل والإخفاء وجهان لنفس الحقل، فيمرّان بنفس الطريق. */
  const setActive = (item, isActive) =>
    run(
      () =>
        setup.updateType(item.id, {
          category: item.category || category,
          name: item.name,
          code: item.code || null,
          description: item.description || null,
          departmentId: item.departmentId ?? null,
          isActive,
        }),
      "تعذّر تعديل القيمة."
    );

  /**
   * التحريك يُرسل القائمة كاملةً لا المعروضة: الترتيب خاصية القائمة نفسها،
   * فلو أُرسلت المصفّاة وحدها لأعاد الخادم ترقيم المخفيّ خلفها عشوائياً.
   */
  const move = (index, step) => {
    const target = index + step;
    if (target < 0 || target >= ordered.length) return;

    const ids = sorted.map((x) => x.id);
    const from = ids.indexOf(ordered[index].id);
    const to = ids.indexOf(ordered[target].id);
    if (from < 0 || to < 0) return;

    [ids[from], ids[to]] = [ids[to], ids[from]];

    return run(() => setup.reorderTypes(contractId, ids, category), "تعذّر تغيير الترتيب.");
  };

  const remove = async (item) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: `حذف «${item.name}»؟`,
      text: "الحذف نهائي. لإيقاف استعمالها مؤقتاً استخدم «إخفاء».",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#a33636",
    });

    if (confirmed.isConfirmed) await run(() => setup.deleteType(item.id), "تعذّر الحذف.");
  };

  const seed = async () => {
    const construction = departments.find((d) => d.projectTypeCode === "Construction");
    if (!construction) {
      Swal.fire({ icon: "info", title: "لا يوجد قسم إنشاءات في هذا العقد" });
      return;
    }
    await run(() => setup.seedTypes(contractId, construction.id), "تعذّرت إضافة الأنواع المعتادة.");
  };

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>{meta.title}</h3>
          {/* العقد مذكور صراحةً: القوائم تخصّ عقداً بعينه، وبلا ذكره يظنّها
              المستخدم عامّة على النظام كلّه. */}
          <p>
            {contract
              ? `${contract.contractNumber} · ${contract.name}`
              : "القيم النشطة المستخدمة في نماذج أوامر العمل"}
          </p>
        </div>
        {meta.seedable && (
          <button type="button" className="asf-btn asf-btn--sm" onClick={seed} disabled={disabled}>
            <FontAwesomeIcon icon={faWandMagicSparkles} /> الأنواع المعتادة
          </button>
        )}
      </header>

      <div className="asf-panel__body">
        {departments.length > 0 && (
          <div className="asf-scope">
            <span className="asf-scope__label">
              <FontAwesomeIcon icon={faFilter} /> الإدارة
            </span>

            <button
              type="button"
              className={"asf-scope__btn" + (scope === "all" ? " asf-scope__btn--active" : "")}
              onClick={() => setScope("all")}
            >
              الكل <b>{sorted.length}</b>
            </button>

            <button
              type="button"
              className={"asf-scope__btn" + (scope === "general" ? " asf-scope__btn--active" : "")}
              onClick={() => setScope("general")}
            >
              قيم عامة <b>{sorted.filter((x) => !x.departmentId).length}</b>
            </button>

            {departments.map((d) => (
              <button
                key={d.id}
                type="button"
                className={"asf-scope__btn" + (scope === String(d.id) ? " asf-scope__btn--active" : "")}
                onClick={() => setScope(String(d.id))}
              >
                {d.name} <b>{sorted.filter((x) => x.departmentId === d.id).length}</b>
              </button>
            ))}
          </div>
        )}

        {departments.length === 0 && (
          <p className="asf-hint" style={{ marginBottom: 10 }}>
            هذا العقد بلا إدارات بعد، فكل قيمة تُضاف هنا ستكون قيمةً عامة. أضف
            الإدارات من «مراحل خط سير العقد الموحد» لربط القيم بها.
          </p>
        )}

        <form
          className="asf-setting-form"
          onSubmit={add}
          style={meta.hasCode ? undefined : { gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto" }}
        >
          <label className="asf-field">
            <span>{meta.nameLabel}</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={meta.namePlaceholder}
              required
            />
          </label>

          {meta.hasCode && (
            <label className="asf-field">
              <span>الرمز</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="اختياري"
              />
            </label>
          )}

          <label className="asf-field">
            <span>الإدارة التابعة</span>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              disabled={departments.length === 0}
            >
              <option value="">اتركه فارغاً للقيم العامة</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="asf-btn asf-btn--primary" disabled={disabled}>
            <FontAwesomeIcon icon={faPlus} /> إضافة
          </button>
        </form>

        {ordered.length === 0 ? (
          <div className="asf-empty">
            <FontAwesomeIcon icon={faTableCells} />
            <strong>لا قيم في هذه القائمة</strong>
            <span>
              أضف قيمة من الصفّ أعلاه
              {meta.seedable ? "، أو استعمل «الأنواع المعتادة»." : "."}
            </span>
          </div>
        ) : (
          <div className="asf-values">
            {ordered.map((item, index) => {
              const scope = departmentName(item.departmentId) || "قيمة عامة";

              return (
                <article
                  key={item.id}
                  className={"asf-values__item" + (item.isActive ? "" : " asf-values__item--off")}
                >
                  <button
                    type="button"
                    className="asf-values__mark"
                    onClick={() => setActive(item, !item.isActive)}
                    disabled={disabled}
                    title={item.isActive ? "مفعّلة" : "مخفيّة"}
                  >
                    <FontAwesomeIcon icon={item.isActive ? faCheck : faEyeSlash} />
                  </button>

                  <div className="asf-values__body">
                    <strong title={item.name}>{item.name}</strong>
                    <small>
                      {scope}
                      {item.code ? ` · ${item.code}` : ""}
                    </small>
                  </div>

                  <div className="asf-values__acts">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={disabled || index === 0}
                      title="أعلى"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={disabled || index === ordered.length - 1}
                      title="أسفل"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActive(item, !item.isActive)}
                      disabled={disabled}
                    >
                      <FontAwesomeIcon icon={item.isActive ? faEyeSlash : faEye} />{" "}
                      {item.isActive ? "إخفاء" : "إظهار"}
                    </button>
                    <button
                      type="button"
                      className="asf-values__del"
                      onClick={() => remove(item)}
                      disabled={disabled}
                    >
                      <FontAwesomeIcon icon={faTrash} /> حذف
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ListsTab;
