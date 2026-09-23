import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./Pages/Login/Login";
import Footer from "./Component/Footer/Footer";
import NotFound from "./Pages/NotFound/NotFound";
import { getUserSession } from "./function/AuthStorage"; 
import Navbar from "./Component/NavBar/Navbar";
import "./assets/css/all.css";
import DashBoard from "./Pages/Dashoard/Dashboard";
import SearchRequests from "./Pages/SearchRequests/SearchRequestsPage";
import Orders from "./Pages/Orders/OrderPage";
import DailyExecutionPage from "./Pages/DailyExecution/DailyExecutionPage";

import AccessManagementPage from "./Pages/AccessManagement/AccessManagementPage";
import ContractHubPage from "./Pages/ContractHub/ContractHubPage";
import ExecutionTrackingPage from "./Pages/ExecutionTracking/ExecutionTrackingPage";
import ConstructionCreatePage from "./Pages/WorkOrderCreate/ConstructionCreatePage";
import EmployeeHubPage from "./Pages/EmployeeHub/EmployeeHubPage";
import MonitoringPage from "./Pages/Monitoring/MonitoringPage";
import Project from "./Pages/Project/ProjectPage";
import AddAccount from "./Pages/AddAcount/AddAcountPage";
import Accounts from "./Pages/Accounts/AccountsPage";
import Engineers from "./Pages/Engineers/EngineersPage";
import MainPage from "./Pages/Main-Page/Main-Page";
import Subscribers from "./Pages/Subscribers/Subscribers";
import SubmitApplication from "./Pages/SubmitApplication/SubmitApplication";
import ArchivedRequests from "./Pages/ArchivedRequests/ArchivedRequests";
import Contactus from "./Pages/Contactus/Contactus";
import About from "./Pages/About/About";
import AllProject from "./Pages/AllProject/AllProject";
import SpecialProjects from "./Pages/SpecialProjects/SpecialProjects";
import MainTainPage from "./Pages/Maintains/Maintains";
import OperateMaintains from "./Pages/operate-maintains/OperateMaintains";
import EngStatcis from "./Pages/EngStatics/EngStatcis";
import Consultants from "./Pages/Consultants/Consultants";
import DeleteOrders from "./Pages/DeleteOrders/DeleteOrders";
import NotificationPage from "./Pages/Notification/NotificationPage";
import Areas from "./Pages/Areas/Areas";
import Branches from "./Pages/Branches/Branches";
import Offices from "./Pages/Offices/Offices";
import Employees from "./Pages/Employees/Employees";
import Vacations from "./Pages/Vacations/Vacations";
import RehabilitationWorks from "./Pages/RehabilitationWorks/RehabilitationWorks";
import EmergencyProjects from "./Pages/EmergencyProjects/EmergencyProjects";
import Construction from "./Pages/Construction/Construction";
import EngProfile from "./Pages/EngProfile/EngProfile";
import EngNotification from "./Pages/EngNotification/EngNotification";
import AddUserPermission from "./Pages/AddUserPermission/AddUserPermission";
import AcceptDeteleOrders from "./Pages/AcceptDeteleOrders/AcceptDeteleOrders";
import TaskType from "./Pages/TaskType/TaskType";
import AdminProjects from "./Pages/AdminProjects/AdminProjects";
import AdminBranchData from "./Pages/AdminBranchData/AdminBranchData";
import ResetPassword from "./Pages/ResetPassword/ResetPassword";
import RequestsWaiting from "./Pages/RequestsWaiting/RequestsWaiting";
import OfficeMangerProfile from "./Pages/OfficeMangerProfile/OfficeMangerProfile";
import AllAdminPrivateProject from "./Pages/AllAdminPrivateProject/AllAdminPrivateProject";
import BootInfo from "./Pages/BootInfo/BootInfo";
import Custodies from "./Pages/Custodies/Custodies";
import CheckAttendanceAdmin from "./Pages/CheckAttendanceAdmin/CheckAttendanceAdmin";
import EngAttendance from "./Pages/EngAttendance/EngAttendance";
import MyVacations from "./Component/Vacations/MyVacations";
import CustodiesEngContent from "./Component/CustodiesEngContent/CustodiesEngContent";
import PermissionRoute from "./Component/PermissionRoute/PermissionRoute";
import { SidebarProvider } from "./Context/SidebarContext";
import Layout from "./Layout/Layout";
import ProjectParties from "./Pages/ProjectParties/ProjectParties";
import ProjectOwners from "./Pages/ProjectOwners/ProjectOwners";
import DashboardShell from "./Pages/Dashoard/components/DashboardShell";
import Dashboard from "./Pages/Dashoard/Dashboard";
import AdminProjectCreate from "./Pages/SearchRequests/AdminProjects/AdminProjectCreate";

