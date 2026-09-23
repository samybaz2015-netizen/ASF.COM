import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHelmetSafety } from "@fortawesome/free-solid-svg-icons";

import { WorkItemsPicker } from "./components/WorkItemsPicker";
import * as api from "../../services/WorkOrderCreateApi";

import "../../styles/asf-ui.css";
import "./WorkOrderCreate.css";

const PRIORITIES = ["عادية", "عاجلة", "حرجة"];
const VOLTAGES = [
  { value: "LV", label: "جهد منخفض LV" },
  { value: "MV", label: "جهد متوسط MV" },
];
const ATTACHMENT_KINDS = ["تقارير الاختبارات", "المخططات", "الصور", "مستندات أخرى"];

const EMPTY = {
  taskNumber: "",
  workOrderCode: "",
  workDescription: "",
  orderType: "إنشاءات",
  priority: "عادية",
  voltageLevel: "",
  workOrderType: "",
  branchId: "",
  office: "",
  district: "",
  projectPlace: "",
  plotNumber: "",
  planNumber: "",
  subscriberName: "",
  stationNumber: "",
  consultant: "",
  contractor: "",
  contractNumber: "",
  faultNumber: "",
  orderDate: new Date().toISOString().slice(0, 10),
  duration: "30",
  approvalDate: "",
  note: "",
};

