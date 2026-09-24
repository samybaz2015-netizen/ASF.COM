import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import Item from "./item";
import { useNavigate } from "react-router-dom";
import LogOut from "../../Component/LogOut/LogOut";
import imgUser from "../../Image/team-01.png";
import { useSidebar } from "../../Context/SidebarContext";
import { getDriveImageUrl } from "../../util/Driveimage";
import { clearUserSession, getUserSession } from "../../function/AuthStorage";

const menuItems = [
  { id: "home", icon: "fa-duotone fa-solid fa-chart-pie-simple", name: "الرئيسيه", link: "/home-page", roles: ["admin"], adminOnly: true },
  { id: "search", icon: "fa-light fa-chart-simple", name: "بحث الطلبات", link: "/search-requests", roles: ["all"], anyOf: ["Construction.View", "Emergency.View", "Maintenance.View", "NewProject.View", "PrivateProject.View"] },
  { id: "private-projects", icon: "fa-light fa-building", name: "المشاريع الخاصة", link: "/all-admin-private-project", roles: ["all"], permission: "PrivateProject.View" },
  { id: "add-account", icon: "fa-light fa-bag-shopping", name: "الحسابات", link: "/accounts", roles: ["all"], permission: "Users.View" },
  { id: "branches", icon: "fa-solid fa-code-branch", name: "الافرع", link: "/branches", roles: ["all"], permission: "Branch.View" },
  { id: "employees", icon: "fa-light fa-users", name: "الموظفون", link: "/employees", roles: ["all"], permission: "Employees.View" },
  { id: "offices", icon: "fa-solid fa-building", name: "المكاتب", link: "/offices", roles: ["all"], permission: "Office.View" },
  { id: "districts", icon: "fa-light fa-city", name: "الاحياء", link: "/district", roles: ["all"], permission: "Neighborhood.View" },
  { id: "consultants", icon: "fa-light fa-user-tie", name: "الاستشاريون", link: "/consultants", roles: ["all"], permission: "Consultant.View" },
  { id: "project-owners", icon: "fa-light fa-user", name: "ملاك المشاريع", link: "/project-owners", roles: ["all"], permission: "ProjectOwner.View" },
  { id: "project-parties", icon: "fa-light fa-building", name: "جهات المشاريع", link: "/project-parties", roles: ["all"], permission: "ProjectParty.View" },
  { id: "accept-requests", icon: "fa-solid fa-check-circle", name: "قبول الطلبات", link: "/accept-requests", roles: ["all"], anyOf: ["Construction.Approve", "Emergency.Approve", "Maintenance.Approve", "NewProject.Approve", "PrivateProject.Approve"] },
  { id: "delete-requests", icon: "fa-solid fa-trash", name: "طلبات الحذف", link: "/accept-delete", roles: ["all"], anyOf: ["Construction.Delete", "Emergency.Delete", "Maintenance.Delete", "NewProject.Delete", "PrivateProject.Delete"] },
  { id: "custodies", icon: "fa-solid fa-box", name: "العهد", link: "/custodies", roles: ["all"], permission: "Custody.View" },
  { id: "notifications", icon: "fa-light fa-bell", name: "الاشعارات", link: "/notification", roles: ["all"], permission: "Notifications.View" },
  { id: "trash", icon: "fa fa-trash", name: "سلة المهملات", link: "/deleted-projects", roles: ["all"], anyOf: ["Construction.Delete", "Emergency.Delete", "Maintenance.Delete", "NewProject.Delete", "PrivateProject.Delete"] },
  { id: "daily-execution", icon: "fa-light fa-calendar-day", name: "تحديث التنفيذ اليومي", link: "/daily-execution", roles: ["all"], anyOf: ["Construction.Update", "Emergency.Update", "Maintenance.Update", "NewProject.Update", "PrivateProject.Update"] },
  { id: "monitoring", icon: "fa-light fa-gauge-high", name: "لوحة المتابعة", link: "/monitoring", roles: ["all"], permission: "ContractWorkflow.View" },
  { id: "execution-tracking", icon: "fa-light fa-list-check", name: "متابعة التنفيذ", link: "/execution-tracking", roles: ["all"], permission: "ContractWorkflow.View" },
  { id: "contract-settings", icon: "fa-light fa-file-signature", name: "إعدادات العقد", link: "/contract-settings", roles: ["all"], permission: "ContractWorkflow.View" },
  { id: "access-management", icon: "fa-light fa-shield-halved", name: "إدارة الصلاحيات", link: "/access-management", roles: ["all"], permission: "Users.ManagePermissions" },
  { id: "profile", icon: "fa-light fa-id-card", name: "الملف الشخصي", link: "/profile", roles: ["all"] },
];

