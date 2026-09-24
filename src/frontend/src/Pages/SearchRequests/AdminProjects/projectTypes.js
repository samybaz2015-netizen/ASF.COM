const PROJECT_TYPES = [
  {
    key: "construction",
    title: "الإنشاءات",
    path: "/admin-projects/construction",
    entityType: "Construction",
    createEndpoint: "Construction/create-construction",
  },
  {
    key: "emergency",
    title: "الطوارئ",
    path: "/admin-projects/emergency",
    entityType: "Emergency",
    createEndpoint: "Emergency/create-emergency",
  },
  {
    key: "maintenance",
    title: "الصيانة",
    path: "/admin-projects/maintenance",
    entityType: "Maintenance",
    createEndpoint: "Maintenance/create-maintenance",
  },
  {
    key: "private",
    title: "المشاريع الخاصة",
    path: "/admin-projects/private",
    entityType: "PrivateProject",
    createEndpoint: "PrivateProject/CreatePrivateProjectPOST",
  },
  {
    key: "rehabilitation",
    title: "أعمال التأهيل",
    path: "/admin-projects/rehabilitation",
    entityType: "RehabilitationWorks",
    createEndpoint: "RehabilitationWorks/create-rehabilitationWorks",
  },
];