// ─── Permission groups ────────────────────────────────────────────────────
const ALL_VIEW_PERMS = [
  "Construction.View", "Emergency.View", "Maintenance.View",
  "NewProject.View", "PrivateProject.View", "Attendance.View",
  "LeaveRequest.View", "Custody.View", "Employees.View",
  "Branch.View", "Office.View", "Neighborhood.View",
  "Consultant.View", "Contractor.View", "WorkOrderType.View",
  "JobDescription.View", "Notifications.View", "Users.View",
];

const PROJECT_VIEW_PERMS = [
  "Construction.View", "Emergency.View",
  "Maintenance.View", "NewProject.View", "PrivateProject.View",
];

const PROJECT_UPDATE_PERMS = [
  "Construction.Update", "Emergency.Update",
  "Maintenance.Update", "NewProject.Update", "PrivateProject.Update",
];

const ALL_APPROVE_PERMS = [
  "Construction.Approve", "Emergency.Approve",
  "Maintenance.Approve", "NewProject.Approve", "PrivateProject.Approve",
];

const ALL_DELETE_PERMS = [
  "Construction.Delete", "Emergency.Delete",
  "Maintenance.Delete", "NewProject.Delete", "PrivateProject.Delete",
];

// ─── Route wrapper helpers ────────────────────────────────────────────────
// P  → single permission required
const P = (permission, element, fallback) => (
  <PermissionRoute permission={permission} fallback={fallback}>
    {element}
  </PermissionRoute>
);
// PA → any one of these permissions is enough
const PA = (anyOf, element, fallback) => (
  <PermissionRoute anyOf={anyOf} fallback={fallback}>
    {element}
  </PermissionRoute>
);

