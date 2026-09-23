import React from "react";
import "./Project.css";
import { Link } from "react-router-dom";
import { domain } from "../../../function/FunctionApi";

const ProjectList = ({ branch, projects }) => {
  console.log(projects);
  return (
    <div className="project-list" id="Project-List-BarChart">
      <h3>مشاريع اليوم فرع {branch}</h3>
      <div className="project-container">
        {projects.map((project, index) => (
          <Link
            to={`/project/${
              project.type === "المشاريع الخاصة"
                ? "privateproject"
                : project.type === "العمليات"
                ? "operation"
                : project.type === "الصيانة"
                ? "maintains"
                : "newproject"
            }/${project.id}`}
            className="project-card"
            key={index}
          >
            <p>تاريخ الطلب: {project.orderDate.split("T")[0]}</p>
            <p className="numberOrder">
              {project.type === "المشاريع الخاصة"
                ? `اسم المشروع: ${project.projectName}`
                : `رقم الطلب: ${project.orderNumber || project.faultNumber}`}
            </p>
            <p> المهندس: {project.userName}</p>
            <p> {project.type}</p>
            <div className="project-image">
              <img
                src={`${domain}/` + project.userImage}
                alt={project.userName}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
