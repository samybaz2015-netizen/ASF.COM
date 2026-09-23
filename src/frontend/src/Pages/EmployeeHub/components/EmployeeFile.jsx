import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faDownload,
  faFileLines,
  faPaperclip,
  faTrash,
  faTriangleExclamation,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/EmployeeHubApi";
import { fmtDate } from "./EmployeesTab";

/** أنواع المستندات — نفس قائمة الخادم. */
const DOC_KINDS = [
  ["Contract", "عقد العمل"],
  ["NationalId", "الهوية"],
  ["Residence", "الإقامة"],
  ["Passport", "جواز السفر"],
  ["Certificate", "شهادة"],
  ["Cv", "السيرة الذاتية"],
  ["Medical", "تأمين/طبي"],
  ["Other", "أخرى"],
];

const kindLabel = (kind) => DOC_KINDS.find(([k]) => k === kind)?.[1] || kind || "أخرى";

/**
 * ملف الموظف: بياناته ومستنداته وإجازاته في صفحة واحدة.
 *
 * المستندات مرفقة بالملف لا بمجلّد منفصل، فمن يفتح الموظف يرى عقده وهويته
 * وتواريخ انتهائها دون بحث في مكان آخر.
 */
export function EmployeeFile({ userId, branches, onBack, onSaved }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docKind, setDocKind] = useState("Other");
  const [docExpiry, setDocExpiry] = useState("");
  const fileRef = useRef(null);

  const fail = (err, fallback) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err, fallback) });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.fetchProfile(userId);
      setProfile(data);
      setForm(toForm(data));
    } catch (err) {
      fail(err, "تعذّر تحميل ملف الموظف.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await api.updateProfile(userId, {
        ...form,
        branchId: form.branchId ? Number(form.branchId) : null,
        salary: form.salary === "" ? null : Number(form.salary),
        annualLeaveBalance:
          form.annualLeaveBalance === "" ? null : Number(form.annualLeaveBalance),
      });

      setProfile(saved);
      setForm(toForm(saved));
      await onSaved?.();

      Swal.fire({ icon: "success", title: "حُفظ", timer: 1400, showConfirmButton: false });
    } catch (err) {
      fail(err, "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadDocument(userId, {
        file,
        kind: docKind,
        expiresAt: docExpiry || null,
      });
      setDocExpiry("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      fail(err, "تعذّر رفع المستند.");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (doc) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: `حذف «${doc.fileName}»؟`,
      text: "يُحذف الملف نهائياً.",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#a33636",
    });

    if (!confirmed.isConfirmed) return;

    try {
      await api.deleteDocument(doc.id);
      await load();
    } catch (err) {
      fail(err, "تعذّر الحذف.");
    }
  };

  if (loading || !form) {
    return (
      <section className="asf-panel">
        <div className="asf-panel__body">
          <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
        </div>
      </section>
    );
  }

  const documents = profile?.documents || [];
  const leaves = profile?.leaves || [];

  return (
    <>
      <section className="asf-panel">
        <header className="asf-panel__head">
          <div>
            <h3>{profile.displayName || profile.userName}</h3>
            <p>
              {[profile.jobTitle, profile.branchName, profile.employeeNumber]
                .filter(Boolean)
                .join(" · ") || "ملف الموظف"}
            </p>
          </div>
          <button type="button" className="asf-btn asf-btn--sm" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowRight} /> رجوع للسجلّ
          </button>
        </header>

        <div className="asf-panel__body">
          <form onSubmit={save}>
            <div className="asf-grid">
              <Field label="الاسم" value={form.displayName} onChange={set(setForm, "displayName")} />
              <Field label="الرقم الوظيفي" value={form.employeeNumber} onChange={set(setForm, "employeeNumber")} />
              <Field label="رقم الهوية" value={form.nationalId} onChange={set(setForm, "nationalId")} />
              <Field label="المسمّى الوظيفي" value={form.jobTitle} onChange={set(setForm, "jobTitle")} />
              <Field label="التخصص" value={form.specialization} onChange={set(setForm, "specialization")} />
              <Field label="المهنة" value={form.profession} onChange={set(setForm, "profession")} />
              <Field label="الجوال" value={form.phoneNumber} onChange={set(setForm, "phoneNumber")} />
              <Field label="البريد الإلكتروني" type="email" value={form.email} onChange={set(setForm, "email")} />
              <Field label="المدينة" value={form.city} onChange={set(setForm, "city")} />

              <label className="asf-field">
                <span>الفرع</span>
                <select value={form.branchId} onChange={set(setForm, "branchId")}>
                  <option value="">بلا فرع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <Field label="تاريخ التعيين" type="date" value={form.hireDate} onChange={set(setForm, "hireDate")} />
              <Field label="تاريخ الميلاد" type="date" value={form.dateOfBirth} onChange={set(setForm, "dateOfBirth")} />
              <Field label="انتهاء الإقامة" type="date" value={form.residenceExpiryDate} onChange={set(setForm, "residenceExpiryDate")} />
              <Field label="تاريخ التخرّج" type="date" value={form.graduationDate} onChange={set(setForm, "graduationDate")} />
              <Field label="نهاية الخدمة" type="date" value={form.endOfServiceDate} onChange={set(setForm, "endOfServiceDate")} />
              <Field label="الراتب" type="number" value={form.salary} onChange={set(setForm, "salary")} />
              <Field label="رصيد الإجازات" type="number" value={form.annualLeaveBalance} onChange={set(setForm, "annualLeaveBalance")} />
              <Field label="سنوات الخبرة" value={form.experienceYears} onChange={set(setForm, "experienceYears")} />

              <label className="asf-field wo-field--wide">
                <span>الشهادات</span>
                <input value={form.certifications} onChange={set(setForm, "certifications")} />
              </label>

              <label className="asf-field wo-field--wide">
                <span>نبذة</span>
                <textarea rows={2} value={form.bio} onChange={set(setForm, "bio")} />
              </label>
            </div>

            <div className="asf-scope" style={{ marginTop: 14, borderBottom: 0, paddingBottom: 0 }}>
              <label className="asf-check">
                <input
                  type="checkbox"
                  checked={form.isActiveEmployee}
                  onChange={(e) => setForm((f) => ({ ...f, isActiveEmployee: e.target.checked }))}
                />
                <span>على رأس العمل</span>
              </label>

              <button type="submit" className="asf-btn asf-btn--primary" disabled={saving}>
                {saving ? "جارٍ الحفظ…" : "حفظ البيانات"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─────────── المستندات ─────────── */}

      <section className="asf-panel" style={{ marginTop: 14 }}>
        <header className="asf-panel__head">
          <div>
            <h3>المستندات</h3>
            <p>العقود والهويات والشهادات، بتواريخ انتهائها.</p>
          </div>
        </header>

        <div className="asf-panel__body">
          <div className="asf-setting-form">
            <label className="asf-field">
              <span>نوع المستند</span>
              <select value={docKind} onChange={(e) => setDocKind(e.target.value)}>
                {DOC_KINDS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="asf-field">
              <span>تاريخ الانتهاء</span>
              <input type="date" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
            </label>

            <label className="asf-field">
              <span>الملف</span>
              <input
                ref={fileRef}
                type="file"
                onChange={upload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              />
            </label>

            <span className="asf-hint">
              <FontAwesomeIcon icon={uploading ? faUpload : faPaperclip} />{" "}
              {uploading ? "جارٍ الرفع…" : "حتى ٢٠ ميغابايت"}
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="asf-empty">
              <FontAwesomeIcon icon={faFileLines} />
              <strong>لا مستندات بعد</strong>
              <span>ارفع العقد والهوية ليكون ملف الموظف مكتملاً.</span>
            </div>
          ) : (
            <div className="asf-table__scroll">
              <table className="asf-table">
                <thead>
                  <tr>
                    <th>الملف</th>
                    <th style={{ width: 120 }}>النوع</th>
                    <th style={{ width: 110 }}>الانتهاء</th>
                    <th style={{ width: 110 }}>الرفع</th>
                    <th style={{ width: 130 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <b>{doc.fileName}</b>
                        {doc.note && <div className="asf-hint">{doc.note}</div>}
                      </td>
                      <td>{kindLabel(doc.kind)}</td>
                      <td className="asf-num">
                        {fmtDate(doc.expiresAt)}
                        {/* التنبيه على الوشيك لا على المنتهي فقط: التجديد
                            يحتاج مهلة. */}
                        {doc.daysToExpiry !== null && doc.daysToExpiry !== undefined && doc.daysToExpiry <= 30 && (
                          <div className={doc.daysToExpiry < 0 ? "asf-error" : "asf-warn"}>
                            <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
                            {doc.daysToExpiry < 0
                              ? `منتهٍ منذ ${Math.abs(doc.daysToExpiry)} يوم`
                              : `${doc.daysToExpiry} يوم`}
                          </div>
                        )}
                      </td>
                      <td className="asf-num">{fmtDate(doc.uploadedAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a
                            className="asf-btn asf-btn--sm"
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FontAwesomeIcon icon={faDownload} /> فتح
                          </a>
                          <button
                            type="button"
                            className="asf-btn asf-btn--sm asf-btn--danger"
                            onClick={() => removeDocument(doc)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ─────────── إجازاته ─────────── */}

      <section className="asf-panel" style={{ marginTop: 14 }}>
        <header className="asf-panel__head">
          <div>
            <h3>الإجازات</h3>
            <p>تنعكس في تقويم الفريق تلقائياً.</p>
          </div>
        </header>

        <div className="asf-panel__body">
          {leaves.length === 0 ? (
            <div className="asf-empty"><strong>لا إجازات مسجّلة</strong></div>
          ) : (
            <div className="asf-table__scroll">
              <table className="asf-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>من</th>
                    <th style={{ width: 110 }}>إلى</th>
                    <th style={{ width: 70 }}>الأيام</th>
                    <th>السبب</th>
                    <th style={{ width: 90 }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="asf-num">{fmtDate(l.from)}</td>
                      <td className="asf-num">{fmtDate(l.to)}</td>
                      <td className="asf-num">{l.numberOfDays}</td>
                      <td>{l.reason || "—"}</td>
                      <td><StatusChip status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function StatusChip({ status }) {
  const tone =
    status === "Approved" || status === "مقبول"
      ? "asf-chip--ok"
      : status === "Rejected" || status === "مرفوض"
      ? "asf-chip--danger"
      : "asf-chip--warn";

  const label =
    status === "Approved" ? "معتمدة" : status === "Rejected" ? "مرفوضة" : status || "معلّقة";

  return <span className={"asf-chip " + tone}>{label}</span>;
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="asf-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} />
    </label>
  );
}

const set = (setter, key) => (event) =>
  setter((f) => ({ ...f, [key]: event.target.value }));

/** القيم الفارغة تصير نصّاً فارغاً: الحقل المضبوط لا يقبل null. */
function toForm(p) {
  const date = (v) => (v ? String(v).slice(0, 10) : "");
  const text = (v) => (v === null || v === undefined ? "" : String(v));

  return {
    displayName: text(p.displayName),
    employeeNumber: text(p.employeeNumber),
    nationalId: text(p.nationalId),
    jobTitle: text(p.jobTitle),
    specialization: text(p.specialization),
    profession: text(p.profession),
    city: text(p.city),
    phoneNumber: text(p.phoneNumber),
    email: text(p.email),
    branchId: p.branchId ? String(p.branchId) : "",
    hireDate: date(p.hireDate),
    dateOfBirth: date(p.dateOfBirth),
    residenceExpiryDate: date(p.residenceExpiryDate),
    graduationDate: date(p.graduationDate),
    endOfServiceDate: date(p.endOfServiceDate),
    salary: p.salary === null || p.salary === undefined ? "" : String(p.salary),
    annualLeaveBalance:
      p.annualLeaveBalance === null || p.annualLeaveBalance === undefined
        ? ""
        : String(p.annualLeaveBalance),
    experienceYears: text(p.experienceYears),
    certifications: text(p.certifications),
    bio: text(p.bio),
    isActiveEmployee: p.isActiveEmployee !== false,
  };
}

export default EmployeeFile;
