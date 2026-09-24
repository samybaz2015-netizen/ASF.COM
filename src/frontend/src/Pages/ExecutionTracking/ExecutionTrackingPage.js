import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faLayerGroup, faListCheck, faRotate, faTable } from "@fortawesome/free-solid-svg-icons";

import { BasketRows } from "./components/BasketRows";
import { TrackingFilters } from "./components/TrackingFilters";
import { DepartmentNotice } from "./components/DepartmentNotice";
import * as api from "../../services/ExecutionTrackingApi";
import * as flow from "../../services/ContractWorkflowApi";
import * as setup from "../../services/ContractSetupApi";
import { exportWorkOrders, errorMessage as exportError } from "../../services/WorkOrderExport";

import "../../styles/asf-ui.css";
import "./ExecutionTracking.css";

const EMPTY_FILTER = {
  contractId: "",
  workOrderTypeId: "",
  receivedFrom: "",
  receivedTo: "",
  minDaysInBasket: "",
  search: "",
};

/** مفتاح المسار في الواجهة لكل نوع مشروع. */
const ROUTE_BY_TYPE = {
  Construction: "construction",
  Maintenance: "maintenance",
  Emergency: "emergency",
  NewProject: "rehabilitationWorks",
  PrivateProject: "privateproject",
};

/**
 * متابعة التنفيذ.
 *
 * عرضان لنفس البيانات: لوحة السلال لمن يتابع سير العمل، وجدول مفلتر لمن يدقّق.
 * الأقسام والسلال تُقرأ من إعدادات العقد، فلا شيء منها ثابت في الكود.
 */
