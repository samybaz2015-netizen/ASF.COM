import React, { useEffect } from "react";
import Banner from "../../Component/ArchivedRequestsComp/Banner/Banner";
import Img from "../../Image/img3.jpeg";
import Projects from "../../Component/ArchivedRequestsComp/Project/Project";
import { useParams } from "react-router-dom";

function MainPage({ userData }) {
  const { namepage, name } = useParams();

  let title = "";
  let description = "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  switch (namepage) {
    case "Completed":
      title = "الطلبات المكتملة";
      description = "قم بإضافة طلبك وتأكد من إدخال المعلومات بشكل صحيح";
      break;
    case "Archived":
      title = "الطلبات المؤرشفة";
      description = "قم بإضافة طلبك وتأكد من إدخال المعلومات بشكل صحيح";
      break;
    default:
      title = "خطأ";
      description = "لا توجد بيانات للعرض.";
  }

  return (
    <>
      <Banner img={Img} title={title} Description={description} />
      <Projects Namepage={namepage} Name={name} userData={userData} />
    </>
  );
}

export default MainPage;
