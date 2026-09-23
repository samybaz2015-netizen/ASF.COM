import React from "react";
import { useParams } from "react-router-dom";

import Construction from "../../Construction/Construction";
import EmergencyProjects from "../../EmergencyProjects/EmergencyProjects";
import MainTainPage from "../../Maintains/Maintains";
import RehabilitationWorks from "../../RehabilitationWorks/RehabilitationWorks";
import SpecialProjects from "../../SpecialProjects/SpecialProjects";

const PROJECT_COMPONENTS = {
  construction: Construction,
  emergency: EmergencyProjects,
  maintenance: MainTainPage,
  rehabilitation: RehabilitationWorks,
  private: SpecialProjects,
};

export default function AdminProjectCreate({ userData }) {
  const { type } = useParams();

  const ProjectComponent = PROJECT_COMPONENTS[type];

  if (!ProjectComponent) {
    return (
      <div dir="rtl" className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-600">
          نوع المشروع غير صحيح
        </div>
      </div>
    );
  }

  /*
   * مهم:
   * بنستخدم نفس صفحات المهندس نفسها.
   * لو مفيش :id فهي Create Mode عند الصفحات الأصلية.
   * وبالتالي مفيش أي تكرار للـ Forms.
   */
  return <ProjectComponent userData={userData} />;
}