function getUserPermissions() {
  const user = getUserSession();
  return user?.permissions || [];
}

function checkPermission(item, userPerms, isAdmin) {
  if (item.adminOnly) return isAdmin;
  if (isAdmin) return true;
  if (!item.permission && !item.anyOf) return true;
  if (item.permission) return userPerms.includes(item.permission);
  if (item.anyOf?.length) return item.anyOf.some((p) => userPerms.includes(p));
  return false;
}

function Sidebar() {
  const navigate = useNavigate();
  const { open, toggle } = useSidebar();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  const cookieValue = useMemo(() => getUserSession() || {}, []);
  const userRole = cookieValue.userType || "";
  const isAdmin = userRole === "admin";
  const userPerms = useMemo(() => getUserPermissions(), []);

  const userImageSrc = useMemo(() => getDriveImageUrl(cookieValue.userImage) || imgUser, [cookieValue.userImage]);

  const handleLogoutClick = () => setLogoutDialogOpen(true);

  const functionLogout = () => {
    clearUserSession();
    localStorage.clear();
    navigate("/");
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const roleOk = item.roles.includes("all") || item.roles.includes(userRole);
      if (!roleOk) return false;
      return checkPermission(item, userPerms, isAdmin);
    });
  }, [userRole, userPerms, isAdmin]);

  const menuGroups = useMemo(() => {
    const getItems = (ids) => filteredMenuItems.filter((item) => ids.includes(item.id));

    return {
      requests: getItems(["search", "monitoring", "execution-tracking", "daily-execution", "accept-requests", "delete-requests", "trash"]),
      projects: getItems(["private-projects", "consultants", "project-owners", "project-parties"]),
      management: getItems(["branches", "offices", "districts"]),
      // الإجازات والحضور والحسابات صارت تبويبات داخل «الموظفون»، فمدخلٌ
      // واحد يقودها كلها بدل أربعة تعرض البيانات نفسها بصيغ مختلفة.
      employees: getItems(["employees", "add-account", "custodies"]),
      system: getItems(["notifications", "contract-settings", "access-management"]),
    };
  }, [filteredMenuItems]);

  const homeItem = filteredMenuItems.find((item) => item.id === "home");
  const profileItem = filteredMenuItems.find((item) => item.id === "profile");

  const toggleGroup = (group) => {
    setOpenGroup((prev) => (prev === group ? null : group));
  };

  const sideContainerVariants = {
    true: { width: "15rem" },
    false: { width: "5rem", transition: { delay: 0.4 } },
  };

  const sidebarVariants = {
    true: { width: "240px" },
    false: { width: "5rem", transition: { delay: 0.3 } },
  };

  const GroupHeader = ({ title, group, icon }) => {
    const isGroupOpen = openGroup === group;

    return (
      <motion.button type="button" onClick={() => toggleGroup(group)} whileTap={{ scale: 0.98 }} className={`group relative w-full flex items-center ${open ? "justify-between" : "justify-center"} gap-2 px-2 py-1.5 mb-1 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors duration-200 cursor-pointer shrink-0`}>
        <div className={`flex items-center gap-3 ${!open ? "justify-center w-full" : ""}`}>
          <div className="w-8 h-8 min-w-[32px] flex items-center justify-center shrink-0 rounded-md text-white/60">
            <i className={`${icon} text-[14px]`} />
          </div>

          {open && (
            <span className="text-[13px] font-medium font-cairo whitespace-nowrap leading-none">
              {title}
            </span>
          )}
        </div>

        {open && (
          <motion.div animate={{ rotate: isGroupOpen ? 180 : 0 }} transition={{ duration: 0.18 }} className="w-5 h-5 min-w-[20px] flex items-center justify-center shrink-0 text-white/35 group-hover:text-white/70">
            <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
          </motion.div>
        )}
      </motion.button>
    );
  };

  const GroupItems = ({ group }) => {
    const items = menuGroups[group];

    if (!items?.length || !open || openGroup !== group) return null;

    return (
      <AnimatePresence initial={false}>
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
          <div className="relative mr-5 pr-3 mb-2">
            <span className="absolute right-0 top-1 bottom-1 w-px bg-white/[0.10]" />

            <div className="flex flex-col gap-0.5">
              {items.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15, delay: index * 0.025 }} className="w-full min-w-0">
                  <Item id={item.id} icon={item.icon} name={item.name} link={item.link} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <motion.div data-open={open} variants={sideContainerVariants} initial={`${open}`} animate={`${open}`} className="fixed top-0 right-0 h-screen z-[1001]">
        <motion.div initial={`${open}`} animate={`${open}`} variants={sidebarVariants} className="flex flex-col w-full h-full box-border p-4 m-0 bg-mainColor text-white backdrop-blur-md border border-white/20 [direction:rtl] transition-[width] duration-300 ease-in-out overflow-hidden">

          <motion.div whileHover={{ rotate: 90, backgroundColor: "rgba(255,255,255,0.08)" }} transition={{ duration: 0.2 }} onClick={toggle} className="flex self-end items-center justify-center w-8 h-8 cursor-pointer mb-4 text-base rounded-lg shrink-0">
            <FontAwesomeIcon icon={faListUl} />
          </motion.div>

          <div className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden">

            {homeItem && (
              <div className="mb-2 shrink-0">
                <Item id={homeItem.id} icon={homeItem.icon} name={homeItem.name} link={homeItem.link} />
              </div>
            )}

            {menuGroups.requests.length > 0 && (
              <div className="mb-1 shrink-0">
                <GroupHeader title="الطلبات" group="requests" icon="fa-light fa-file-lines" />
                <GroupItems group="requests" />
              </div>
            )}

            {menuGroups.projects.length > 0 && (
              <div className="mb-1 shrink-0">
                <GroupHeader title="المشاريع" group="projects" icon="fa-light fa-building" />
                <GroupItems group="projects" />
              </div>
            )}

            {menuGroups.management.length > 0 && (
              <div className="mb-1 shrink-0">
                <GroupHeader title="الإدارة" group="management" icon="fa-light fa-gear" />
                <GroupItems group="management" />
              </div>
            )}

            {menuGroups.employees.length > 0 && (
              <div className="mb-1 shrink-0">
                <GroupHeader title="العاملين والموارد" group="employees" icon="fa-light fa-users" />
                <GroupItems group="employees" />
              </div>
            )}

            {menuGroups.system.length > 0 && (
              <div className="mb-1 shrink-0">
                <GroupHeader title="النظام" group="system" icon="fa-light fa-sliders" />
                <GroupItems group="system" />
              </div>
            )}

            {userRole === "officeManager" && (
              <div className="mb-1 shrink-0">
                <Item id="office-manager" icon="fa-light fa-user-tie" name="مدير المكتب" link="/manager-profile" />
              </div>
            )}

            {profileItem && (
              <div className="mt-1 shrink-0">
                <Item id={profileItem.id} icon={profileItem.icon} name={profileItem.name} link={profileItem.link} />
              </div>
            )}
          </div>

          {cookieValue && (
            <motion.div className={`bg-white text-mainColor rounded-xl transition-all duration-300 w-full shrink-0 mt-2 flex items-center ${open ? "p-3 opacity-100" : "p-1.5 opacity-0 pointer-events-none h-0 overflow-hidden"}`}>
              <img src={userImageSrc} alt="User" onError={(e) => { e.currentTarget.src = imgUser; }} className="w-10 h-10 rounded-full mr-2.5 shrink-0 object-cover" />

              <div className="text-right whitespace-normal break-words min-w-0 flex-1">
                <h4 className="m-0 text-sm whitespace-normal break-words">{cookieValue.userName}</h4>
                <p className="m-0 text-xs text-gray-500">{cookieValue.email}</p>
              </div>
            </motion.div>
          )}

          {cookieValue && (
            <button onClick={handleLogoutClick} className={`bg-white/10 text-white border border-white/20 rounded-md cursor-pointer transition-colors duration-300 hover:bg-secondaryColor shrink-0 w-full mt-2 ${open ? "text-sm px-4 py-2" : "text-[8px] px-1 py-2"}`}>
              {open ? "تسجيل الخروج" : "خروج"}
            </button>
          )}
        </motion.div>
      </motion.div>

      <LogOut open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} onConfirm={functionLogout} />
    </>
  );
}

export default Sidebar;