// ═════════════════════════════════════════════════════════════════════════
function App() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const user = getUserSession();
    if (user) setUserData(user);
  }, []);

  useEffect(() => {
   const user = getUserSession();
   if (!user && location.pathname !== "/" && location.pathname !== "/reset-password") {
      navigate("/");
    }
  }, [navigate, location.pathname]);

  const showNavbarAndFooter =
    (userData?.userType === "eng" ||  userData?.userType === "contractor") &&
    (location.pathname.toLowerCase().startsWith("/sub-page/") ||
      location.pathname.toLowerCase().startsWith("/requests/") ||
      [
        "/main-page", "/submit-application", "/submit-application/:id",
        "/contactus", "/about", "/projects", "/electricRequests",
        "/special-projects", "/special-projects/:id",
        "/maintain-projects", "/maintain-projects/:id",
        "/all-project", "/eng-profile", "/eng-notification",
        "/eng-attendance", "/boot-info", "/myvacations", "/custodieseng",
        "/rehabilitation-works", "/rehabilitation-works/:id",
        "/emergency-projects", "/emergency-projects/:id",
        "/construction-projects", "/construction-projects/:id",
        "statics",
      ].some((route) =>
        location.pathname.match(new RegExp("^" + route.replace(":id", "[0-9a-zA-Z-]+") + "$"))
      ));

  const fb = getFallback(userData?.userType); 
  return (
    <div className="">
      {showNavbarAndFooter && <Navbar userData={userData} />}
      <div className={showNavbarAndFooter ? "pt-28" : ""}>
        <Routes>
          {/* ── Public ── */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Login setUserData={setUserData} />} />

         
          {userData &&
            (userData.userType === "admin" ||
              userData.userType === "supervisor" ||
              userData.userType === "officeManager") && (
            <>
             <Route
              element={
                <SidebarProvider>
                  <Layout />
                </SidebarProvider>
              }
            >
             <Route path="/home-page" element={<DashboardShell />} />
             {/* <Route path="/home-pagee" element={<Dashboard />} /> */}
             
              {/* بحث الطلبات → أي View من modules المشاريع */}
              <Route path="/search-requests"
                element={PA(PROJECT_VIEW_PERMS, <SearchRequests />, fb)} />
              {/* <Route
                path="/admin-projects"
                element={PA(PROJECT_VIEW_PERMS, <AdminProjects />, fb)}
              /> */}
              <Route
                path="/admin-projects/:type"
                element={
                  PA(
                    PROJECT_VIEW_PERMS,
                    <AdminProjectCreate userData={userData} />,
                    fb
                  )
                }
              />

              {/* أوامر العمل → أي View من modules المشاريع أو أنواع الأوامر */}
              <Route path="/orders"
                element={PA([...PROJECT_VIEW_PERMS, "WorkOrderType.View"], <Orders />, fb)} />

              {/* تحديث التنفيذ اليومي */}
              <Route path="/daily-execution"
                element={PA(PROJECT_UPDATE_PERMS, <DailyExecutionPage />, fb)} />

              {/* لوحة المتابعة والمؤشّرات */}
              <Route path="/monitoring"
                element={P("ContractWorkflow.View", <MonitoringPage />, fb)} />

              {/* قالب إنشاء أمر عمل الإنشاءات */}
              <Route path="/work-orders/new/construction"
                element={P("Construction.Create", <ConstructionCreatePage />, fb)} />

              {/* متابعة التنفيذ */}
              <Route path="/execution-tracking"
                element={P("ContractWorkflow.View", <ExecutionTrackingPage />, fb)} />

              {/* إعدادات العقد — مركز واحد: العقود، الأقسام والسلال، الأنواع، الفريق، الأسعار */}
              <Route path="/contract-settings"
                element={P("ContractWorkflow.View", <ContractHubPage />, fb)} />

              {/* الروابط القديمة تُحوّل إلى المركز بدل أن تنكسر على من حفظها */}
              <Route path="/contract-workflow" element={<Navigate to="/contract-settings" replace />} />
              <Route path="/settings" element={<Navigate to="/contract-settings" replace />} />

              {/* إدارة الصلاحيات */}
              <Route path="/access-management"
                element={P("Users.ManagePermissions", <AccessManagementPage />, fb)} />

              {/* تفاصيل مشروع → أي View */}
              <Route path="/project/:type/:id"
                element={PA(PROJECT_VIEW_PERMS, <Project />, fb)} />

              {/* المهندسون → Employees.View */}
              <Route path="/engineers"
                element={P("Employees.View", <Engineers />, fb)} />

              {/* الاستشاريون → Consultant.View */}
              <Route path="/consultants"
                element={P("Consultant.View", <Consultants />, fb)} />

              {/* كل المشاريع → أي View */}
              <Route path="/admin-projects"
                element={PA(PROJECT_VIEW_PERMS, <AdminProjects />, fb)} />

              {/* المشاريع الخاصة → PrivateProject.View */}
              <Route path="/all-admin-private-project"
                element={P("PrivateProject.View", <AllAdminPrivateProject />, fb)} />

              {/* المشاريع المحذوفة → أي Delete */}
              <Route path="/deleted-projects"
                element={PA(ALL_DELETE_PERMS, <DeleteOrders />, fb)} />

              {/* طلبات انتظار الموافقة → أي Approve */}
              <Route path="/accept-requests"
                element={PA(ALL_APPROVE_PERMS, <RequestsWaiting />, fb)} />

              {/* الموافقة على الحذف → أي Delete */}
              <Route path="/accept-delete"
                element={PA(ALL_DELETE_PERMS, <AcceptDeteleOrders />, fb)} />

              {/* بيانات الفرع → Branch.View */}
              <Route path="/admin-branch-data"
                element={P("Branch.View", <AdminBranchData />, fb)} />

              {/* ملف مدير المكتب → Office.View */}
              <Route path="/manager-profile"
                element={P("Office.View", <OfficeMangerProfile />, fb)} />

              {/* أنواع المهام → WorkOrderType.View */}
              <Route path="/tasktype"
                element={P("WorkOrderType.View", <TaskType />, fb)} />

              {/* إضافة / تعديل حساب → Users.Create */}
              <Route path="/add-account"
                element={P("Users.Create", <AddAccount />, fb)} />
              <Route path="/add-account/:id"
                element={P("Users.Create", <AddAccount />, fb)} />

              {/* عرض الحسابات → Users.View */}
              <Route path="/accounts"
                element={P("Users.View", <Accounts />, fb)} />

              {/* الإشعارات → Notifications.View */}
              <Route path="/notification"
                element={P("Notifications.View", <NotificationPage />, fb)} />

              {/* الأحياء → Neighborhood.View */}
              <Route path="/district"
                element={P("Neighborhood.View", <Areas />, fb)} />

              {/* العهدة → Custody.View */}
              <Route path="/custodies"
                element={P("Custody.View", <Custodies />, fb)} />

              {/* الفروع → Branch.View */}
              <Route path="/branches"
                element={P("Branch.View", <Branches />, fb)} />

              {/* المكاتب → Office.View */}
              <Route path="/offices"
                element={P("Office.View", <Offices />, fb)} />

              {/* الموظفون → Employees.View */}
              {/* قسم الموظفين الموحّد: السجلّ والملفات والمستندات والإجازات
                  والتقويم والحضور والاستيراد. */}
              <Route path="/employees"
                element={P("Employees.View", <EmployeeHubPage />, fb)} />

              {/* الإجازات → LeaveRequest.View */}
              <Route path="/vacations"
                element={P("LeaveRequest.View", <Vacations />, fb)} />

              {/* المسار القديم /add-permission حلّت محله /access-management.
                  يُحوَّل إليه حتى لا تنكسر الروابط المحفوظة. */}
              <Route path="/add-permission" element={<Navigate to="/access-management" replace />} />

              {/* الحضور → Attendance.View */}
              <Route path="/check-attendance"
                element={P("Attendance.View", <CheckAttendanceAdmin />, fb)} />
                

              <Route path="/project-parties"  element={P("ProjectParty.View", <ProjectParties />, fb)}  />

              <Route path="/project-owners"  element={P("ProjectOwner.View", <ProjectOwners />, fb)} />

              <Route path="/profile"  element={P("profile.View", <EngProfile />, fb)} />
                </Route>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Engineer routes
          ══════════════════════════════════════════════════════════════ */}
          {userData?.userType === "eng" && (
            <>
              {/* صفحات مفتوحة لكل المهندسين */}
              <Route path="/main-page"              element={<MainPage userData={userData} />} />
              <Route path="/sub-page/:name"         element={<Subscribers />} />
              <Route path="/submit-application"     element={<SubmitApplication userData={userData} />} />
              <Route path="/submit-application/:id" element={<SubmitApplication userData={userData} />} />
              <Route path="/statics"                element={<EngStatcis />} />
              <Route path="/eng-notification"       element={<EngNotification />} />
              <Route path="/requests/:namepage/:name" element={<ArchivedRequests userData={userData} />} />
              <Route path="/electricRequests"       element={<OperateMaintains />} />
              <Route path="/boot-info"              element={<BootInfo userData={userData} />} />
              <Route path="/eng-profile"            element={<EngProfile userData={userData} />} />
              <Route path="/contactus"              element={<Contactus />} />
              <Route path="/about"                  element={<About />} />
              <Route path="/projects"               element={<AllProject userData={userData} />} />
              <Route path="/special-projects"       element={<SpecialProjects userData={userData} />} />
              <Route path="/special-projects/:id"   element={<SpecialProjects userData={userData} />}/>
              
              {/* صفحات محمية بـ Permission */}
              <Route path="/eng-attendance"
                element={P("Attendance.View",    <EngAttendance />,                     "/main-page")} />
              <Route path="/myvacations"
                element={P("LeaveRequest.View",  <MyVacations />,                       "/main-page")} />
              <Route path="/custodieseng"
                element={P("Custody.View",       <CustodiesEngContent />,               "/main-page")} />
              <Route path="/rehabilitation-works"
                element={P("NewProject.View",    <RehabilitationWorks userData={userData} />, "/main-page")} />
              <Route path="/rehabilitation-works/:id"
                element={P("NewProject.View",    <RehabilitationWorks userData={userData} />, "/main-page")} />
              <Route path="/emergency-projects"
                element={P("Emergency.View",     <EmergencyProjects userData={userData} />,   "/main-page")} />
              <Route path="/emergency-projects/:id"
                element={P("Emergency.View",     <EmergencyProjects userData={userData} />,   "/main-page")} />
              <Route path="/construction-projects"
                element={P("Construction.View",  <Construction userData={userData} />,        "/main-page")} />
              <Route path="/construction-projects/:id"
                element={P("Construction.View",  <Construction userData={userData} />,        "/main-page")} />
              <Route path="/special-projects"
                element={P("PrivateProject.View",<SpecialProjects userData={userData} />,     "/main-page")} />
              <Route path="/special-projects/:id"
                element={P("PrivateProject.View",<SpecialProjects userData={userData} />,     "/main-page")} />
              <Route path="/maintain-projects"
                element={P("Maintenance.View",   <MainTainPage userData={userData} />,        "/main-page")} />
              <Route path="/maintain-projects/:id"
                element={P("Maintenance.View",   <MainTainPage userData={userData} />,        "/main-page")} />
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Contractor routes
          ══════════════════════════════════════════════════════════════ */}
       {userData?.userType === "contractor" && (
          <>
            <Route path="/projects" element={<AllProject userData={userData} />} />
            <Route path="/construction-projects" element={<Construction userData={userData} />} />
            <Route path="/construction-projects/:id" element={<Construction userData={userData} />} />
            <Route path="/maintain-projects" element={<MainTainPage userData={userData} />} />
            <Route path="/maintain-projects/:id" element={<MainTainPage userData={userData} />} />
            <Route path="/emergency-projects" element={<EmergencyProjects userData={userData} />} />
            <Route path="/emergency-projects/:id" element={<EmergencyProjects userData={userData} />} />
            <Route path="/rehabilitation-works" element={<RehabilitationWorks userData={userData} />} />
            <Route path="/rehabilitation-works/:id" element={<RehabilitationWorks userData={userData} />} />
            <Route path="/special-projects" element={<SpecialProjects userData={userData} />} />
            <Route path="/special-projects/:id" element={<SpecialProjects userData={userData} />} />
          </>
        )}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showNavbarAndFooter && <Footer />}
    </div>
  );
}

function getFallback(userType) {
  switch (userType) {
    case "eng":        return "/main-page";
    case "contractor": return "/projects";
    // supervisor / officeManager → مفيش داشبورد ليهم، يرجعوا للـ login
    // أو أول صفحة عندهم صلاحية عليها (بيتحدد بعد كده من الـ Sidebar)
    default:           return "/";
  }
}

export default App;