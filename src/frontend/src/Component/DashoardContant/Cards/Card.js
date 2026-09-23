import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/apiClient";
import "./Card.css";
import img1 from "../../../Image/eng1.jpeg";
import img2 from "../../../Image/m2.jpeg";
import img3 from "../../../Image/tn3.jpeg";

const Cards = () => {
  const navigate = useNavigate();

  const { data: situationData, isLoading } = useQuery({
    queryKey: ["situationCounts"],
    queryFn: async () => {
      const response = await axiosInstance.get("/Admin/situation-counts");
      return response.data.data;
    },
  });

  const handleCardClick = (situation, projectType = null) => {
    if (projectType) {
      navigate(
        `/admin-projects/?projectType=${projectType}&situation=${encodeURIComponent(
          situation
        )}`
      );
    } else {
      navigate(`/admin-projects?situation=${encodeURIComponent(situation)}`);
    }
  };

  const handleProjectClick = (projectType) => {
    navigate(`/admin-projects/${projectType}`);
  };

  const getSituationColor = (situation) => {
    const colors = {
      "تحت التنفيذ": "bg-mainColor/20 text-mainColor",
      "تم التنفيذ": "bg-secondaryColor/20 text-secondaryColor",
      "صدور شهادة الإنجاز": "bg-mainColor/30 text-mainColor",
      "دخلت مستخلص": "bg-secondaryColor/30 text-secondaryColor",
      "تم الصرف": "bg-mainColor/40 text-mainColor",
      "لا يحتاج تصريح": "bg-secondaryColor/40 text-secondaryColor",
    };
    return colors[situation] || "bg-gray-100 text-gray-800";
  };

  const renderSituationCard = (item, projectType = null) => {
    console.log("item " + item.totoalActualValue);
    console.log("item " + item.totalEstimatedValue);
    const colorClasses = getSituationColor(item.situation);

    return (
      <div
        key={item.situation}
        className="bg-white rounded-md p-2 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-sm border border-secondaryColor/20 hover:border-secondaryColor flex flex-col items-center gap-1"
        onClick={() => handleCardClick(item.situation, projectType)}
      >
        <div
          className={`${colorClasses} py-2 px-2 rounded-lg text-lg font-medium text-center w-full`}
        >
          <h4 className="text-xs  font-bold truncate">{item.situation}</h4>
        </div>
        <div className="text-lg font-bold text-mainColor">{item.count}</div>
        <div className="flex justify-between gap-3 w-full items-center flex-wrap">
          <div className="text-sm text-secondaryColor flex items-center gap-1">
            <span className="text-xs  bg-gray-200 rounded p-1 font-bold">
              القيمه الفعليه
            </span>
            {item.totoalActualValue}
          </div>
          <div className="text-sm font-bold text-mainColor flex items-center gap-1">
            <span className="text-xs  bg-gray-200 p-1 rounded font-bold">
              القيمه التقديريه
            </span>
            {item.totalEstimatedValue}
          </div>
        </div>
      </div>
    );
  };

  const renderProjectSection = (data, title, projectType = null) => {
    if (!data) return null;

    return (
      <div
        className="bg-white w-full rounded-lg shadow-sm p-3 transition-all duration-300 h-full border border-mainColor/20 hover:border-mainColor cursor-pointer relative overflow-hidden hover:transform hover:-translate-y-1 hover:shadow-md"
        key={title}
        // onClick={() => projectType && handleProjectClick(projectType)}
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-mainColor/20">
          <img
            className="w-8 h-8 object-cover rounded-md shadow-sm"
            src={img3}
            alt={title}
          />
          <h3 className="text-base font-semibold text-mainColor">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.map((item) => renderSituationCard(item, projectType))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="w-8 h-8 border-4 border-secondaryColor/20 border-t-4 border-t-mainColor rounded-full loading-spinner"></div>
        <p className="text-mainColor text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50" id="BarChart-Cards">
      {/* Overall Statistics Section - Full Width */}
      <div className="mb-4">
        {renderProjectSection(situationData?.overall, "إحصائيات عامة")}
      </div>

      {/* Project Sections - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4  mx-auto">
        {/* Rehabilitation Works Section */}
        {renderProjectSection(
          situationData?.rehabilitationworks,
          "مشاريع التأهيل",
          "rehabilitationworks"
        )}

        {/* Construction Projects Section */}
        {renderProjectSection(
          situationData?.constructionProjects,
          "مشاريع البناء",
          "constructionProjects"
        )}

        {/* Emergency Projects Section */}
        {renderProjectSection(
          situationData?.emergencyProjects,
          "مشاريع الطوارئ",
          "emergencyProjects"
        )}

        {/* Maintenance Projects Section */}
        {renderProjectSection(
          situationData?.maintenanceProjects,
          "مشاريع الصيانة",
          "maintenanceProjects"
        )}
      </div>
    </div>
  );
};

export default Cards;
