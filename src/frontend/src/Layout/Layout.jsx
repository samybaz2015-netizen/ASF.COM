import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Component/Sidebar/Sidebar";
import { AppHeader } from "../Component/AppShell/AppHeader";
import "../Component/AppShell/AppShell.css";
import { useSidebar } from "../Context/SidebarContext";
import { PageHeader } from "../Component/AppShell/PageHeader";
import { isBareRoute, resolvePageHeader } from "../Component/AppShell/pageRegistry";

function Layout() {
  const { open } = useSidebar();
  const location = useLocation();

  const fullScreenPages = ["/home-page"];
  const isFullScreen = fullScreenPages.includes(location.pathname);

  /*
    الرأس يُرسَم هنا لا داخل الصفحات.

    لو رسمته كل صفحة بنفسها لاختلف الشكل واللون بين الأقسام — وهو ما حدث
    فعلاً: سبع صفحات كان لها رأس وعشرون بلا رأس. ورسمه مركزياً يعني أن أي
    صفحة جديدة تأخذه تلقائياً بلا سطر واحد فيها.
  */
  const bare = isBareRoute(location.pathname);
  const page = bare ? null : resolvePageHeader(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={`
          min-h-screen
          transition-all duration-300 ease-in-out
          ${open
            ? "mr-[240px] pr-4"
            : "mr-[80px] pr-3"
          }
        `}
      >
        {/* Header */}
        {/* الهيدر الموحّد */}
        <AppHeader />

        {/* Page Content */}
        {/* asf-app-content: صنف ثابت يحصر توحيد التنسيق في محتوى الصفحات،
            فلا يمسّ تسجيل الدخول ولا ما هو خارج هيكل التطبيق. */}
        {page && (
          <PageHeader
            title={page.title}
            icon={<i className={page.icon} aria-hidden="true" />}
            breadcrumbs={page.section ? [{ label: page.section }] : []}
            backAction
          />
        )}

        <div
          className={`asf-app-content ${isFullScreen ? "w-full" : "px-4 py-4"}`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;