function ExecutionTrackingPage() {
  const [sections, setSections] = useState([]);
  const [activeType, setActiveType] = useState(api.TRACKED_TYPES[0].code);
  const [view, setView] = useState("board"); // board | table

  const [contracts, setContracts] = useState([]);
  const [types, setTypes] = useState([]);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const fail = (err, fallback) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err, fallback) });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tracking, contractList] = await Promise.all([
        api.fetchTracking(),
        flow.fetchContracts(true).catch(() => []),
      ]);
      setSections(tracking);
      setContracts(contractList);
    } catch (err) {
      fail(err, "تعذّر تحميل المتابعة.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // أنواع أوامر العمل تتبع العقد المختار في الفلتر.
  useEffect(() => {
    let cancelled = false;
    const contractId = filter.contractId || contracts[0]?.id;
    if (!contractId) {
      setTypes([]);
      return undefined;
    }
    setup
      .fetchTypes(contractId, false)
      .then((list) => !cancelled && setTypes(list))
      .catch(() => !cancelled && setTypes([]));
    return () => {
      cancelled = true;
    };
  }, [filter.contractId, contracts]);

  const search = useCallback(async () => {
    setSearching(true);
    try {
      const payload = {
        contractId: filter.contractId === "" ? null : Number(filter.contractId),
        workOrderTypeId: filter.workOrderTypeId === "" ? null : Number(filter.workOrderTypeId),
        receivedFrom: filter.receivedFrom || null,
        receivedTo: filter.receivedTo || null,
        minDaysInBasket: filter.minDaysInBasket === "" ? null : Number(filter.minDaysInBasket),
        search: filter.search || null,
        projectTypeCode: activeType,
      };
      setRows(await api.searchWorkOrders(payload));
    } catch (err) {
      fail(err, "تعذّر البحث.");
    } finally {
      setSearching(false);
    }
  }, [filter, activeType]);

  /*
    القاعدة: بلا فلتر تُعرض كل البيانات التي يحقّ للمستخدم رؤيتها داخل نطاق
    الصفحة. الفلتر يضيّق ولا يشترط. لذلك يُجلب الجدول فور فتح الصفحة، وعند
    تبديل القسم، وعند مسح الفلاتر — لا عند الضغط على «بحث» فقط.

    مؤثّر واحد بعدّاد بدل مؤثّرين: مؤثّران كانا يعملان معاً عند التحميل
    فيُرسل نداء البحث مرّتين.
  */
  const [autoFetch, setAutoFetch] = useState(0);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, autoFetch]);

  /*
    مسح الفلاتر يمسح اختيارات المستخدم ويُبقي نطاق الصفحة: يبقى المستخدم في
    القسم نفسه وتعود كل بياناته المسموحة، ولا يُقذف إلى أول الشاشة.
  */
  /*
    التصدير يعيد بناء الاستعلام في الخادم بنفس الفلتر، لا يصدّر الصفوف
    المحمّلة في الصفحة: قاعدة الصلاحية تُطبَّق في الخلفية، فلا يخرج الملف عن
    ما يحقّ للمستخدم رؤيته.
  */
  const [exporting, setExporting] = useState(false);

  const exportRows = async () => {
    setExporting(true);
    try {
      const label =
        api.TRACKED_TYPES.find((t) => t.code === activeType)?.label || "أوامر-العمل";

      const count = await exportWorkOrders(
        {
          contractId: filter.contractId === "" ? null : Number(filter.contractId),
          workOrderTypeId: filter.workOrderTypeId === "" ? null : Number(filter.workOrderTypeId),
          receivedFrom: filter.receivedFrom || null,
          receivedTo: filter.receivedTo || null,
          minDaysInBasket: filter.minDaysInBasket === "" ? null : Number(filter.minDaysInBasket),
          search: filter.search || null,
          projectTypeCode: activeType,
        },
        label
      );

      if (count === 0) {
        Swal.fire({ icon: "info", title: "لا بيانات للتصدير", text: "لا نتائج ضمن الفلتر الحالي." });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "تعذّر التصدير",
        text: exportError(err, "خطأ غير متوقع."),
      });
    } finally {
      setExporting(false);
    }
  };

  const resetFilter = () => {
    setFilter(EMPTY_FILTER);
    setAutoFetch((n) => n + 1);
  };

  const available = useMemo(
    () =>
      api.TRACKED_TYPES.map((type) => ({
        ...type,
        present: sections.some((s) => s.projectTypeCode === type.code),
        total: sections
          .filter((s) => s.projectTypeCode === type.code)
          .reduce((sum, s) => sum + s.totalWorkOrders, 0),
      })),
    [sections]
  );

  const shown = useMemo(
    () => sections.filter((section) => section.projectTypeCode === activeType),
    [sections, activeType]
  );

  const grandTotal = useMemo(
    () => sections.reduce((sum, s) => sum + s.totalWorkOrders, 0),
    [sections]
  );

  return (
    <>
      
      <main className="asf">
        <div className="asf-page">
          <section className="asf-hero">
            <div>
              <small>متابعة وتدقيق</small>
              <h2>متابعة التنفيذ</h2>
              <p>أوامر العمل موزّعة على سلال كل قسم، كما عُرِّفت في إعدادات العقد.</p>
            </div>

            <div className="asf-hero-stats">
              {available.map((type) => (
                <div key={type.code} className="asf-hero-stat">
                  <b>{type.total}</b>
                  <span>{type.label}</span>
                </div>
              ))}
              <div className="asf-hero-stat">
                <b>{grandTotal}</b>
                <span>الإجمالي</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="asf-btn asf-btn--gold"
                onClick={exportRows}
                disabled={exporting || loading}
                title="يصدّر ما يظهر الآن: نفس الصلاحية والقسم والفلاتر"
              >
                <FontAwesomeIcon icon={faFileExcel} /> {exporting ? "جارٍ التصدير…" : "تصدير إكسل"}
              </button>

              <button type="button" className="asf-btn" onClick={load} disabled={loading}>
                <FontAwesomeIcon icon={faRotate} /> تحديث
              </button>
            </div>
          </section>

          <nav className="asf-tabs">
            {available.map((type) => (
              <button
                key={type.code}
                type="button"
                className={"asf-tab" + (type.code === activeType ? " asf-tab--active" : "")}
                onClick={() => setActiveType(type.code)}
              >
                {type.label}
                {type.total > 0 && <span className="asf-tab__count">{type.total}</span>}
              </button>
            ))}

            <span style={{ marginInlineStart: "auto", display: "flex", gap: 4 }}>
              <button
                type="button"
                className={"asf-tab" + (view === "board" ? " asf-tab--active" : "")}
                onClick={() => setView("board")}
                title="عرض السلال"
              >
                <FontAwesomeIcon icon={faLayerGroup} /> السلال
              </button>
              <button
                type="button"
                className={"asf-tab" + (view === "table" ? " asf-tab--active" : "")}
                onClick={() => setView("table")}
                title="جدول مفلتر للتدقيق"
              >
                <FontAwesomeIcon icon={faTable} /> جدول
              </button>
            </span>
          </nav>

          <TrackingFilters
            value={filter}
            contracts={contracts}
            types={types}
            busy={searching}
            onChange={setFilter}
            onSearch={search}
            onReset={resetFilter}
          />

          {loading ? (
            <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
          ) : view === "table" ? (
            <ResultsTable rows={rows} searching={searching} />
          ) : sections.length === 0 ? (
            <div className="asf-empty">
              <strong>لا توجد أقسام ضمن نطاقك</strong>
              <span>راجع إعدادات العقد، أو اطلب إسناد نطاق بيانات.</span>
            </div>
          ) : shown.length === 0 ? (
            <div className="asf-empty"><strong>لا يوجد قسم من هذا النوع ضمن نطاقك.</strong></div>
          ) : (
            shown.map((section) => (
              <section key={section.departmentId} className="asf-panel">
                <header className="asf-panel__head">
                  <div>
                    <h3>{section.departmentName}</h3>
                    <p>{section.contractNumber} — {section.contractName}</p>
                  </div>
                  <span className="asf-chip asf-chip--info">{section.totalWorkOrders} أمر عمل</span>
                </header>

                <div className="asf-panel__body">
                  <DepartmentNotice section={section} onDone={load} />

                  {section.hasPublishedWorkflow && (
                    <BasketRows
                      departmentId={section.departmentId}
                      baskets={section.baskets}
                    />
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </>
  );
}

/** جدول النتائج — العرض الذي يدقّق عليه المشرف. */
function ResultsTable({ rows, searching }) {
  if (searching) return <div className="asf-empty"><strong>جارٍ البحث…</strong></div>;

  if (rows.length === 0) {
    return (
      <div className="asf-empty">
        <strong>لا نتائج</strong>
        <span>اضبط الفلتر ثم اضغط بحث.</span>
      </div>
    );
  }

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>نتائج البحث</h3>
          <p>الأطول مكوثاً يستحق المراجعة أولاً.</p>
        </div>
        <span className="asf-chip asf-chip--info">{rows.length} أمر عمل</span>
      </header>

      <div className="asf-panel__body">
        <div className="asf-table__scroll">
          <table className="asf-table">
            <thead>
              <tr>
                <th>رقم الأمر</th>
                <th>الوصف</th>
                <th>النوع</th>
                <th>القسم</th>
                <th>السلة</th>
                <th>المقاول</th>
                <th>الحي</th>
                <th>الاستلام</th>
                <th>المكوث</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const route = ROUTE_BY_TYPE[row.projectTypeCode];
                return (
                  <tr key={`${row.projectTypeCode}-${row.workOrderId}`}>
                    <td>
                      {route ? (
                        <Link to={`/project/${route}/${row.workOrderId}`} style={{ fontWeight: 800 }}>
                          {row.orderNumber || `#${row.workOrderId}`}
                        </Link>
                      ) : (
                        <b>{row.orderNumber || `#${row.workOrderId}`}</b>
                      )}
                    </td>
                    <td>{row.title || "—"}</td>
                    <td>{row.workOrderTypeName || "—"}</td>
                    <td>{row.departmentName || "—"}</td>
                    <td>{row.basketName || "—"}</td>
                    <td>{row.contractor || "—"}</td>
                    <td>{row.district || "—"}</td>
                    <td className="asf-hint">
                      {row.receivedAt
                        ? new Date(row.receivedAt).toLocaleDateString("ar-SA", { dateStyle: "short" })
                        : "—"}
                    </td>
                    <td>
                      <span className={"asf-chip " + (row.daysInBasket > 14 ? "asf-chip--danger" : "")}>
                        {row.daysInBasket} يوم
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ExecutionTrackingPage;