const money = (value) =>
  Number(value || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * قالب إنشاء أمر عمل الإنشاءات.
 *
 * القيم المحسوبة لا تُدخَل يدوياً: تاريخ التسليم من الإسناد والمدة، والقيمة
 * التقديرية من مجموع بنود الأعمال، والقيمة الفعلية ونسبة الإنجاز من التحديث
 * اليومي. إدخالها يدوياً يسمح برقم يناقض مصدره.
 */
function ConstructionCreatePage() {
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [items, setItems] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [attachmentKind, setAttachmentKind] = useState(ATTACHMENT_KINDS[0]);
  const [saving, setSaving] = useState(false);

  const [lookups, setLookups] = useState({
    branches: [],
    offices: [],
    districts: [],
    contractors: [],
    consultants: [],
    contracts: [],
    types: [],
  });

  const set = (key) => (event) =>
    setValues((v) => ({ ...v, [key]: event.target.value }));

  useEffect(() => {
    Promise.all([
      api.fetchBranches(),
      api.fetchContracts(),
    ])
      .then(([branches, contracts]) =>
        setLookups((prev) => ({ ...prev, branches, contracts }))
      )
      .catch(() => {});
  }, []);

  // القوائم تتبع العقد المختار.
  //
  // قبل اختياره تُعرض القيم العامة وحدها، وبعده تنضمّ إليها قيم العقد. جلبها
  // مرّة واحدة عند فتح الصفحة كان يُظهر قوائم لا تخصّ العقد الذي اختاره.
  useEffect(() => {
    const contract = lookups.contracts.find((c) => c.contractNumber === values.contractNumber);
    const contractId = contract?.id;

    let cancelled = false;

    Promise.all([
      api.fetchWorkOrderTypes(contractId),
      api.fetchNeighborhoods(contractId),
      api.fetchContractors(contractId),
      api.fetchOfficeValues(contractId),
      api.fetchConsultantValues(contractId),
    ])
      .then(([types, districts, contractors, offices, consultants]) => {
        if (!cancelled) {
          setLookups((prev) => ({ ...prev, types, districts, contractors, offices, consultants }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLookups((prev) => ({
            ...prev,
            types: [], districts: [], contractors: [], offices: [], consultants: [],
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [values.contractNumber, lookups.contracts]);

  /** تاريخ التسليم المتوقّع = الإسناد + المدة. */
  const expectedDelivery = useMemo(() => {
    if (!values.orderDate) return "—";
    const days = Number(values.duration);
    if (!Number.isFinite(days)) return "—";
    const d = new Date(values.orderDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }, [values.orderDate, values.duration]);

  const estimatedValue = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [items]
  );

  const submit = useCallback(
    async (isDraft) => {
      const missing = [];
      if (!values.faultNumber.trim()) missing.push("رقم أمر العمل");
      if (!values.workDescription.trim()) missing.push("وصف أمر العمل");
      if (!values.branchId) missing.push("الإدارة");
      if (!values.office) missing.push("المكتب");
      if (!values.district) missing.push("الحي");
      if (!values.contractor) missing.push("اسم المقاول");

      // المسودة تُحفظ ناقصة عمداً — غايتها متابعة العمل لاحقاً.
      if (!isDraft && missing.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "حقول مطلوبة ناقصة",
          html: missing.map((m) => `• ${m}`).join("<br>"),
        });
        return;
      }

      if (!isDraft && !values.faultNumber.trim()) return;

      setSaving(true);
      try {
        const result = await api.createConstruction({
          ...values,
          items,
          attachments,
          isDraft,
        });

        Swal.fire({
          icon: "success",
          title: isDraft ? "حُفظت المسودة" : "أُنشئ أمر العمل",
          text: isDraft ? "" : "دخل أول سلة في مسار العقد تلقائياً.",
          timer: 2200,
          showConfirmButton: false,
        });

        const id = result?.data?.id;
        navigate(id ? `/project/construction/${id}` : "/execution-tracking");
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "تعذّر الحفظ",
          text: api.errorMessage(err, "خطأ غير متوقع."),
        });
      } finally {
        setSaving(false);
      }
    },
    [values, items, attachments, navigate]
  );

  return (
    <>
      
      <main className="asf">
        <div className="asf-page wo-page">
          {/* ١ — بيانات أمر العمل */}
          <Section number={1} title="بيانات أمر العمل" subtitle="البيانات الأساسية الخاصة بقالب الإنشاءات.">
            <div className="wo-grid">
              <Field label="رقم الطلب / رقم المهمة">
                <input value={values.taskNumber} onChange={set("taskNumber")} />
              </Field>

              <Field label="رقم أمر العمل" required>
                <input value={values.faultNumber} onChange={set("faultNumber")} inputMode="numeric" />
              </Field>

              <Field label="رمز أمر العمل">
                <input value={values.workOrderCode} onChange={set("workOrderCode")} />
              </Field>

              <Field label="نوع/تصنيف العمل" required>
                <select value={values.workOrderType} onChange={set("workOrderType")}>
                  <option value="">اختر النوع</option>
                  {lookups.types.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="الأولوية">
                <select value={values.priority} onChange={set("priority")}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field
                label="الجهد"
                hint="يحدّد أي سلة من «تطبيقات LV / تطبيقات MV» تظهر لأمر العمل في المسار."
              >
                <select value={values.voltageLevel} onChange={set("voltageLevel")}>
                  <option value="">اختر الجهد</option>
                  {VOLTAGES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="وصف أمر العمل" required wide>
                <textarea value={values.workDescription} onChange={set("workDescription")} rows={3} />
              </Field>

              <Field label="الإدارة" required>
                <select value={values.branchId} onChange={set("branchId")}>
                  <option value="">اختر الإدارة</option>
                  {lookups.branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="المكتب" required>
                <select value={values.office} onChange={set("office")}>
                  <option value="">اختر المكتب</option>
                  {lookups.offices.map((o) => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="الحي" required>
                <select value={values.district} onChange={set("district")}>
                  <option value="">اختر الحي</option>
                  {lookups.districts.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="الموقع">
                <input value={values.projectPlace} onChange={set("projectPlace")} placeholder="اختياري" />
              </Field>

              <Field label="رقم القطعة">
                <input value={values.plotNumber} onChange={set("plotNumber")} />
              </Field>

              <Field label="رقم المخطط">
                <input value={values.planNumber} onChange={set("planNumber")} />
              </Field>

              <Field label="اسم المشترك">
                <input value={values.subscriberName} onChange={set("subscriberName")} />
              </Field>

              <Field label="رقم المحطة">
                <input value={values.stationNumber} onChange={set("stationNumber")} />
              </Field>

              <Field label="الاستشاري الرئيسي">
                <select value={values.consultant} onChange={set("consultant")}>
                  <option value="">اختر الاستشاري الرئيسي</option>
                  {lookups.consultants.map((c) => (
                    <option key={c.id} value={c.displayName || c.userName}>
                      {c.displayName || c.userName}
                    </option>
                  ))}
                </select>
              </Field>

              {/* اسم المقاول بدل «الاستشاري المشرف» — الإشراف عندنا للاستشاري نفسه. */}
              <Field label="اسم المقاول" required>
                <select value={values.contractor} onChange={set("contractor")}>
                  <option value="">اختر المقاول</option>
                  {lookups.contractors.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="رقم العقد">
                <select value={values.contractNumber} onChange={set("contractNumber")}>
                  <option value="">اختر رقم العقد</option>
                  {lookups.contracts.map((c) => (
                    <option key={c.id} value={c.contractNumber}>
                      {c.contractNumber} — {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ٢ — القيم المالية والمدد */}
          <Section
            number={2}
            title="القيم المالية والمدد والإنجاز"
            subtitle="تُحسب القيم والتاريخ المتوقّع تلقائياً ولا تُدخَل يدوياً."
          >
            <div className="wo-grid">
              <Field label="تاريخ الإسناد">
                <input type="date" value={values.orderDate} onChange={set("orderDate")} />
              </Field>

              <Field label="مدة التنفيذ (أيام)">
                <input type="number" min="0" value={values.duration} onChange={set("duration")} />
              </Field>

              <Field label="تاريخ التسليم المتوقع" hint="يُحسب من تاريخ الإسناد ومدة التنفيذ.">
                <input value={expectedDelivery} readOnly className="wo-readonly" />
              </Field>

              <Field label="تاريخ الاعتماد" hint="اختياري وليس إجبارياً عند الإنشاء.">
                <input type="date" value={values.approvalDate} onChange={set("approvalDate")} />
              </Field>

              <Field label="تاريخ الإدخال" hint="يُسجَّل تلقائياً بتاريخ اليوم ولا يمكن تعديله.">
                <input value={new Date().toISOString().slice(0, 10)} readOnly className="wo-readonly" />
              </Field>

              <Field label="القيمة التقديرية" hint="مجموع بنود الأعمال أدناه.">
                <input value={`${money(estimatedValue)} ر.س`} readOnly className="wo-readonly" />
              </Field>

              <Field label="القيمة الفعلية / المنفذة" hint="تبدأ بصفر وتزداد من التحديث اليومي.">
                <input value="0.00 ر.س" readOnly className="wo-readonly" />
              </Field>

              <Field label="نسبة الإنجاز" hint="تُحسب من الكميات المنفَّذة.">
                <input value="0%" readOnly className="wo-readonly" />
              </Field>
            </div>
          </Section>

          {/* ٣ — بنود الأعمال */}
          <Section
            number={3}
            title="بنود الأعمال"
            subtitle="اختر البند من ملحق الأسعار المعتمد: الوصف والوحدة والسعر تُحدَّد تلقائياً من البند ولا تُدخَل يدوياً."
          >
            <WorkItemsPicker branchId={values.branchId} items={items} onChange={setItems} />
          </Section>

          {/* ٤ — المرفقات */}
          <Section
            number={4}
            title="المرفقات"
            subtitle="اختياري — ارفع مستندات أمر العمل الآن أو لاحقاً من صفحة التفاصيل. المرفقات لا تُحفظ مع المسودة."
          >
            <div className="wo-grid">
              <Field label="مسمى المرفق">
                <select value={attachmentKind} onChange={(e) => setAttachmentKind(e.target.value)}>
                  {ATTACHMENT_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Field>

              <Field label="الملفات">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments([...(e.target.files || [])])}
                />
              </Field>
            </div>

            <p className="asf-hint">
              {attachments.length === 0
                ? "لم تُختَر مرفقات — هذا القسم اختياري."
                : `${attachments.length} ملف جاهز للإرفاق.`}
            </p>
          </Section>

          {/* ٥ — ملاحظات */}
          <Section number={5} title="ملاحظات الطلب" subtitle="اختياري">
            <Field label="ملاحظات الطلب" wide>
              <textarea value={values.note} onChange={set("note")} rows={4} />
            </Field>
          </Section>

          <div className="wo-actions">
            <button type="button" className="asf-btn" onClick={() => navigate(-1)} disabled={saving}>
              إلغاء
            </button>
            <button type="button" className="asf-btn" onClick={() => submit(true)} disabled={saving}>
              حفظ كمسودة
            </button>
            <button
              type="button"
              className="asf-btn asf-btn--primary"
              onClick={() => submit(false)}
              disabled={saving}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ أمر العمل"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

function Section({ number, title, subtitle, children }) {
  return (
    <section className="wo-section">
      <header className="wo-section__head">
        <span className="wo-section__num">{number}</span>
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      <div className="wo-section__body">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, wide, children }) {
  return (
    <label className={"asf-field" + (wide ? " wo-field--wide" : "")}>
      <span>
        {label}
        {required && <b className="wo-req">*</b>}
      </span>
      {children}
      {hint && <em className="wo-hint">{hint}</em>}
    </label>
  );
}

export default ConstructionCreatePage;
