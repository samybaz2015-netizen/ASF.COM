import React from "react";
import { Col, Row, Card } from "react-bootstrap";
import img from "../../Image/img2.jpeg";
import "./AboutUs.css";

function AboutUs({ userData }) {
  return (
    <div className="about-us-container" dir="rtl">
      <Row className="about-us-content">
        <Col
          style={{
            backgroundImage: `url(${img})`,
          }}
          lg={4}
          md={12}
          className="image-content"
        ></Col>
        <Col lg={8} md={12} className="text-content">
          <div className="title-about">
            <h1 className="about-us-title">
              عصف فرع <sapn>{userData && userData.branchName}</sapn>{" "}
            </h1>
            <p className="about-us-description">
              هي شركة رائدة في تقديم الاعمال الكهربئيه و استشارات هندسية
              متكاملة، حيث نركز على تقديم حلول تصميم هندسي مبتكرة وشاملة لتلبية
              احتياجات مشاريعكم. فريقنا من المهندسين المتخصصين يمتلك خبرة واسعة
              في تقديم استشارات دقيقة ومهنية في مختلف مجالات الهندسة، بما في ذلك
              الاعمال الكهربيه والتصميم المعماري، والمدنيه. نحن ملتزمون بتوفير
              استشارات ذات جودة عالية لضمان نجاح مشاريعكم وتحقيق رؤيتكم بكفاءة
              واحترافية.{" "}
            </p>
          </div>
          <div className="stats-cards">
            <Card className="stats-card completed-projects">
              <Card.Body>
                <h2 className="stats-number">2000+</h2>
                <p className="stats-label"> العمال المدنيون</p>
              </Card.Body>
            </Card>
            <Card className="stats-card years-of-experience">
              <Card.Body>
                <h2 className="stats-number">6+</h2>
                <p className="stats-label">سنوات التأسيس</p>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default AboutUs;
