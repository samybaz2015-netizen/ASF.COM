import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Login from "./Pages/Login/Login";
import Footer from "./Component/Footer/Footer";
import NotFound from "./Pages/NotFound/NotFound";
import { getCookie } from "./Pages/Login/Login";
import Navbar from "./Component/NavBar/Navbar";
import "./assets/css/all.css";
import DashBoard from "./Pages/Dashoard/Dashboard";
import SearchRequests from "./Pages/SearchRequests/SearchRequestsPage";
import Orders from "./Pages/Orders/OrderPage";
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
import ProjectOwners from "./Pages/ProjectOwners/ProjectOwners";
import ProjectParties from "./Pages/ProjectParties/ProjectParties";

function App() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const userCookie = getCookie("user");
    if (userCookie) {
      try {
        setUserData(JSON.parse(userCookie));
      } catch (e) {
        console.error("Error parsing user cookie:", e);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const cookieValue = getCookie("user");
    if (
      !cookieValue &&
      location.pathname !== "/" &&
      location.pathname !== "/reset-password"
    ) {
      navigate("/");
    }
  }, [navigate, location.pathname]);

  const showNavbarAndFooter =
    userData &&
    userData.userType === "eng" &&
    (location.pathname.toLowerCase().startsWith("/sub-page/") ||
      location.pathname.toLowerCase().startsWith("/requests/") ||
      [
        "/main-page",
        "/submit-application",
        "/submit-application/:id",
        "/operations-maintenance",
        "/operations-maintenance/:id",
        "/request-projects",
        "/request-projects/:id",
        "/contactus",
        "/about",
        "/projects",
        "/operate-maintain",
        "/Request-projects",
        "/request-projects/:id",
        "/special-projects",
        "/special-projects/:id",
        "/maintains",
        "/maintain-projects",
        "operations-maintenance",
        "statics",
        "/maintains/:id",
        "/all-project",
        "/electricRequests",
        "/eng-profile",
        "/eng-notification", 
        "/eng-attendance",
        "/boot-info",
         "/myvacations",
         "/custodieseng",
      ].some((route) =>
        location.pathname.match(new RegExp(route.replace(":id", "[0-9]*")))
      ));
      useEffect(()=>{

        console.log("userType:", userData?.userType);
      },[])

  return (
    <div className="">
      {showNavbarAndFooter && <Navbar userData={userData} />}
      <div className={showNavbarAndFooter ? "pt-28" : ""}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={<Login setUserData={setUserData} />} />

        {userData &&
          (userData.userType === "admin" ||
            userData.userType === "supervisor" ||
            userData.userType === "officeManager") && (
            <>  
              <Route path="/tasktype" element={<TaskType />} />
              <Route path="/accept-requests" element={<RequestsWaiting />} />
              <Route path="/home-page" element={<DashBoard />} />
              <Route path="/search-requests1" element={<SearchRequests />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/project/:type/:id" element={<Project />} />
              <Route path="/add-account" element={<AddAccount />} />
              <Route path="/add-account/:id" element={<AddAccount />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/engineers" element={<Engineers />} />
              <Route path="/consultants" element={<Consultants />} />
              <Route path="/admin-projects" element={<AdminProjects />} />
              <Route path="/deleted-projects" element={<DeleteOrders />} />
              <Route path="/notification" element={<NotificationPage />} />
              <Route path="/district" element={<Areas />} /> 
              <Route path="/custodies" element={<Custodies />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/admin-branch-data" element={<AdminBranchData />} />
              <Route path="/offices" element={<Offices />} />
              <Route
                path="/all-admin-private-project"
                element={<AllAdminPrivateProject />}
              />
              <Route
                path="/manager-profile"
                element={<OfficeMangerProfile />}
              />
              <Route path="/employees" element={<Employees />} />
              <Route path="/vacations" element={<Vacations />} />
              <Route path="/accept-delete" element={<AcceptDeteleOrders />} />

              <Route path="/add-permission" element={<AddUserPermission />} />
              <Route path="/check-attendance" element={<CheckAttendanceAdmin />} />

              <Route path="/project-parties" element={<ProjectParties />} />
              <Route path="/project-owners"  element={<ProjectOwners />} />
            </>
          )}

        {userData && userData.userType === "eng" && (
          <>
            <Route
              path="/main-page"
              element={<MainPage userData={userData} />}
            />
            <Route path="/sub-page/:name" element={<Subscribers />} />
            <Route
              path="/submit-application"
              element={<SubmitApplication userData={userData} />}
            />
            <Route
              path="/submit-application/:id"
              element={<SubmitApplication userData={userData} />}
            />

            <Route path="/statics" element={<EngStatcis />} />
            <Route path="/eng-notification" element={<EngNotification />} />
            <Route path="/eng-attendance" element={<EngAttendance />} />
            <Route path="/myvacations" element={<MyVacations />} />
            <Route path="/custodieseng" element={<CustodiesEngContent />} />

            <Route
              path="/requests/:namepage/:name"
              element={<ArchivedRequests userData={userData} />}
            />
            <Route path="/electricRequests" element={<OperateMaintains />} />
            {/* <Route
              path="/operations-maintenance"
              element={<OperationsMaintenance userData={userData} />}
            />

            <Route
              path="/operations-maintenance/:id"
              element={<OperationsMaintenance userData={userData} />}
            /> */}
            {/* <Route
              path="/request-projects"
              element={<NewRequest userData={userData} />}
            />
            <Route
              path="/request-projects/:id"
              element={<NewRequest userData={userData} />}
            /> */}

            <Route
              path="/rehabilitation-works"
              element={<RehabilitationWorks userData={userData} />}
            />

            <Route
              path="/rehabilitation-works/:id"
              element={<RehabilitationWorks userData={userData} />}
            />

            <Route
              path="/emergency-projects"
              element={<EmergencyProjects userData={userData} />}
            />

            <Route
              path="/emergency-projects/:id"
              element={<EmergencyProjects userData={userData} />}
            />

            <Route
              path="/construction-projects"
              element={<Construction userData={userData} />}
            />
 
            <Route
              path="/boot-info"
              element={<BootInfo userData={userData} />}
            />
            <Route
              path="/eng-profile"
              element={<EngProfile userData={userData} />}
            />

            <Route
              path="/construction-projects/:id"
              element={<Construction userData={userData} />}
            />
            <Route
              path="/special-projects"
              element={<SpecialProjects userData={userData} />}
            />
            <Route
              path="/special-projects/:id"
              element={<SpecialProjects userData={userData} />}
            />
            <Route
              path="/maintain-projects"
              element={<MainTainPage userData={userData} />}
            />
            <Route
              path="/maintain-projects/:id"
              element={<MainTainPage userData={userData} />}
            />
            <Route path="/contactus" element={<Contactus />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/projects"
              element={<AllProject userData={userData} />}
            />
          </>
        )}

      {userData && userData.userType === "contractor" && (
          <>
          <Route
                path="/construction-projects"
                element={<Construction userData={userData} />}
              />
            <Route
                path="/construction-projects/:id"
                element={<Construction userData={userData} />}
              />
            <Route
                path="/projects"
                element={<AllProject userData={userData} />}
              />
          </>
        )}

      {userData && userData.userType !== "admin" && (
        <Route path="/myvacations" element={<MyVacations />} />
      )}

        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      {showNavbarAndFooter && <Footer />}
    </div>
  );
}

export default App;
