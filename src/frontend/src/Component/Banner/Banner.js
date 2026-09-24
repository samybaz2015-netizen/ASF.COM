import React from "react";
import "./Banner.css";
import { Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import img2 from "../../Image/13.jpeg"; // Example images
import img3 from "../../Image/tn3.jpeg";
import img1 from "../../Image/tn4.jpeg";
import img4 from "../../Image/tn5.jpeg";
import img5 from "../../Image/12.jpeg";

function Banner({ userData }) {
  const sections = [
    {
      image: img2,
      title: "الطوارئ",
      description: "استجابة سريعة وصيانة المعدات لضمان سير العمل.",
      link: "/emergency-projects",
    },
    {
      image: img3,
      title: "اعمال التاهيل",
      description: "إعادة تأهيل المنشآت وتحسين أدائها وفقًا للمعايير الحديثة.",
      link: "/rehabilitation-works",
    },
    {
      image: img1,
      title: "الانشاءات",
      description: "حلول بناء مبتكرة مع ضمان الجودة والأمان.",
      link: "/construction-projects",
    },
    {
      image: img5,
      title: "الصيانه",
      description: "صيانة شاملة للمعدات والمرافق لضمان استمرارية العمل.",
      link: "/maintain-projects",
    },
    {
      image: img3,
      title: "المشاريع الخاصه",
      description: "حلول هندسية مبتكرة تناسب احتياجات المشاريع الخاصة.",
      link: "/Sub-page/special-projects",
    },
  ];
  

  return (
    <div className="banner-container" id="web-banner-container" dir="rtl">
      <Row className="banner-content">
        <Col lg={8} md={12} className="left-content">
          <div className="text-content">
            <h1 className="welcome-text">
              مرحباً بك، مهندس <span>{userData && userData.displayName}</span>،
              في فرع <span>{userData && userData.branchName}</span>
            </h1>
            <p className="description">
              عصف تقدم استشارات هندسية متكاملة وحلول تصميم مبتكرة. فريقنا من
              الخبراء يوفر استشارات مهنية في الاعمال الكهربئيه و التصميم
              المعماري، المدني، والميكانيكي لضمان نجاح مشاريعكم بكفاءة
              واحترافية.
            </p>
          </div>
          <div className="image-content">
            <div className="image-cover"></div>
          </div>
        </Col>
        <Col lg={4} md={12} className="right-content">
          <h2 className="section-title">الأقسام</h2>
          <div className="cards-container">
            {sections.map((section, index) => (
              <Card key={index} className="custom-card">
                <Card.Img variant="left" src={section.image} />
                <Link to={section.link}>
                  <Card.Body>
                    <Card.Title>{section.title}</Card.Title>
                    <Card.Text className="card-description">
                      {section.description}
                    </Card.Text>
                  </Card.Body>
                </Link>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Banner;
