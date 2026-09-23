import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import { MonitoringFilters } from "./components/MonitoringFilters";
import { StageBoard } from "./components/StageBoard";
import { FinancialBoard } from "./components/FinancialBoard";
import { EmployeeBoard } from "./components/EmployeeBoard";
import { ActivityChart } from "./components/ActivityChart";

import * as api from "../../services/MonitoringApi";
import { money, num } from "./utils/format";

import "../../styles/asf-ui.css";
import "./Monitoring.css";

const EMPTY_FILTER = {
  contractId: "",
  departmentId: "",
  projectTypeCode: "",
  workOrderTypeRefId: "",
  contractorRefId: "",
  districtRefId: "",
  basketStableKey: "",
  receivedFrom: "",
  receivedTo: "",
  activityFrom: "",
  activityTo: "",
};

/**
 * لوحة المتابعة.
 *
 * تُحمَّل بلا فلتر أوّل مرة: تعرض كل ما يحقّ للمستخدم رؤيته. الفلاتر تُضيّق
 * بعد ذلك، ومسحها يعيدها إلى نطاقه كاملاً.
 *
 * الصلاحية تُطبَّق في الخادم على الاستعلام نفسه، لا هنا — فلا يصل إلى المتصفّح
 * صفٌّ يُخفى بعد وصوله.
 */
function MonitoringPage() {
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [options, setOptions] = useState({});
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (current) => {
    setLoading(true);
    try {
      setBoard(await api.fetchBoard(current));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "تعذّر تحميل اللوحة",
        text: api.errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .fetchOptions()
      .then(setOptions)
      .catch(() => setOptions({}));
  }, []);

  // الفلاتر تُطبَّق تلقائياً: زرُّ «طبّق» خطوة زائدة في شاشة قراءة.
  useEffect(() => {
    const timer = setTimeout(() => load(filter), 250);
    return () => clearTimeout(timer);
  }, [filter, load]);

  const reset = () => setFilter(EMPTY_FILTER);

  return (
    <main className="asf">
      <div className="asf-app-content">
        <section className="asf-hero">
          <div style={{ minWidth: 240 }}>
            <small>المتابعة والمؤشّرات</small>
            <h2>لوحة المتابعة</h2>
            <p>مراحل الطلب، والمسند والمصروف والمتبقي، ومؤشّرات كل موظف.</p>
          </div>

          <div className="asf-hero-stats">
            <div className="asf-hero-stat">
              <b>{num(board?.totalOrders ?? 0)}</b>
              <span>أمر عمل</span>
            </div>
            <div className="asf-hero-stat">
              <b>{num(board?.stages?.length ?? 0)}</b>
              <span>مرحلة</span>
            </div>
            <div className="asf-hero-stat">
              <b>{money(board?.financial?.assigned ?? 0)}</b>
              <span>المسند</span>
            </div>
            <div className="asf-hero-stat">
              <b>{money(board?.financial?.remaining ?? 0)}</b>
              <span>المتبقي</span>
            </div>
          </div>
        </section>

        <MonitoringFilters
          filter={filter}
          options={options}
          busy={loading}
          onChange={setFilter}
          onReset={reset}
          onRefresh={() => load(filter)}
        />

        {/* ما تعذّر حسابه يُقال، لا يُبتلع في رقم يبدو كاملاً. */}
        {board?.notices?.length > 0 && (
          <div className="mon-notices">
            {board.notices.map((notice, index) => (
              <p key={index}>
                <FontAwesomeIcon icon={faCircleInfo} /> {notice}
              </p>
            ))}
          </div>
        )}

        {loading && !board ? (
          <section className="asf-panel">
            <div className="asf-panel__body">
              <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
            </div>
          </section>
        ) : (
          <div className="mon-grid">
            <FinancialBoard financial={board?.financial} />
            <StageBoard stages={board?.stages} />
            <ActivityChart activity={board?.activity} />
            <EmployeeBoard employees={board?.employees} />
          </div>
        )}
      </div>
    </main>
  );
}

export default MonitoringPage;
