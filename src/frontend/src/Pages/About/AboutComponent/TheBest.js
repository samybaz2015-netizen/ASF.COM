import React, { useEffect, useState } from "react";
import { Col, Row, Card } from "react-bootstrap";
import img from "../../../Image/img2.jpeg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import { fetchDataWithRetries } from "../../../function/FunctionApi.js";
function TheBest() {
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchDataWithRetries(
          "OrdersinHome/GetNumberOfEng-complete-nonComplete",
          setData
        );
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);
  console.log(data);
  return (
    <div className="TheBest-container" dir="rtl">
      <Row className="TheBest-content g-4">
        <Col lg={4} md={12}>
          <h2 className="text-2xl md:text-3xl font-bold">الافضل فقط</h2>
          <div className="theBest-text flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h5 className="text-base md:text-lg font-semibold">
                البناء الصديق للبيئة
              </h5>
              <p className="text-sm md:text-base leading-relaxed break-words">
                في "عصف" للاستشارات الهندسية، نركز على ممارسات البناء المستدام
                باستخدام تقنيات مبتكرة ومواد صديقة للبيئة. هدفنا هو تقليل الأثر
                البيئي وتعزيز كفاءة استهلاك الطاقة لخلق مساحات عصرية وصحية
                للمجتمع.
              </p>
            </div>
            <FontAwesomeIcon icon={faAnglesLeft} className="flex-shrink-0 mt-1" />
          </div>
          <div className="theBest-text flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h5 className="text-base md:text-lg font-semibold">
                احدث تقنيات الاصلاح
              </h5>
              <p className="text-sm md:text-base leading-relaxed break-words">
                نستخدم في "عصف" أحدث تقنيات الإصلاح لضمان كفاءة وجودة المشاريع.
                تعتمد تقنياتنا على أساليب مبتكرة في تقييم الأضرار وإعادة التأهيل
                باستخدام مواد متقدمة، مما يحقق نتائج سريعة ومستدامة.{" "}
              </p>
            </div>
            <FontAwesomeIcon icon={faAnglesLeft} className="flex-shrink-0 mt-1" />
          </div>
          <div className="theBest-text flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h5 className="text-base md:text-lg font-semibold">
                إدارة البناء عالية الجودة
              </h5>
              <p className="text-sm md:text-base leading-relaxed break-words">
                في "عصف" للاستشارات الهندسية، نضمن تقديم إدارة بناء عالية الجودة
                من خلال التخطيط الدقيق والتنفيذ المتقن. نستخدم أفضل الممارسات
                وأحدث التقنيات لضمان تحقيق النتائج المرجوة، مع الالتزام
                بالمواعيد والجداول الزمنية المحددة. هدفنا هو تقديم مشاريع تتميز
                بالمتانة والجمال، تلبية لاحتياجات عملائنا وتوقعاتهم.
              </p>
            </div>
            <FontAwesomeIcon icon={faAnglesLeft} className="flex-shrink-0 mt-1" />
          </div>
        </Col>

        <Col lg={8} md={12} className="text-content">
          <img
            src={img}
            alt="About Us"
            className="TheBest-image w-full h-auto max-w-full object-cover rounded-lg"
          />
          <div className="stats-cards mt-4">
            <div className="cards-content grid grid-cols-2 gap-3 md:gap-4">
              <Card className="stats-card completed-projects">
                <Card.Body className="text-center p-3 md:p-4">
                  <h2 className="stats-number text-2xl md:text-3xl font-bold">8+</h2>
                  <p className="stats-label text-xs md:text-sm"> سنوات التأسيس</p>
                </Card.Body>
              </Card>
              <Card className="stats-card years-of-experience">
                <Card.Body className="text-center p-3 md:p-4">
                  <h2 className="stats-number text-2xl md:text-3xl font-bold">3000+</h2>
                  <p className="stats-label text-xs md:text-sm"> العمال المدنيون</p>
                </Card.Body>
              </Card>
            </div>
            <div className="cards-content">
              {/* <Card className="stats-card">
                <Card.Body>
                  <h2 className="stats-number">{data?.data.numberOfEngineers  || 0}</h2>
                  <p className="stats-label">موظفو المكتب</p>
                </Card.Body>
              </Card>
              <Card className="stats-card">
                <Card.Body>
                  <h2 className="stats-number">...</h2>
                  <p className="stats-label">العمال الميدانيون</p>
                </Card.Body>
              </Card> */}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default TheBest;