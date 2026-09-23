import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../Component/Sidebar/Sidebar";
import Header from "../../Component/Header/Header";
import DeletedProjects from "./DeletedProjects";
import PrivateProjects from "./PrivateProjects";
import MaintenanceRequests from "./MaintainceProjects";
import Operations from "./OperationsProjects";
import { Url } from "../../function/FunctionApi";

function DeleteOrders() {
  const [activeTab, setActiveTab] = useState("المشاريع"); // Default tab
  const [projects, setProjects] = useState({
    rehabilitationWorks: [],
    privateProjects: [],
    constructions: [],
    emergencies: [],
    maintenances: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    "الانشاءات", // Matches default activeTab
    // "المشاريع الخاصة",
    "الانشاءات",
    "الصيانة",
    "الطوارئ",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${Url}Search/get-deleted-projects`);
        const {
          rehabilitationWorks,
          privateProjects,
          constructions,
          emergencies,
          maintenances,
        } = response.data;

        setProjects({
          rehabilitationWorks,
          privateProjects,
          constructions,
          emergencies,
          maintenances,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة لاحقًا.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "المشاريع":
        return projects.rehabilitationWorks.length === 0 ? (
          <p>لا توجد مشاريع محذوفة.</p>
        ) : (
          <DeletedProjects
            type={"rehabilitationworks"}
            projects={projects?.rehabilitationWorks || []}
          />
        );
      case "المشاريع الخاصة":
        return projects.privateProjects.length === 0 ? (
          <p>لا توجد مشاريع خاصة.</p>
        ) : (
          <PrivateProjects
            type={"privateproject"}
            projects={projects?.privateProjects || []}
          />
        );
      case "الصيانة":
        return projects.maintenances.length === 0 ? (
          <p>لا توجد طلبات صيانة.</p>
        ) : (
          <DeletedProjects
            type={"maintenance"}
            projects={projects?.maintenances || []}
          />
        );
      case "الانشاءات":
        return projects.constructions.length === 0 ? (
          <p>لا توجد مشاريع إنشائية.</p>
        ) : (
          <DeletedProjects
            type={"construction"}
            projects={projects?.constructions || []}
          />
        );
      case "الطوارئ":
        return projects.emergencies.length === 0 ? (
          <p>لا توجد مشاريع طوارئ.</p>
        ) : (
          <DeletedProjects
            type={"emergency"}
            projects={projects?.emergencies || []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="apDiv">
      <div className="flex-1 flex flex-col" dir="rtl">

        <div className="p-6">
          <div className="flex space-x-4 border-b border-gray-300 pb-2 mb-4 rtl:space-x-reverse">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                  activeTab === tab
                    ? "bg-mainColor text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-md shadow-md">
            {loading ? (
              <div className="flex justify-center items-center">
                <span className="spinner-border animate-spin">
                  جاري التحميل...
                </span>
              </div>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteOrders;
