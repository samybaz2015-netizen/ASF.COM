import React, { useEffect, useState } from "react";
import "./LatestProjects.css";
import projectImage1 from "../../Image/Rectangle 34.png";
import { Link } from "react-router-dom";
import axios from "axios";
import { Url } from "../../function/FunctionApi";
import Skeleton from "react-loading-skeleton";
import moment from "moment-hijri";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { officeNameMap } from "../../util/officeConstants";
import "react-loading-skeleton/dist/skeleton.css";
import Swal from "sweetalert2";

const LatestProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(projects);
  const fetchProjects = async () => {
    try {
      const response = await axios.get(
        `${Url}OrderForSubscribe/get-last4Order`
      );
      console.log(response.data);
      setProjects(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProjects();
  }, []);

  console.log(projects);

  const handleDelete = async (project) => {
    console.log(project);
    const projectId =
      project.type === "المشاريع الخاصة"
        ? project.projectName
        : project.faultNumber || project.id;

    const getProjectTypeRoute = (orderType) => {
      switch (orderType) {
        case "المشاريع الخاصة":
          return "privateproject";
        case "المشاريع":
          return "newproject";
        case "العمليات":
          return "operation";
        default:
          return "maintains";
      }
    };

    const projectTypeRoute = getProjectTypeRoute(project.type);

    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لا يمكنك التراجع عن هذا!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "لا، تراجع!",
    });

    if (result.isConfirmed) {
      try {
        const apiUrl = `Search/delete-by-orderidWithType?orderId=${projectId}&type=${projectTypeRoute}`;
        await axios.delete(`${Url}${apiUrl}`);
        console.log(`${Url}${apiUrl}`);

        Swal.fire({
          position: "center",
          icon: "success",
          title: "تم حذف الطلب بنجاح.",
          showConfirmButton: false,
          timer: 1500,
        });
        fetchProjects();
        window.location.reload();
      } catch (err) {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "حدث خطأ أثناء حذف الطلب.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
  };
  if (loading) {
    return (
      <div className="latest-projects-container" dir="rtl">
        <div className="container">
          <h2 className="section-title">آخر المشاريع</h2>
          <div className="cards-container">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="project-card">
                <Skeleton height={200} width={250} />
                <div className="project-info">
                  <h3 className="project-title">
                    <Skeleton width={150} />
                  </h3>
                  <p className="order-number">
                    <Skeleton width={100} />
                  </p>
                  <p className="project-date">
                    <Skeleton width={80} />
                  </p>
                  <Skeleton height={30} width={120} />
                </div>
              </div>
            ))}
          </div>
          <Link to="/projects" className="view-all-button">
            عرض الكل
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="latest-projects-container" dir="rtl">
      <div className="container">
        <h2 className="section-title">آخر المشاريع</h2>
        {projects.length === 0 ? (
          <p>لا توجد مشاريع حالياً لعرضها</p>
        ) : (
          <div className="cards-container">
            {projects &&
              projects.length > 0 &&
              projects.map((project, index) => {
                // Skip rendering if project or its data is null
                if (!project || !project.project) return null;

                const { project: projectDetails, type } = project;
                if (projectDetails == null) {
                  return null;
                }
                const typeOrder = projectDetails.type;
                const branchName = projectDetails.branchName || "Not Specified";
                const orderCode = projectDetails.orderCode || "N/A";
                const orderDate = projectDetails.orderDate
                  ? moment(projectDetails.orderDate).format("DD/MM/YYYY")
                  : "Date not available";
                const formattedOrderDate = projectDetails.orderDate
                  ? new Date(projectDetails.orderDate).toLocaleDateString()
                  : "N/A";
                const isArchived = projectDetails.isArchived
                  ? "تحت التنفيذ"
                  : "تم التنفيذ";
                const title =
                  type === "NewProject"
                    ? "المشاريع"
                    : type === "OrderMaintenance"
                    ? "الصيانه"
                    : type === "Operation"
                    ? "العمليات "
                    : "المشاريع الخاصه";

                return (
                  <div
                    key={projectDetails.id || index}
                    className="project-card"
                  >
                    <img
                      src={
                        projectDetails.modelPhotos &&
                        projectDetails.modelPhotos.length > 0
                          ? projectDetails.modelPhotos[0].url
                              ?.toLowerCase()
                              .endsWith(".pdf")
                            ? projectImage1
                            : projectDetails.modelPhotos[0].url
                          : projectImage1
                      }
                      alt={projectDetails.faultType || "Project Image"}
                      className="project-image"
                    />
                    <div className="project-info flex flex-col justify-between !h-full">
                      <h3 className="text-[17px]">القسم: {title}</h3>
                      {projectDetails.type === "المشاريع الخاصة" ? (
                        <>
                          <p className="text-[15px] p-1 text-slate-900">
                            اسم المشروع : {projectDetails.projectName}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            رقم المحطه: {projectDetails.stationNumber || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            صاحب المشروع: {projectDetails.customer || ""}
                          </p>

                          <p className="text-[15px] p-1 text-slate-900">
                            المقاول: {projectDetails.contractor || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            الاستشاري: {projectDetails.consultant || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            الحي: {projectDetails.district ?? ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            قيمه المشروع : {projectDetails.projectValue ?? ""}
                          </p>
                          <p className="project-date">
                            {projectDetails.orderDate.split("T")[0]}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="order-number">
                            رقم امر العمل :{" "}
                            {projectDetails.faultNumber || orderCode}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            رقم المحطه: {projectDetails.stationNumber || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            المكتب: {officeNameMap[projectDetails.office] || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            المقاول: {projectDetails.contractor || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            الاستشاري: {projectDetails.consultant || ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            الحي: {projectDetails.district ?? ""}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            موقف التنفيذ: {isArchived}
                          </p>

                          <p className="text-[15px] p-1 text-slate-900">
                            مده التنفيذ:{" "}
                            {projectDetails.durationOfImplementation ?? ""} ايام
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            القيمه المقدره:{" "}
                            {projectDetails.estimatedValue ?? "0"}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            القيمه الفعليه: {projectDetails.actualValue ?? "0"}
                          </p>
                          <p className="text-[15px] p-1 text-slate-900">
                            رقم المستخلص: {projectDetails.extractNumber ?? "0"}
                          </p>
                          <p className="project-date">
                            {projectDetails.receiveDateTime.split("T")[0]}
                          </p>
                        </>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={
                            project.type === "OrderMaintenance"
                              ? `/maintain-projects/${projectDetails.id}`
                              : project.type === "PrivateProject"
                              ? `/special-projects/${projectDetails.id}`
                              : project.type === "NewProject"
                              ? `/request-projects/${projectDetails.id}`
                              : `/operations-maintenance/${projectDetails.id}`
                          }
                          className=" py-2 px-3  text-[12px] text-blue-700 border rounded-sm"
                        >
                          الاطلاع علي الطلب
                        </Link>

                        <div
                          className="bg-gray-100 rounded-sm py-2 px-3 cursor-pointer"
                          onClick={() => {
                            handleDelete(projectDetails);
                          }}
                        >
                          <FontAwesomeIcon
                            className=" bg-red-200 text-xl text-red-700"
                            icon={faTrashCan}
                          />{" "}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <Link to="/projects" className="view-all-button">
          عرض الكل
        </Link>
      </div>
    </div>
  );
};

export default LatestProjects;
