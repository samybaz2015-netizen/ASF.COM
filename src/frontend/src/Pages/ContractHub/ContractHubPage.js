import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClockRotateLeft,
  faDiagramProject,
  faFileInvoiceDollar,
  faFileSignature,
  faPlus,
  faRotate,
  faFileImport,
  faTags,
  faUsers,
  faHelmetSafety,
  faLocationDot,
  faBarcode,
  faUserTie,
  faBuilding,
  faUserShield,
  faSitemap,
} from "@fortawesome/free-solid-svg-icons";

import { DepartmentPanel } from "../ContractWorkflow/components/DepartmentPanel";
import { BasketBoard } from "../ContractWorkflow/components/BasketBoard";
import { PreviewPanel } from "../ContractWorkflow/components/PreviewPanel";
import { TemplatePanel } from "../ContractWorkflow/components/TemplatePanel";
import { BackfillPanel } from "../ContractWorkflow/components/BackfillPanel";
import { ChangeLog } from "../ContractWorkflow/components/ChangeLog";
import { PricingImport } from "../Settings/components/PricingImport";
import { ListsTab } from "./components/ListsTab";
import { TeamTab } from "./components/TeamTab";
import { ImportTab } from "./components/ImportTab";
import { ContractsTab } from "./components/ContractsTab";

import * as flow from "../../services/ContractWorkflowApi";
import * as setup from "../../services/ContractSetupApi";
import { fetchUsers } from "../../services/AccessApi";

import "../../styles/asf-ui.css";
import "../ContractWorkflow/ContractWorkflow.css";

/**
 * مجموعتان: القوائم والإعدادات من جهة، ومسار العقد من جهة. المسار شاشة عمل
 * عريضة بلوحتين، فلا يصلح أن يُحشر في نفس عمود القوائم القصيرة.
 */
const GROUPS = [
  { key: "general", label: "القوائم العامة" },
  { key: "flow", label: "مراحل خط سير العقد الموحد" },
];

const TABS = [
  { key: "contracts", label: "العقود", icon: faFileSignature, group: "general" },
  { key: "types", label: "أنواع أوامر العمل", icon: faTags, group: "general", category: "WorkOrderType" },
  { key: "codes", label: "رموز أوامر العمل", icon: faBarcode, group: "general", category: "WorkOrderCode" },
  { key: "districts", label: "الأحياء", icon: faLocationDot, group: "general", category: "District" },
  { key: "contractors", label: "المقاولون", icon: faHelmetSafety, group: "general", category: "Contractor" },
  { key: "consultants", label: "الاستشاريون", icon: faUserTie, group: "general", category: "Consultant" },
  { key: "offices", label: "المكاتب", icon: faBuilding, group: "general", category: "Office" },
  { key: "owners", label: "ملاك المشاريع", icon: faUserShield, group: "general", category: "ProjectOwner" },
  { key: "parties", label: "جهات المشاريع", icon: faSitemap, group: "general", category: "ProjectParty" },
  { key: "team", label: "فريق العمل والصلاحيات", icon: faUsers, group: "general" },
  { key: "import", label: "استيراد أوامر العمل", icon: faFileImport, group: "general" },
  { key: "pricing", label: "بنود المقايسة", icon: faFileInvoiceDollar, group: "general" },
  { key: "log", label: "سجل التغييرات", icon: faClockRotateLeft, group: "general" },
  { key: "workflow", label: "الأقسام والسلال", icon: faDiagramProject, group: "flow" },
];

/**
 * إعدادات العقد — مركز واحد.
 *
 * كانت الإعدادات موزّعة على أربع شاشات منفصلة في القائمة الجانبية (الأسعار،
 * الأقسام والسلال، نوع أمر العمل، الصلاحيات) فيضيع المستخدم بينها. جُمعت هنا
 * في تبويبات فوق عقد واحد مختار.
 */
