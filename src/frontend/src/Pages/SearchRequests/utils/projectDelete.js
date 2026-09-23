import axios from "axios";
import { Url } from "../../../util/Apiconfig";

const DELETE_ENDPOINTS = {
  Construction: "Construction",
  Emergency: "Emergency",
  Maintenance: "Maintenance",
  PrivateProject: "PrivateProject",
  RehabilitationWorks: "RehabilitationWorks",

  // الأنواع بالعربي
  "الإنشاءات": "Construction",
  "الانشاءات": "Construction",

  "الطوارئ": "Emergency",

  "الصيانة": "Maintenance",

  "المشاريع الخاصة": "PrivateProject",

  "أعمال التأهيل": "RehabilitationWorks",
  "اعمال التاهيل": "RehabilitationWorks",
  "التأهيل": "RehabilitationWorks",
};

export async function deleteProject({
  type,
  id,
  token,
}) {
  const controller = DELETE_ENDPOINTS[type];

  if (!controller) {
    throw new Error(`نوع المشروع غير مدعوم للحذف: ${type}`);
  }

  if (!id) {
    throw new Error("رقم المشروع غير موجود");
  }

  return axios.delete(`${Url}${controller}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { DELETE_ENDPOINTS };