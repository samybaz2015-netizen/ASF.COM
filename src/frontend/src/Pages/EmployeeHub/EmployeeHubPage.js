import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCalendarDays,
  faFileImport,
  faUserCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import { EmployeesTab } from "./components/EmployeesTab";
import { EmployeeFile } from "./components/EmployeeFile";
import { LeavesTab } from "./components/LeavesTab";
import { CalendarTab } from "./components/CalendarTab";
import { EmployeeImportTab } from "./components/EmployeeImportTab";
import CheckAttendanceAdminContent from "../../Component/CheckAttendanceAdminContent/CheckAttendanceAdminContent";

import * as api from "../../services/EmployeeHubApi";
import { fetchBranches } from "../../services/WorkOrderCreateApi";

import "../../styles/asf-ui.css";
import "./EmployeeHub.css";

const TABS = [
  { key: "employees", label: "الموظفون", icon: faUsers },
  { key: "leaves", label: "الإجازات", icon: faCalendarCheck },
  { key: "calendar", label: "تقويم الفريق", icon: faCalendarDays },
  { key: "attendance", label: "الحضور", icon: faUserCheck },
  { key: "import", label: "استيراد وتصدير", icon: faFileImport },
];

/**
 * قسم الموظفين — مركز واحد.
 *
 * كانت شؤون الموظف موزّعة على أربع شاشات في القائمة الجانبية: الموظفون،
 * الإجازات، الحضور، الحسابات. والبيانات نفسها تتكرّر في كلٍّ منها بصيغة
 * مختلفة، فلا يُعرف أيّها الأصل. جُمعت هنا فوق مصدر واحد هو الحساب نفسه.
 */
function EmployeeHubPage() {
  const [tab, setTab] = useState("employees");
  const [openId, setOpenId] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // المنتهية خدمتهم يُحمَّلون أيضاً: إخفاؤهم من الخادم يجعل العدّاد كاذباً
      // ويمنع فتح ملف موظف سابق. الإخفاء قرار عرضٍ لا قرار تحميل.
      const list = await api.fetchEmployees({ includeInactive: true });
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "تعذّر التحميل",
        text: api.errorMessage(err, "تعذّر تحميل الموظفين."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchBranches()
      .then((list) => setBranches(Array.isArray(list) ? list : []))
      .catch(() => setBranches([]));
  }, [load]);

  const counts = useMemo(
    () => ({
      employees: employees.filter((e) => e.isActiveEmployee).length,
      leaves: 0,
      calendar: 0,
      attendance: 0,
      import: 0,
    }),
    [employees]
  );

  const active = employees.filter((e) => e.isActiveEmployee).length;
  const inactive = employees.length - active;

  // مستندات على وشك الانتهاء عبر كل الموظفين — تُحسب من السجلّ لا باستعلام ثانٍ.
  const expiringSoon = useMemo(
    () =>
      employees.filter((e) => {
        if (!e.residenceExpiryDate) return false;
        const days = Math.ceil(
          (new Date(e.residenceExpiryDate) - new Date()) / 86400000
        );
        return days <= 30;
      }).length,
    [employees]
  );

  return (
    <main className="asf">
      <div className="asf-app-content">
        <section className="asf-hero">
          <div style={{ minWidth: 240 }}>
            <small>الموارد البشرية</small>
            <h2>قسم الموظفين</h2>
            <p>الملفات والمستندات والإجازات وتقويم الفريق — في مكان واحد.</p>
          </div>

          <div className="asf-hero-stats">
            <div className="asf-hero-stat">
              <b>{active}</b>
              <span>على رأس العمل</span>
            </div>
            <div className="asf-hero-stat">
              <b>{inactive}</b>
              <span>منتهية الخدمة</span>
            </div>
            <div className="asf-hero-stat">
              <b>{expiringSoon}</b>
              <span>إقامة تنتهي قريباً</span>
            </div>
            <div className="asf-hero-stat">
              <b>{branches.length}</b>
              <span>فرع</span>
            </div>
          </div>
        </section>

        <div className="asf-settings">
          <aside className="asf-cats">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={"asf-cats__btn" + (tab === item.key ? " asf-cats__btn--active" : "")}
                onClick={() => {
                  setTab(item.key);
                  setOpenId(null);
                }}
              >
                <FontAwesomeIcon icon={item.icon} />
                <strong>{item.label}</strong>
                {counts[item.key] > 0 && (
                  <span className="asf-cats__count">{counts[item.key]}</span>
                )}
              </button>
            ))}
          </aside>

          <div>
            {tab === "employees" && !openId && (
              <EmployeesTab
                employees={employees}
                loading={loading}
                branches={branches}
                onOpen={setOpenId}
                onRefresh={load}
              />
            )}

            {tab === "employees" && openId && (
              <EmployeeFile
                userId={openId}
                branches={branches}
                onBack={() => setOpenId(null)}
                onSaved={load}
              />
            )}

            {tab === "leaves" && <LeavesTab employees={employees} />}

            {tab === "calendar" && <CalendarTab branches={branches} />}

            {tab === "attendance" && (
              <section className="asf-panel">
                <header className="asf-panel__head">
                  <div>
                    <h3>الحضور</h3>
                    <p>تسجيل الحضور والانصراف ومتابعته.</p>
                  </div>
                </header>
                <div className="asf-panel__body">
                  {/* الشاشة القائمة تُضمَّن كما هي: إعادة بنائها تنشئ نسخة
                      ثانية من المنطق نفسه، وهو ما جئنا نزيله. */}
                  <CheckAttendanceAdminContent />
                </div>
              </section>
            )}

            {tab === "import" && <EmployeeImportTab onImported={load} />}
          </div>
        </div>
      </div>
    </main>
  );
}

export default EmployeeHubPage;