function ContractHubPage() {
  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState(null);
  const [group, setGroup] = useState("general");
  const [tab, setTab] = useState("contracts");

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [published, setPublished] = useState(null);
  const [template, setTemplate] = useState(null);
  const [preview, setPreview] = useState(null);

  const [types, setTypes] = useState([]);
  const [team, setTeam] = useState([]);
  const [users, setUsers] = useState([]);
  const [log, setLog] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const contract = useMemo(
    () => contracts.find((c) => c.id === contractId) || null,
    [contracts, contractId]
  );

  const fail = useCallback((err, fallback) => {
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: flow.errorMessage(err, fallback) });
  }, []);

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

  // العقود والمستخدمون يُحمّلان مرة واحدة.
  useEffect(() => {
    let cancelled = false;
    Promise.all([flow.fetchContracts(true), fetchUsers().catch(() => [])])
      .then(([list, userList]) => {
        if (cancelled) return;
        setContracts(list);
        setUsers(Array.isArray(userList) ? userList : []);
        setContractId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => !cancelled && fail(err, "تعذّر تحميل العقود."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fail]);

  const loadContractData = useCallback(
    async (id) => {
      if (!id) {
        setDepartments([]);
        setTypes([]);
        setTeam([]);
        setLog([]);
        return;
      }
      try {
        const [departmentList, typeList, teamList, logList] = await Promise.all([
          flow.fetchDepartments(id, true),
          setup.fetchTypes(id, true),
          setup.fetchTeam(id),
          flow.fetchAuditLog(id, null, 100),
        ]);
        setDepartments(departmentList);
        setTypes(typeList);
        setTeam(teamList);
        setLog(logList);
        setDepartmentId((current) =>
          current && departmentList.some((d) => d.id === current) ? current : departmentList[0]?.id ?? null
        );
      } catch (err) {
        fail(err, "تعذّر تحميل بيانات العقد.");
      }
    },
    [fail]
  );

  useEffect(() => {
    loadContractData(contractId);
  }, [contractId, loadContractData]);

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
          flow.fetchDraft(id),
          flow.fetchPublished(id),
          flow.fetchTemplate(id),
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
    if (tab === "workflow") loadWorkflow(departmentId);
  }, [tab, departmentId, loadWorkflow]);

  const refreshAll = useCallback(async () => {
    await loadContractData(contractId);
    if (tab === "workflow") await loadWorkflow(departmentId);
  }, [contractId, departmentId, tab, loadContractData, loadWorkflow]);

  const reloadContracts = useCallback(async () => {
    const list = await flow.fetchContracts(true);
    setContracts(list);
  }, []);

  // ─────────── الأقسام والمسار ───────────

  const createDepartment = (values) =>
    run(async () => {
      await flow.createDepartment(contractId, values);
      await loadContractData(contractId);
    }, "تعذّر إضافة القسم.");

  const updateDepartment = (id, values) =>
    run(async () => {
      await flow.updateDepartment(id, values);
      await loadContractData(contractId);
    }, "تعذّر تعديل القسم.");

  const reorderDepartments = (orderedIds) =>
    run(async () => {
      await flow.reorderDepartments(contractId, orderedIds);
      await loadContractData(contractId);
    }, "تعذّر إعادة الترتيب.");

  const applyTemplate = () =>
    run(async () => {
      await flow.applyTemplate(departmentId);
      await refreshAll();
    }, "تعذّر تطبيق السلال المقترحة.");

  const addBasket = (values) =>
    run(async () => {
      await flow.addBasket(draft.id, values);
      await refreshAll();
    }, "تعذّر إضافة السلة.");

  const updateBasket = (id, values) =>
    run(async () => {
      await flow.updateBasket(id, values);
      await refreshAll();
    }, "تعذّر تعديل السلة.");

  const reorderBaskets = (orderedIds) =>
    run(async () => {
      await flow.reorderBaskets(draft.id, orderedIds);
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
      confirmButtonColor: "#a33636",
    });
    if (!confirmed.isConfirmed) return;
    await run(async () => {
      await flow.deleteBasket(basket.id);
      await refreshAll();
    }, "تعذّر حذف السلة.");
  };

  const addTask = (basketId, values) =>
    run(async () => {
      await flow.addTask(basketId, values);
      await refreshAll();
    }, "تعذّر إضافة المهمة.");

  const updateTask = (taskId, values) =>
    run(async () => {
      await flow.updateTask(taskId, values);
      await refreshAll();
    }, "تعذّر تعديل المهمة.");

  const reorderTasks = (basketId, orderedIds) =>
    run(async () => {
      await flow.reorderTasks(basketId, orderedIds);
      await refreshAll();
    }, "تعذّر إعادة ترتيب المهام.");

  const deleteTask = async (task) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: `حذف المهمة «${task.name}»؟`,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#a33636",
    });
    if (!confirmed.isConfirmed) return;
    await run(async () => {
      await flow.deleteTask(task.id);
      await refreshAll();
    }, "تعذّر حذف المهمة.");
  };

  const openPreview = () =>
    run(async () => setPreview(await flow.fetchPreview(draft.id)), "تعذّر عرض المعاينة.");

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
      await flow.publishWorkflow(draft.id, note || null);
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
  const totalWorkOrders = useMemo(
    () => (published?.baskets || []).reduce((sum, b) => sum + (b.workOrdersCount || 0), 0),
    [published]
  );

  // القائمة المعروضة حالياً، إن كان القسم المختار قائمةً أصلاً.
  const activeCategory = useMemo(
    () => TABS.find((t) => t.key === tab)?.category ?? null,
    [tab]
  );

  // عدّاد كل قسم بجانب اسمه: يُغني عن فتحه لمعرفة إن كان فيه شيء.
  const counts = useMemo(
    () => ({
      contracts: contracts.length,
      types: types.filter((t) => t.category === "WorkOrderType").length,
      codes: types.filter((t) => t.category === "WorkOrderCode").length,
      districts: types.filter((t) => t.category === "District").length,
      contractors: types.filter((t) => t.category === "Contractor").length,
      consultants: types.filter((t) => t.category === "Consultant").length,
      offices: types.filter((t) => t.category === "Office").length,
      owners: types.filter((t) => t.category === "ProjectOwner").length,
      parties: types.filter((t) => t.category === "ProjectParty").length,
      team: new Set(team.map((t) => t.userId)).size,
      log: log.length,
      import: totalWorkOrders,
      pricing: 0,
      workflow: departments.length,
    }),
    [contracts, types, team, log, departments, totalWorkOrders]
  );

  return (
    <>
      
      <main className="asf">
        <div className="asf-page">
          {/* الترويسة تحمل اختيار العقد وملخّصه، فلا تبقى مساحة علوية فارغة */}
          <section className="asf-hero">
            <div style={{ minWidth: 260 }}>
              <small>{contract ? setup.kindLabel(contract.kind) : "إعدادات"}</small>
              <h2>{contract ? contract.name : "لا عقود بعد"}</h2>
              <p>
                {contract
                  ? `${contract.contractNumber}${contract.clientName ? ` · ${contract.clientName}` : ""}`
                  : "أنشئ عقداً لتبدأ."}
              </p>
            </div>

            <div className="asf-hero-stats">
              <div className="asf-hero-stat">
                <b>{departments.length}</b>
                <span>قسم</span>
              </div>
              <div className="asf-hero-stat">
                {/* أنواع أوامر العمل وحدها: الجدول صار يحمل القوائم الأربع،
                    فعدّه كلّه هنا يضخّم الرقم بأحياءٍ ومقاولين. */}
                <b>{counts.types}</b>
                <span>نوع أمر عمل</span>
              </div>
              <div className="asf-hero-stat">
                <b>{new Set(team.map((t) => t.userId)).size}</b>
                <span>موظف</span>
              </div>
              <div className="asf-hero-stat">
                <b>{totalWorkOrders}</b>
                <span>أمر عمل</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label className="asf-field" style={{ minWidth: 230 }}>
                <span style={{ color: "#c3ccdf" }}>العقد</span>
                <select
                  value={contractId ?? ""}
                  onChange={(e) => setContractId(Number(e.target.value) || null)}
                  disabled={loading || contracts.length === 0}
                >
                  {contracts.length === 0 && <option value="">لا عقود</option>}
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contractNumber} — {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className="asf-btn asf-btn--gold" onClick={refreshAll} disabled={busy}>
                <FontAwesomeIcon icon={faRotate} /> تحديث
              </button>
            </div>
          </section>

          {/* المجموعتان فوق، والأقسام في عمود جانبي — نفس ترتيب شاشة القوائم. */}
          <nav className="asf-tabs">
            {GROUPS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={"asf-tab" + (group === item.key ? " asf-tab--active" : "")}
                onClick={() => {
                  setGroup(item.key);
                  setTab(TABS.find((t) => t.group === item.key).key);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
          ) : (
            <div className="asf-settings">
              <aside className="asf-cats">
                {TABS.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={"asf-cats__btn" + (tab === item.key ? " asf-cats__btn--active" : "")}
                    onClick={() => setTab(item.key)}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                    <strong>{item.label}</strong>
                    <span className="asf-cats__count">{counts[item.key] ?? 0}</span>
                  </button>
                ))}
              </aside>

              <div>
              {tab === "contracts" && (
                <ContractsTab
                  contracts={contracts}
                  selectedId={contractId}
                  busy={busy}
                  onSelect={setContractId}
                  onChanged={reloadContracts}
                />
              )}

              {tab === "workflow" && !contract && (
                <div className="asf-empty"><strong>اختر عقداً أولاً.</strong></div>
              )}

              {tab === "workflow" && contract && (
                <div className="asf-split">
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

                  <section className="asf-panel">
                    <header className="asf-panel__head">
                      <div>
                        <h3>{departmentId ? draft?.departmentName || "المسار" : "المسار"}</h3>
                        <p>التعديلات تُحفظ في المسودة ولا تسري حتى تُعتمد.</p>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span className="asf-chip asf-chip--warn">مسودة · نسخة {draft?.version ?? "—"}</span>
                        {published ? (
                          <span className="asf-chip asf-chip--ok">
                            معتمد · نسخة {published.version}
                          </span>
                        ) : (
                          <span className="asf-chip">لا مسار معتمد</span>
                        )}
                        {draft && (
                          <button
                            type="button"
                            className="asf-btn asf-btn--primary asf-btn--sm"
                            onClick={openPreview}
                            disabled={busy}
                          >
                            معاينة واعتماد
                          </button>
                        )}
                      </div>
                    </header>

                    <div className="asf-panel__body">
                      {!departmentId ? (
                        <div className="asf-empty">
                          <strong>لا أقسام في هذا العقد</strong>
                          <span>أضف قسماً من اللوحة المجاورة لتعريف مساره.</span>
                        </div>
                      ) : (
                        <>
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
                          {published && (
                            <BackfillPanel
                              departmentId={departmentId}
                              departmentName={published.departmentName}
                              baskets={published.baskets}
                              onDone={refreshAll}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeCategory && contract && (
                <ListsTab
                  key={activeCategory}
                  category={activeCategory}
                  contract={contract}
                  contractId={contractId}
                  departments={departments}
                  types={types.filter((t) => t.category === activeCategory)}
                  busy={busy}
                  onChanged={() => loadContractData(contractId)}
                />
              )}

              {tab === "team" && contract && (
                <TeamTab
                  contractId={contractId}
                  departments={departments}
                  types={types}
                  users={users}
                  team={team}
                  busy={busy}
                  onChanged={() => loadContractData(contractId)}
                />
              )}

              {tab === "import" && contract && (
                <ImportTab
                  contractId={contractId}
                  departments={departments}
                  busy={busy}
                  onImported={refreshAll}
                />
              )}

              {tab === "pricing" && (
                <section className="asf-panel">
                  <header className="asf-panel__head">
                    <div>
                      <h3>بنود المقايسة</h3>
                      <p>استيراد ملحق الأسعار من إكسل إلى إدارة محدّدة.</p>
                    </div>
                  </header>
                  <div className="asf-panel__body">
                    <PricingImport />
                  </div>
                </section>
              )}

              {tab === "log" && contract && (
                <section className="asf-panel">
                  <header className="asf-panel__head">
                    <div>
                      <h3>سجل التغييرات</h3>
                      <p>كل تعديل على العقد وأقسامه وسلاله وأنواعه، بمن نفّذه ووقته.</p>
                    </div>
                  </header>
                  <div className="asf-panel__body">
                    <ChangeLog entries={log} loading={false} />
                  </div>
                </section>
              )}

              {(activeCategory || tab === "team" || tab === "log" || tab === "import") && !contract && (
                <div className="asf-empty"><strong>اختر عقداً أولاً.</strong></div>
              )}
              </div>
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
        </div>
      </main>
    </>
  );
}

export default ContractHubPage;
