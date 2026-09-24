import React, { useEffect, useState } from "react";
import axios from "axios";
import projectImage1 from "../../../Image/Rectangle 34.png";
import noDataImage from "../../../Image/App Illustrations.jpg";
import { Url } from "../../../function/FunctionApi";
import { Link } from "react-router-dom";
import moment from "moment-hijri";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { officeNameMap } from "../../../util/officeConstants";
import temb from "../../../Image/Rectangle 34.png";
import axiosInstance from "../../../api/apiClient";
const routesMap = {
  maintains: "maintain-projects",
  "Operations-Maintenance": "operations-maintenance",
  "special-projects": "special-projects",
  "Rehabilitation-Works": "rehabilitation-works",
  "emergency-projects": "emergency-projects",
  Emergencies: "emergency-projects",
  Constructions: "construction-projects",
};

const Projects = ({ Name, Namepage, userData }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const apiUrlMap = {
          "Rehabilitation-Works": "RehabilitationWorks/filter-orders",
          Constructions: "Construction/filter-orders",
          Emergencies: "Emergency/filter-orders",
          maintains: "Maintenance/filter-orders",
          'special-projects':'PrivateProject/filter-orders-privateproject'
        };

        const apiUrl = apiUrlMap[Name];
        if (!apiUrl) throw new Error("Invalid Name parameter");

        const params = {
          isArchive: Namepage === "Archived",
          isCompleted: Namepage === "Completed",
          branchName: userData.branchName,
        }; 
        

        const response = await axios.get(`${Url}${apiUrl}`, {
          params,
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        });
        console.log(response);
        console.log("url++++++++++++++++++++++++++++");
        console.log(`${Url}${apiUrl}`);
        const projectData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setProjects(projectData);
        setFilteredProjects(projectData);
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [Name, Namepage, userData]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter((project) =>
        (project.faultNumber || project.orderNumber)
          ?.toString()
          .includes(searchQuery)
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const renderSkeletonLoader = () => (
    <div className="cards-container">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
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
  );
  const handleDelete = async (projectId, projectType) => {
    const getProjectTypeRoute = (orderType) => {
      switch (orderType) {
        case "maintains":
          return "maintains";
        case "Operations-Maintenance":
          return "operation";
        case "special-projects":
          return "privateproject";
        default:
          return "newproject";
      }
    };

    const projectTypeRoute = getProjectTypeRoute(projectType);
    console.log(projectId, "from............");
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
        await axiosInstance.delete(`/${apiUrl}`);
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.faultNumber !== projectId)
        );
        setFilteredProjects((prevFiltered) =>
          prevFiltered.filter((project) => project.faultNumber !== projectId)
        );
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.orderNumber !== projectId)
        );
        setFilteredProjects((prevFiltered) =>
          prevFiltered.filter((project) => project.orderNumber !== projectId)
        );
        Swal.fire({
          position: "center",
          icon: "success",
          title: "تم تقديم طلب حذف بنجاح سيتم المراجعه من خلال الاداره",
          showConfirmButton: false,
          timer: 1500,
        });
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
    window.location.reload();
  };

  if (loading)
    return (
      <div className="latest-projects-container" >
        <div className="container">{renderSkeletonLoader()}</div>
      </div>
    );

  if (error)
    return (
      <div className="error-message" >
        حدث خطأ: {error}
      </div>
    );

  if (filteredProjects.length === 0) {
    return (
      <>
        <div className="latest-projects-container" >
          <div className="container">
            <div className="search-container ">
              <input
                type="text"
                placeholder="ابحث برقم الطلب"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <h4> عدد الطلبات ( {filteredProjects.length} )</h4>
            </div>
            <div className="NotFoundProject" >
              <img
                src={noDataImage}
                alt="No data available"
                className="no-data-image"
              />
              <p>لا يوجد بيانات للعرض</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="latest-projects-container" >
      <div className="container">
        <div className="search-container">
          <input
            type="text"
            placeholder="ابحث برقم الطلب"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <h4> عدد الطلبات ( {filteredProjects.length} )</h4>
        </div>
        <div className="cards-container">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <img
                src={
                  project.modelPhotos && project.modelPhotos.length > 0
                    ? project.modelPhotos[0].url.toLowerCase().endsWith(".pdf")
                      ? projectImage1
                      : project.modelPhotos[0].url
                    : temb
                }
                alt={project.faultType || "Project Image"}
                className="project-image"
              />
              <div className="project-info">
                <h3 className="project-title">
                  {project.WorkOrderType || null}
                </h3>

                {project.type === "المشاريع الخاصة" ? (
                  // Display properties for "المشاريع الخاصة"
                  <>
                    <p>اسم العميل: {project.customer}</p>
                    <p>اسم المقاول: {project.contractor}</p>
                    <p>المنطقة: {project.district}</p>
                    <p>رقم المحطة: {project.stationNumber}</p>
                    <p>
                      تاريخ الطلب:{" "}
                      {new Date(project.orderDate).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      رقم امر العمل:{" "}
                      {project.faultNumber || project.orderNumber}
                    </p>
                    <p>الفرع: {project.branchName || project.orderNumber}</p>
                    <p>
                      موقف التنفيذ:{" "}
                      {project.situation === "finish"
                        ? "تم التنفيذ"
                        : project.situation === "notFinished"
                        ? "لم يتم التنفيذ"
                        : "جاري"}
                    </p>
                    <p>المكتب: {officeNameMap[project.office]}</p>{" "}
                    <p>
                      الحاله:{" "}
                      {project.isArchived === true
                        ? "تحت التنفيذ"
                        : "تم التنفيذ"}
                    </p>
                    <p className="project-date">
                      تاريخ استلام امر العمل:
                      {new Date(project.receiveDateTime).toLocaleDateString()}
                    </p>
                  </>
                )}

                <div className="buttonUpdeteDelete">
                  {/* Conditional rendering for the Link component based on the `Name` */}
                  <Link
                    to={`/${routesMap[Name] || "Request-projects"}/${
                      project.id
                    }`}
                    className="view-project-button"
                  >
                    تعديل الطلب
                  </Link>
                  ;{/* Delete button */}
                  <button
                    className="delete-project-button"
                    onClick={() => {
                      console.log(project.projectName);

                      // Conditional handling for delete based on the `Name`
                      if (Name === "special-projects") {
                        handleDelete(project.projectName, Name);
                      } else {
                        console.log("not special-projects");
                        handleDelete(
                          project.orderNumber || project.faultNumber,
                          Name
                        );
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
