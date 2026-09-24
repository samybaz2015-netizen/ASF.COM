import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiagramProject, faEye, faPlus, faRotate } from "@fortawesome/free-solid-svg-icons";

import { DepartmentPanel } from "./components/DepartmentPanel";
import { BasketBoard } from "./components/BasketBoard";
import { PreviewPanel } from "./components/PreviewPanel";
import { ChangeLog } from "./components/ChangeLog";
import { BackfillPanel } from "./components/BackfillPanel";
import { TemplatePanel } from "./components/TemplatePanel";
import { InfoTip } from "./components/InfoTip";
import * as api from "../../services/ContractWorkflowApi";
import "./ContractWorkflow.css";

/**
 * إعدادات العقد — الأقسام والسلال.
 *
 * كل ما يُحرَّر هنا يذهب إلى مسودة المسار. لا يتأثر أمر عمل واحد حتى يُضغط
 * «اعتماد المسار»، وعندها تُنقل السلال بمفاتيحها الثابتة فيبقى كل أمر عمل في
 * سلته حتى لو تغيّر اسمها أو ترتيبها.
 */
function ContractWorkflowPage() {
  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);

  const [draft, setDraft] = useState(null);
  const [published, setPublished] = useState(null);
  const [preview, setPreview] = useState(null);
  const [template, setTemplate] = useState(null);

  const [log, setLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const contract = useMemo(
    () => contracts.find((c) => c.id === contractId) || null,
    [contracts, contractId]
  );

  const fail = useCallback((err, fallback) => {
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err, fallback) });
  }, []);

  /** كل نداء يغيّر البيانات يمرّ من هنا، فلا يتداخل نداءان ولا يضيع خطأ. */
  const run = useCallback(
    async (action, fallback) => {
      setBusy(true);
      try {
        return await action();
      } catch (err) {
        fail(err, fallback);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [fail]
  );

  // العقود
  useEffect(() => {
    let cancelled = false;
    api
      .fetchContracts(true)
      .then((list) => {
        if (cancelled) return;
        setContracts(list);
        setContractId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => !cancelled && fail(err, "تعذّر تحميل العقود."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fail]);

  const loadDepartments = useCallback(
    async (id) => {
      if (!id) {
        setDepartments([]);
        return;
      }
      try {
        const list = await api.fetchDepartments(id, true);
        setDepartments(list);
        setDepartmentId((current) =>
          current && list.some((d) => d.id === current) ? current : list[0]?.id ?? null
        );
      } catch (err) {
        fail(err, "تعذّر تحميل الأقسام.");
      }
    },
    [fail]
  );

  useEffect(() => {
    loadDepartments(contractId);
  }, [contractId, loadDepartments]);

  // المسار: المسودة والنسخة المعتمدة
  const loadWorkflow = useCallback(
    async (id) => {
      if (!id) {
        setDraft(null);
        setPublished(null);
        setTemplate(null);
        return;
      }
      try {
        const [draftData, publishedData, templateData] = await Promise.all([
          api.fetchDraft(id),
          api.fetchPublished(id),
          api.fetchTemplate(id),
        ]);
        setDraft(draftData);
        setPublished(publishedData);
        setTemplate(templateData);
      } catch (err) {
        fail(err, "تعذّر تحميل المسار.");
      }
    },
    [fail]
  );

  useEffect(() => {
    loadWorkflow(departmentId);
  }, [departmentId, loadWorkflow]);

  const loadLog = useCallback(async () => {
    if (!contractId) return;
    setLoadingLog(true);
    try {
      setLog(await api.fetchAuditLog(contractId, departmentId, 100));
    } catch (err) {
      fail(err, "تعذّر تحميل السجل.");
    } finally {
      setLoadingLog(false);
    }
  }, [contractId, departmentId, fail]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const refreshAll = useCallback(async () => {
    await loadWorkflow(departmentId);
    await loadDepartments(contractId);
    await loadLog();
  }, [departmentId, contractId, loadWorkflow, loadDepartments, loadLog]);

  // ─────────── العقود ───────────

  const createContract = async () => {
    const { value } = await Swal.fire({
      title: "عقد جديد",
      html:
        '<input id="cw-num" class="swal2-input" placeholder="رقم العقد" maxlength="64">' +
        '<input id="cw-name" class="swal2-input" placeholder="اسم العقد" maxlength="256">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "إنشاء",
      cancelButtonText: "إلغاء",
      preConfirm: () => {
        const contractNumber = document.getElementById("cw-num").value.trim();
        const name = document.getElementById("cw-name").value.trim();
        if (!contractNumber || !name) {
          Swal.showValidationMessage("رقم العقد واسمه مطلوبان.");
          return false;
        }
        return { contractNumber, name, isActive: true };
      },
    });
    if (!value) return;

    const created = await run(() => api.createContract(value), "تعذّر إنشاء العقد.");
    if (created) {
      setContracts((prev) => [...prev, created]);
      setContractId(created.id);
    }
  };

  // ─────────── الأقسام ───────────

  const createDepartment = (values) =>
    run(async () => {
      await api.createDepartment(contractId, values);
      await loadDepartments(contractId);
    }, "تعذّر إضافة القسم.");

  const updateDepartment = (id, values) =>
    run(async () => {
      await api.updateDepartment(id, values);
      await loadDepartments(contractId);
      await loadLog();
    }, "تعذّر تعديل القسم.");

  const reorderDepartments = (orderedIds) =>
    run(async () => {
      await api.reorderDepartments(contractId, orderedIds);
      await loadDepartments(contractId);
      await loadLog();
    }, "تعذّر إعادة الترتيب.");

  const applyTemplate = () =>
    run(async () => {
      await api.applyTemplate(departmentId);
      await refreshAll();
    }, "تعذّر تطبيق السلال المقترحة.");

  // ─────────── السلال ───────────

  const addBasket = (values) =>
    run(async () => {
      await api.addBasket(draft.id, values);
      await refreshAll();
    }, "تعذّر إضافة السلة.");

  const updateBasket = (id, values) =>
    run(async () => {
      await api.updateBasket(id, values);
      await refreshAll();
    }, "تعذّر تعديل السلة.");

  const reorderBaskets = (orderedIds) =>
    run(async () => {
      await api.reorderBaskets(draft.id, orderedIds);
      await refreshAll();
    }, "تعذّر إعادة ترتيب السلال.");

  const deleteBasket = async (basket) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: `حذف «${basket.name}»؟`,
      text: "الحذف من المسودة فقط. المسار المعتمد لا يتأثر حتى تعتمد المسودة.",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#c0392b",
    });
    if (!confirmed.isConfirmed) return;

    await run(async () => {
      await api.deleteBasket(basket.id);
      await refreshAll();
    }, "تعذّر حذف السلة.");
  };

  // ─────────── المهام ───────────

  const addTask = (basketId, values) =>
    run(async () => {
      await api.addTask(basketId, values);
      await refreshAll();
    }, "تعذّر إضافة المهمة.");

  const updateTask = (taskId, values) =>
    run(async () => {
      await api.updateTask(taskId, values);
      await refreshAll();
    }, "تعذّر تعديل المهمة.");

  const reorderTasks = (basketId, orderedIds) =>
    run(async () => {
      await api.reorderTasks(basketId, orderedIds);
      await refreshAll();
    }, "تعذّر إعادة ترتيب المهام.");

  const deleteTask = async (task) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: `حذف المهمة «${task.name}»؟`,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#c0392b",
    });
    if (!confirmed.isConfirmed) return;

    await run(async () => {
      await api.deleteTask(task.id);
      await refreshAll();
    }, "تعذّر حذف المهمة.");
  };

  // ─────────── المعاينة والاعتماد ───────────

  const openPreview = () =>
    run(async () => setPreview(await api.fetchPreview(draft.id)), "تعذّر عرض المعاينة.");

  const publish = async () => {
    const { value: note, isConfirmed } = await Swal.fire({
      title: "اعتماد المسار",
      input: "text",
      inputLabel: "سبب التعديل (اختياري)",
      text: "سيصير هذا المسار هو المعتمد. أوامر العمل القائمة تبقى في سلالها.",
      showCancelButton: true,
      confirmButtonText: "اعتماد",
      cancelButtonText: "إلغاء",
    });
    if (!isConfirmed) return;

    setPublishing(true);
    try {
      await api.publishWorkflow(draft.id, note || null);
      setPreview(null);
      await refreshAll();
      Swal.fire({ icon: "success", title: "اعتُمد المسار", timer: 1600, showConfirmButton: false });
    } catch (err) {
      fail(err, "تعذّر اعتماد المسار.");
    } finally {
      setPublishing(false);
    }
  };

  const baskets = draft?.baskets || [];

  return (
    <>
      
      <main className="cw-page">
        <section className="cw-bar">
          <label className="cw-field cw-field--inline">
            <span>العقد</span>
            <select
              value={contractId ?? ""}
              onChange={(event) => setContractId(Number(event.target.value) || null)}
              disabled={loading || contracts.length === 0}
            >
              {contracts.length === 0 && <option value="">لا عقود</option>}
              {contracts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.contractNumber} — {item.name}
                  {item.isActive ? "" : " (معطّل)"}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="cw-btn cw-btn--ghost" onClick={createContract} disabled={busy}>
            <FontAwesomeIcon icon={faPlus} /> عقد جديد
          </button>

          <button type="button" className="cw-btn cw-btn--ghost" onClick={refreshAll} disabled={busy}>
            <FontAwesomeIcon icon={faRotate} /> تحديث
          </button>

          {draft && (
            <button type="button" className="cw-btn cw-btn--primary" onClick={openPreview} disabled={busy}>
              <FontAwesomeIcon icon={faEye} /> معاينة واعتماد
            </button>
          )}
        </section>

        {loading ? (
          <p className="cw-empty">جارٍ التحميل…</p>
        ) : !contract ? (
          <p className="cw-empty">أنشئ عقداً لتبدأ بتعريف الأقسام والسلال.</p>
        ) : (
          <div className="cw-layout">
            <DepartmentPanel
              departments={departments}
              selectedId={departmentId}
              busy={busy}
              canManage
              onSelect={setDepartmentId}
              onReorder={reorderDepartments}
              onCreate={createDepartment}
              onUpdate={updateDepartment}
            />

            <section className="cw-main">
              {!departmentId ? (
                <p className="cw-empty">أضف قسماً لهذا العقد لتعريف مساره.</p>
              ) : (
                <>
                  <div className="cw-status">
                    <span className="cw-badge cw-badge--draft">
                      مسودة · نسخة {draft?.version ?? "—"}
                    </span>
                    {published ? (
                      <span className="cw-badge cw-badge--live">
                        المعتمد حالياً: نسخة {published.version} ({published.baskets.length} سلة)
                      </span>
                    ) : (
                      <span className="cw-badge cw-badge--off">لا مسار معتمد بعد</span>
                    )}
                    <InfoTip text="التعديلات تُحفظ في المسودة فوراً، ولا تسري على أوامر العمل حتى تُعتمد." />
                  </div>

                  <TemplatePanel template={template} busy={busy} onApply={applyTemplate} />

                  <BasketBoard
                    baskets={baskets}
                    readOnly={false}
                    busy={busy}
                    onReorder={reorderBaskets}
                    onAddBasket={addBasket}
                    onUpdateBasket={updateBasket}
                    onDeleteBasket={deleteBasket}
                    onAddTask={addTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onReorderTasks={reorderTasks}
                  />
                </>
              )}
            </section>
          </div>
        )}

        {preview && (
          <PreviewPanel
            preview={preview}
            publishing={publishing}
            canPublish
            onClose={() => setPreview(null)}
            onPublish={publish}
          />
        )}

        {departmentId && published && (
          <BackfillPanel
            departmentId={departmentId}
            departmentName={published.departmentName}
            baskets={published.baskets}
            onDone={refreshAll}
          />
        )}

        {contract && (
          <section className="cw-logsec">
            <h3>
              سجل التغييرات
              <InfoTip text="كل تعديل على الأقسام أو السلال أو المهام، بمن نفّذه ووقته والقيمة قبل وبعد." />
            </h3>
            <ChangeLog entries={log} loading={loadingLog} />
          </section>
        )}
      </main>
    </>
  );
}

export default ContractWorkflowPage;
