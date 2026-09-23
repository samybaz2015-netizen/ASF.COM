import { useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPen, faPlus } from "@fortawesome/free-solid-svg-icons";

import * as flow from "../../../services/ContractWorkflowApi";
import { CONTRACT_KINDS, kindLabel } from "../../../services/ContractSetupApi";

const KIND_CHIP = {
  Unified: "asf-chip--info",
  Private: "asf-chip--gold",
  Other: "asf-chip",
};

/**
 * عقود الاستشاري: العقد الموحد وعقود خاصة وأعمال أخرى.
 *
 * اختيار العقد هنا يحكم بقية التبويبات، فكل الإعدادات تُقرأ في سياق عقد واحد.
 */
export function ContractsTab({ contracts, selectedId, busy, onSelect, onChanged }) {
  const [editing, setEditing] = useState(null); // null | "new" | id

  const fail = (err) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: flow.errorMessage(err, "خطأ غير متوقع.") });

  const save = async (values, contractId) => {
    try {
      if (contractId) await flow.updateContract(contractId, values);
      else {
        const created = await flow.createContract(values);
        onSelect(created.id);
      }
      setEditing(null);
      await onChanged();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>العقود</h3>
          <p>العقد الموحد وعقوده الخاصة والأعمال الأخرى. اختر عقداً لتظهر إعداداته في بقية التبويبات.</p>
        </div>
        <button
          type="button"
          className="asf-btn asf-btn--primary asf-btn--sm"
          onClick={() => setEditing("new")}
          disabled={busy}
        >
          <FontAwesomeIcon icon={faPlus} /> عقد جديد
        </button>
      </header>

      <div className="asf-panel__body">
        {editing === "new" && (
          <ContractForm onCancel={() => setEditing(null)} onSubmit={(values) => save(values)} />
        )}

        {contracts.length === 0 && editing !== "new" ? (
          <div className="asf-empty">
            <strong>لا عقود بعد</strong>
            <span>أنشئ العقد الموحد لتبدأ بتعريف أقسامه وسلاله.</span>
          </div>
        ) : (
          <div className="asf-grid">
            {contracts.map((contract) =>
              editing === contract.id ? (
                <div key={contract.id} style={{ gridColumn: "1 / -1" }}>
                  <ContractForm
                    initial={contract}
                    onCancel={() => setEditing(null)}
                    onSubmit={(values) => save(values, contract.id)}
                  />
                </div>
              ) : (
                <article
                  key={contract.id}
                  className="asf-panel"
                  style={{
                    margin: 0,
                    borderColor: contract.id === selectedId ? "#bc915c" : undefined,
                    background: contract.id === selectedId ? "#fffaf3" : undefined,
                  }}
                >
                  <div className="asf-panel__body" style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span className={"asf-chip " + (KIND_CHIP[contract.kind] || "")}>
                        {kindLabel(contract.kind)}
                      </span>
                      {!contract.isActive && <span className="asf-chip">معطّل</span>}
                      {contract.id === selectedId && (
                        <span className="asf-chip asf-chip--ok">
                          <FontAwesomeIcon icon={faCheck} /> المختار
                        </span>
                      )}
                      <button
                        type="button"
                        className="asf-icon-btn"
                        title="تعديل"
                        style={{ marginInlineStart: "auto" }}
                        onClick={() => setEditing(contract.id)}
                        disabled={busy}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelect(contract.id)}
                      style={{
                        display: "block",
                        width: "100%",
                        border: 0,
                        background: "transparent",
                        textAlign: "inherit",
                        font: "inherit",
                        color: "inherit",
                        cursor: "pointer",
                        padding: "8px 0 0",
                      }}
                    >
                      <b style={{ fontSize: 13 }}>{contract.name}</b>
                      <div className="asf-hint" style={{ marginTop: 3 }}>
                        {contract.contractNumber}
                        {contract.clientName ? ` · ${contract.clientName}` : ""}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <span className="asf-chip">{contract.departmentsCount} قسم</span>
                        <span className="asf-chip">{contract.workOrderTypesCount ?? 0} نوع</span>
                      </div>
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ContractForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    contractNumber: initial?.contractNumber || "",
    name: initial?.name || "",
    kind: initial?.kind || "Unified",
    clientName: initial?.clientName || "",
    isActive: initial ? initial.isActive : true,
  }));
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) =>
    setValues((v) => ({
      ...v,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (!values.contractNumber.trim() || !values.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...values,
        contractNumber: values.contractNumber.trim(),
        name: values.name.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="asf-toolbar" onSubmit={submit}>
      <label className="asf-field">
        <span>رقم العقد</span>
        <input value={values.contractNumber} onChange={set("contractNumber")} maxLength={64} required autoFocus />
      </label>

      <label className="asf-field">
        <span>اسم العقد</span>
        <input value={values.name} onChange={set("name")} maxLength={256} required />
      </label>

      <label className="asf-field">
        <span>التصنيف</span>
        <select value={values.kind} onChange={set("kind")}>
          {CONTRACT_KINDS.map((k) => (
            <option key={k.code} value={k.code}>{k.label}</option>
          ))}
        </select>
      </label>

      <label className="asf-field">
        <span>الجهة</span>
        <input value={values.clientName} onChange={set("clientName")} maxLength={256} />
      </label>

      <label className="asf-check" style={{ alignSelf: "center" }}>
        <input type="checkbox" checked={values.isActive} onChange={set("isActive")} />
        مفعّل
      </label>

      <div className="asf-toolbar__actions">
        <button type="submit" className="asf-btn asf-btn--primary asf-btn--sm" disabled={saving}>
          {saving ? "…" : "حفظ"}
        </button>
        <button type="button" className="asf-btn asf-btn--sm" onClick={onCancel} disabled={saving}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
