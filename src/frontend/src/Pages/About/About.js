import { React, useEffect } from "react";
import Banner from "../../Component/SubmitApplicationComp/Banner";
import AboutComponent from "./AboutComponent/AboutComponent";
import TheBest from "./AboutComponent/TheBest";

import Img from "../../Image/Rectangle3.png";
import "./About.css";

function MainPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="About-Page">
      <Banner
        img={Img}
        title={"نبذة عن شركتنا للاستشارات الهندسية "}
        Description={
          "رسم تقدم استشارات هندسية متكاملة وحلول تصميم مبتكرة. فريقنا من الخبراء يوفر استشارات مهنية في   الاعمال الكهربيه  و التصميم المعماري، المدني، والميكانيكي لضمان نجاح مشاريعكم بكفاءة واحترافية"
        }
      />
      <AboutComponent />
      <TheBest />
    </div>
  );
}

export default MainPage;
