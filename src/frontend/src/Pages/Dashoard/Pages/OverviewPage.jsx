import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import {
  FiActivity,
  FiCalendar,
  FiDownload,
  FiFilter,
  FiMoreVertical,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiX,
} from "react-icons/fi";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

import dashboardService from "../services/dashboardService";

/* =========================================================
   CONSTANTS
========================================================= */

const COLORS = [
  "#118DFF",
  "#00C2FF",
  "#22C55E",
  "#F59E0B",
  "#A855F7",
  "#EC4899",
  "#EF4444",
];

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const percentage = (value, total) => {
  if (!total) return 0;

  return Math.round(
    (Number(value || 0) / Number(total || 0)) * 100
  );
};

/* =========================================================
   POWER BI TOOLTIP
========================================================= */

const PowerBITooltip = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      dir="rtl"
      className="min-w-[190px] border border-slate-700 bg-[#182235] p-3 shadow-2xl"
    >
      <p className="mb-2 border-b border-slate-700 pb-2 text-xs font-semibold text-white">
        {label}
      </p>

      {payload.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-5 py-1"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2"
              style={{
                backgroundColor:
                  item.color || item.fill,
              }}
            />

            <span className="text-[10px] text-slate-400">
              {item.name}
            </span>
          </div>

          <span className="text-[11px] font-bold text-white">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* =========================================================
   VISUAL MENU
========================================================= */

function VisualMenu({
  open,
  onClose,
  onPdf,
  onExcel,
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90]"
        onClick={onClose}
      />

      <div className="absolute left-2 top-10 z-[100] w-40 border border-slate-700 bg-[#182235] p-1 shadow-2xl">
        <button
          onClick={onPdf}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-[10px] text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <FiDownload size={13} />
          تصدير PDF
        </button>

        <button
          onClick={onExcel}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-[10px] text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <FiDownload size={13} />
          تصدير Excel
        </button>
      </div>
    </>
  );
}

/* =========================================================
   VISUAL CONTAINER
========================================================= */

function Visual({
  id,
  title,
  subtitle,
  children,
  exportVisual,
  menuOpen,
  setMenuOpen,
  className = "",
}) {
  const open = menuOpen === id;

  return (
    <section
      id={id}
      className={`relative border border-slate-700/80 bg-[#151E2E] shadow-[0_8px_30px_rgba(0,0,0,0.18)] ${className}`}
    >
      <div className="flex items-start justify-between border-b border-slate-700/70 px-4 py-3">
        <div>
          <h3 className="text-[16px] font-semibold text-white">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-0.5 text-[12px] text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setMenuOpen(open ? null : id)
            }
            className="flex h-7 w-7 items-center justify-center text-slate-500 transition hover:bg-slate-800 hover:text-white"
            aria-label="خيارات"
          >
            <FiMoreVertical size={16} />
          </button>

          <VisualMenu
            open={open}
            onClose={() => setMenuOpen(null)}
            onPdf={() => {
              setMenuOpen(null);
              exportVisual(id, "pdf");
            }}
            onExcel={() => {
              setMenuOpen(null);
              exportVisual(id, "excel");
            }}
          />
        </div>
      </div>

      <div className="p-4">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   KPI VISUAL
========================================================= */

function KpiVisual({
  id,
  title,
  subtitle,
  value,
  color,
  exportVisual,
  menuOpen,
  setMenuOpen,
}) {
  const open = menuOpen === id;

  return (
    <section
      id={id}
      className="relative border border-slate-700/80 bg-[#151E2E] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[15px] text-slate-500">
            {title}
          </p>

          <p
            className="mt-2 text-[26px] font-bold tracking-tight"
            style={{ color }}
          >
            {value}
          </p>

          <p className="mt-1 text-[12px] text-slate-600">
            {subtitle}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setMenuOpen(open ? null : id)
            }
            className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <FiMoreVertical size={16} />
          </button>

          <VisualMenu
            open={open}
            onClose={() => setMenuOpen(null)}
            onPdf={() => {
              setMenuOpen(null);
              exportVisual(id, "pdf");
            }}
            onExcel={() => {
              setMenuOpen(null);
              exportVisual(id, "excel");
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function OverviewPage() {
  const reportRef = useRef(null);

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    branchName: "",
    categoryName: "",
  });

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [menuOpen, setMenuOpen] =
    useState(null);

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchOverview = async (
    currentFilters = filters
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        ...currentFilters,

        fromDate: currentFilters.fromDate
          ? `${currentFilters.fromDate}T00:00:00`
          : undefined,

        toDate: currentFilters.toDate
          ? `${currentFilters.toDate}T23:59:59`
          : undefined,

        categoryName:
          currentFilters.categoryName ||
          undefined,
      };

      const response =
        await dashboardService.getOverview(
          params
        );

      setData(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "حدث خطأ أثناء تحميل البيانات"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview({
      fromDate: "",
      toDate: "",
      branchName: "",
      categoryName: "",
    });
  }, []);

  /* =======================================================
     FILTERS
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    fetchOverview(filters);
  };

  const resetFilters = () => {
    const reset = {
      fromDate: "",
      toDate: "",
      branchName: "",
      categoryName: "",
    };

    setFilters(reset);
    setSelectedCategory("ALL");

    fetchOverview(reset);
  };

  /* =======================================================
     DATA
  ======================================================= */

  const overall = data?.overall || {};

  const total = overall.total || {};

  const finished =
    overall.finished || {};

  const unfinished =
    overall.unfinished || {};

  const categories =
    data?.categories || [];

  const branches =
    data?.branchBreakdown || [];

  const stages =
    data?.stageBreakdown || [];

  const totalWorksValue =
    data?.summaryMatrix?.total
      ?.totalWorksValue || 0;

  /* =======================================================
     CATEGORY
  ======================================================= */

  const categoryTabs = useMemo(() => {
    return [
      {
        key: "ALL",
        label: "الكل",
      },

      ...categories.map((item) => ({
        key: item.categoryName,
        label: item.categoryName,
      })),
    ];
  }, [categories]);

  const selectedCategoryData =
    useMemo(() => {
      if (selectedCategory === "ALL") {
        return null;
      }

      return categories.find(
        (item) =>
          item.categoryName ===
          selectedCategory
      );
    }, [
      categories,
      selectedCategory,
    ]);

  const selectedStats =
    selectedCategoryData?.stats?.total || {};

  /* =======================================================
     CHART DATA
  ======================================================= */

  const stageData = useMemo(() => {
    return stages.map((item) => ({
      name: item.label,

      count: Number(item.count || 0),

      estimated: Number(
        item.estimatedValue || 0
      ),

      actual: Number(
        item.actualValue || 0
      ),
    }));
  }, [stages]);

  const categoryData = useMemo(() => {
    return categories.map((item) => {
      const stats =
        item.stats?.total || {};

      return {
        name: item.categoryName,

        count: Number(
          stats.count || 0
        ),

        estimated: Number(
          stats.estimatedValue || 0
        ),

        actual: Number(
          stats.actualValue || 0
        ),

        works: Number(
          stats.totalWorksValue || 0
        ),
      };
    });
  }, [categories]);

  const branchData = useMemo(() => {
    return [...branches]
      .sort(
        (a, b) =>
          Number(b.count || 0) -
          Number(a.count || 0)
      )
      .map((item) => ({
        name: item.label,

        count: Number(
          item.count || 0
        ),

        estimated: Number(
          item.estimatedValue || 0
        ),

        actual: Number(
          item.actualValue || 0
        ),
      }));
  }, [branches]);

  const statusData = [
    {
      name: "منتهية",
      value: Number(
        finished.count || 0
      ),
    },
    {
      name: "غير منتهية",
      value: Number(
        unfinished.count || 0
      ),
    },
  ];

  const finishedPercentage =
    percentage(
      finished.count,
      total.count
    );

  const unfinishedPercentage =
    percentage(
      unfinished.count,
      total.count
    );

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  const exportExcel = (
    visualId = "all"
  ) => {
    if (!data) return;

    const workbook =
      XLSX.utils.book_new();

    /* ---------------------------------------------
       ALL REPORT
    --------------------------------------------- */

    if (visualId === "all") {
      const overviewRows = [
        ["ASF Executive Dashboard"],
        [],
        ["المؤشر", "القيمة"],
        [
          "إجمالي الطلبات",
          total.count || 0,
        ],
        [
          "الطلبات المنتهية",
          finished.count || 0,
        ],
        [
          "الطلبات غير المنتهية",
          unfinished.count || 0,
        ],
        [
          "القيمة التقديرية",
          total.estimatedValue || 0,
        ],
        [
          "القيمة الفعلية",
          total.actualValue || 0,
        ],
        [
          "إجمالي قيمة الأعمال",
          totalWorksValue || 0,
        ],
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(
          overviewRows
        ),
        "Overview"
      );

      /* Categories */

      const categoryRows = [
        [
          "الفئة",
          "عدد الطلبات",
          "القيمة التقديرية",
          "القيمة الفعلية",
          "قيمة الأعمال",
        ],

        ...categoryData.map(
          (item) => [
            item.name,
            item.count,
            item.estimated,
            item.actual,
            item.works,
          ]
        ),
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(
          categoryRows
        ),
        "Categories"
      );

      /* Branches */

      const branchRows = [
        [
          "الفرع",
          "عدد الطلبات",
          "القيمة التقديرية",
          "القيمة الفعلية",
        ],

        ...branchData.map(
          (item) => [
            item.name,
            item.count,
            item.estimated,
            item.actual,
          ]
        ),
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(
          branchRows
        ),
        "Branches"
      );

      /* Stages */

      const stageRows = [
        [
          "الحالة",
          "عدد الطلبات",
          "القيمة التقديرية",
          "القيمة الفعلية",
        ],

        ...stageData.map(
          (item) => [
            item.name,
            item.count,
            item.estimated,
            item.actual,
          ]
        ),
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(
          stageRows
        ),
        "Stages"
      );

      XLSX.writeFile(
        workbook,
        "ASF-Executive-Dashboard.xlsx"
      );

      return;
    }

    /* ---------------------------------------------
       INDIVIDUAL VISUALS
    --------------------------------------------- */

    let rows = [];
    let sheetName = "Visual";

    switch (visualId) {
      case "kpi-total":
        rows = [
          ["المؤشر", "القيمة"],
          [
            "إجمالي الطلبات",
            total.count || 0,
          ],
          [
            "القيمة التقديرية",
            total.estimatedValue || 0,
          ],
          [
            "القيمة الفعلية",
            total.actualValue || 0,
          ],
        ];

        sheetName = "Total KPI";
        break;

      case "kpi-estimated":
        rows = [
          ["المؤشر", "القيمة"],
          [
            "القيمة التقديرية",
            total.estimatedValue || 0,
          ],
        ];

        sheetName = "Estimated";
        break;

      case "kpi-actual":
        rows = [
          ["المؤشر", "القيمة"],
          [
            "القيمة الفعلية",
            total.actualValue || 0,
          ],
        ];

        sheetName = "Actual";
        break;

      case "kpi-finished":
        rows = [
          ["المؤشر", "القيمة"],
          [
            "الطلبات المنتهية",
            finished.count || 0,
          ],
        ];

        sheetName = "Finished";
        break;

      case "kpi-unfinished":
        rows = [
          ["المؤشر", "القيمة"],
          [
            "الطلبات غير المنتهية",
            unfinished.count || 0,
          ],
        ];

        sheetName = "Unfinished";
        break;

      case "visual-status":
        rows = [
          ["الحالة", "عدد الطلبات"],
          [
            "منتهية",
            finished.count || 0,
          ],
          [
            "غير منتهية",
            unfinished.count || 0,
          ],
        ];

        sheetName = "Status";
        break;

      case "visual-categories":
        rows = [
          [
            "الفئة",
            "عدد الطلبات",
            "التقديرية",
            "الفعلية",
            "قيمة الأعمال",
          ],

          ...categoryData.map(
            (item) => [
              item.name,
              item.count,
              item.estimated,
              item.actual,
              item.works,
            ]
          ),
        ];

        sheetName = "Categories";
        break;

      case "visual-branches":
        rows = [
          [
            "الفرع",
            "عدد الطلبات",
            "التقديرية",
            "الفعلية",
          ],

          ...branchData.map(
            (item) => [
              item.name,
              item.count,
              item.estimated,
              item.actual,
            ]
          ),
        ];

        sheetName = "Branches";
        break;

      case "visual-stages":
        rows = [
          [
            "الحالة",
            "عدد الطلبات",
            "التقديرية",
            "الفعلية",
          ],

          ...stageData.map(
            (item) => [
              item.name,
              item.count,
              item.estimated,
              item.actual,
            ]
          ),
        ];

        sheetName = "Stages";
        break;

      case "visual-matrix":
        rows = [
          [
            "الفئة",
            "عدد الطلبات",
            "التقديرية",
            "الفعلية",
            "قيمة الأعمال",
          ],

          ...categoryData.map(
            (item) => [
              item.name,
              item.count,
              item.estimated,
              item.actual,
              item.works,
            ]
          ),
        ];

        sheetName = "Matrix";
        break;

      default:
        rows = [
          ["ASF Dashboard"],
          ["لا توجد بيانات لهذا العنصر"],
        ];
    }

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      sheetName
    );

    XLSX.writeFile(
      workbook,
      `ASF-${sheetName}.xlsx`
    );
  };

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  const exportPdf = async (
    visualId = "all"
  ) => {
    try {
      let element;

      if (visualId === "all") {
        element = reportRef.current;
      } else {
        element =
          document.getElementById(
            visualId
          );
      }

      if (!element) return;

      const canvas =
        await html2canvas(element, {
          scale: 2,
          backgroundColor: "#0B1220",
          useCORS: true,
        });

      const imageData =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation:
          canvas.width > canvas.height
            ? "landscape"
            : "portrait",

        unit: "px",

        format: [
          canvas.width,
          canvas.height,
        ],
      });

      pdf.addImage(
        imageData,
        "PNG",
        0,
        0,
        canvas.width,
        canvas.height
      );

      pdf.save(
        visualId === "all"
          ? "ASF-Executive-Dashboard.pdf"
          : `ASF-${visualId}.pdf`
      );
    } catch (error) {
      console.error(
        "PDF export error:",
        error
      );
    }
  };

  /* =======================================================
     EXPORT VISUAL
  ======================================================= */

  const exportVisual = (
    visualId,
    type
  ) => {
    if (type === "pdf") {
      exportPdf(visualId);
      return;
    }

    if (type === "excel") {
      exportExcel(visualId);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0B1220] text-white"
    >
      <div
        ref={reportRef}
        className="mx-auto max-w-[1800px] bg-[#0B1220] p-3 sm:p-4 lg:p-5"
      >

        {/* =================================================
            REPORT HEADER
        ================================================= */}

        <header className="border border-slate-700/80 bg-[#111827]">

          <div className="flex flex-col gap-4 border-b border-slate-700/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center bg-[#118DFF] text-white">
                <FiActivity size={18} />
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-[#118DFF]">
                  ASF • POWER BI REPORT
                </p>

                <h1 className="mt-1 text-[19px] font-bold">
                  لوحة الأداء التشغيلي
                </h1>
              </div>

            </div>

            {/* GLOBAL MENU */}

            <div className="relative">

              <button
                onClick={() =>
                  setMenuOpen(
                    menuOpen ===
                      "global"
                      ? null
                      : "global"
                  )
                }
                className="flex h-9 items-center gap-2 border border-slate-700 bg-[#182235] px-3 text-[10px] text-slate-300 hover:bg-slate-700"
              >
                <FiMoreVertical size={15} />
                خيارات التقرير
              </button>

              {menuOpen === "global" && (
                <VisualMenu
                  open
                  onClose={() =>
                    setMenuOpen(null)
                  }
                  onPdf={() => {
                    setMenuOpen(null);
                    exportPdf("all");
                  }}
                  onExcel={() => {
                    setMenuOpen(null);
                    exportExcel("all");
                  }}
                />
              )}

            </div>

          </div>

          {/* FILTERS */}

          <div className="grid grid-cols-1 gap-2 bg-[#0F1727] p-3 sm:grid-cols-2 lg:grid-cols-4">

            <div className="border border-slate-700 bg-[#151E2E] p-2.5">

              <label className="mb-1 block text-[18px] text-white">
                من تاريخ
              </label>

              <div className="flex items-center gap-2">

                <FiCalendar
                  size={13}
                  className="text-[#118DFF]"
                />

                <input
                  type="date"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={handleChange}
                  className="w-full bg-transparent text-[10px] text-slate-300 outline-none [color-scheme:dark]"
                />

              </div>

            </div>

            <div className="border border-slate-700 bg-[#151E2E] p-2.5">

              <label className="mb-1 block text-[18px] text-white">
                إلى تاريخ
              </label>

              <div className="flex items-center gap-2">

                <FiCalendar
                  size={13}
                  className="text-[#118DFF]"
                />

                <input
                  type="date"
                  name="toDate"
                  value={filters.toDate}
                  onChange={handleChange}
                  className="w-full bg-transparent text-[10px] text-slate-300 outline-none [color-scheme:dark]"
                />

              </div>

            </div>

            <div className="border border-slate-700 bg-[#151E2E] p-2.5">

              <label className="mb-1 block text-[18px] text-white">
                الفرع
              </label>

              <select
                name="branchName"
                value={filters.branchName}
                onChange={handleChange}
                className="w-full bg-[#000] text-[15px] text-[#fff] outline-none [color-scheme:dark]"
              >
                <option value="">
                  جميع الفروع
                </option>

                <option className=" text-[15px] text-[#fff]" value="جدة">
                  جدة
                </option>

                <option className=" text-[15px] text-[#fff]" value="منطقة الرياض">
                  الرياض
                </option>
              </select>

            </div>

            <div className="flex gap-2">

              <button
                onClick={applyFilters}
                className="flex h-full flex-1 items-center justify-center gap-2 bg-[#118DFF] text-[16px] font-semibold text-white hover:bg-[#0D7DE0]"
              >
                <FiFilter size={13} />
                تطبيق
              </button>

              <button
                onClick={resetFilters}
                className="flex w-10 items-center justify-center border border-slate-700 bg-[#151E2E] text-slate-400 hover:text-white"
              >
                <FiRefreshCw size={13} />
              </button>

            </div>

          </div>

        </header>

        {/* =================================================
            CATEGORY SLICER
        ================================================= */}

        <div className="mt-3 border border-slate-700/80 bg-[#111827]">

          <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-2.5">

            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#118DFF]">
                Category Slicer
              </p>

              <p className="mt-0.5 text-[12px] font-semibold text-white">
                نوع الأعمال
              </p>
            </div>

            <span className="text-[9px] text-slate-500">
              Select Category
            </span>

          </div>

          <div className="flex gap-1 overflow-x-auto p-2">

            {categoryTabs.map(
              (category) => {

                const active =
                  selectedCategory ===
                  category.key;

                return (
                  <button
                    key={category.key}
                    onClick={() => {

                      setSelectedCategory(
                        category.key
                      );

                      setFilters(
                        (prev) => ({
                          ...prev,
                          categoryName:
                            category.key ===
                            "ALL"
                              ? ""
                              : category.key,
                        })
                      );

                    }}
                    className={[
                      "whitespace-nowrap border px-5 py-2 text-[15px] font-semibold transition",
                      active
                        ? "border-[#118DFF] bg-[#118DFF] text-white"
                        : "border-slate-700 bg-[#151E2E] text-slate-400 hover:border-[#118DFF] hover:text-white",
                    ].join(" ")}
                  >
                    {category.label}
                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* =================================================
            KPI ROW
        ================================================= */}

        <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-5">

          <KpiVisual
            id="kpi-total"
            title="إجمالي الطلبات"
            value={formatNumber(
              selectedCategory === "ALL"
                ? total.count
                : selectedStats.count
            )}
            subtitle="Total Orders"
            color="#118DFF"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

          <KpiVisual
            id="kpi-estimated"
            title="القيمة التقديرية"
            value={formatNumber(
              selectedCategory === "ALL"
                ? total.estimatedValue
                : selectedStats.estimatedValue
            )}
            subtitle="Estimated Value"
            color="#60A5FA"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

          <KpiVisual
            id="kpi-actual"
            title="القيمة الفعلية"
            value={formatNumber(
              selectedCategory === "ALL"
                ? total.actualValue
                : selectedStats.actualValue
            )}
            subtitle="Actual Value"
            color="#22C55E"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

          <KpiVisual
            id="kpi-finished"
            title="الطلبات المنتهية"
            value={formatNumber(
              finished.count
            )}
            subtitle={`${finishedPercentage}% من الإجمالي`}
            color="#22C55E"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

          <KpiVisual
            id="kpi-unfinished"
            title="الطلبات غير المنتهية"
            value={formatNumber(
              unfinished.count
            )}
            subtitle={`${unfinishedPercentage}% من الإجمالي`}
            color="#F59E0B"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

        </div>

        {/* =================================================
            MAIN VISUALS
        ================================================= */}

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">

          {/* ACTUAL VS ESTIMATED */}

          <Visual
            id="visual-stages"
            title="القيمة الفعلية مقابل التقديرية"
            subtitle="Actual Value vs Estimated Value"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            className="xl:col-span-8"
          >

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={stageData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 25,
                  }}
                  barGap={3}
                >

                  <CartesianGrid
                    stroke="#273449"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 9,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 9,
                    }}
                    tickFormatter={
                      formatNumber
                    }
                  />

                  <Tooltip
                    content={
                      <PowerBITooltip />
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="estimated"
                    name="التقديرية"
                    fill="#315C8D"
                    barSize={25}
                  />

                  <Bar
                    dataKey="actual"
                    name="الفعلية"
                    fill="#118DFF"
                    barSize={25}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </Visual>

          {/* STATUS */}

          <Visual
            id="visual-status"
            title="حالة التنفيذ"
            subtitle="Finished vs Unfinished"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            className="xl:col-span-4"
          >

            <div className="relative h-[280px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="#151E2E"
                    strokeWidth={3}
                  >

                    <Cell fill="#22C55E" />
                    <Cell fill="#F59E0B" />

                  </Pie>

                  <Tooltip
                    content={
                      <PowerBITooltip />
                    }
                  />

                </PieChart>

              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                <span className="text-[28px] font-bold text-white">
                  {formatNumber(
                    total.count
                  )}
                </span>

                <span className="text-[9px] text-slate-500">
                  إجمالي الطلبات
                </span>

              </div>

            </div>

            <div className="grid grid-cols-2 border-t border-slate-700 pt-3">

              <div className="text-center">

                <p className="text-[9px] text-slate-500">
                  منتهية
                </p>

                <p className="mt-1 text-lg font-bold text-green-400">
                  {finishedPercentage}%
                </p>

              </div>

              <div className="border-r border-slate-700 text-center">

                <p className="text-[9px] text-slate-500">
                  غير منتهية
                </p>

                <p className="mt-1 text-lg font-bold text-orange-400">
                  {unfinishedPercentage}%
                </p>

              </div>

            </div>

          </Visual>

        </div>

        {/* =================================================
            CATEGORY ANALYSIS
        ================================================= */}

        <div className="mt-3">

          <Visual
            id="visual-categories"
            title="تحليل الفئات"
            subtitle="الإنشاءات والصيانة وباقي أنواع الأعمال"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          >

            <div className="h-[360px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 20,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    stroke="#273449"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 9,
                    }}
                    tickFormatter={
                      formatNumber
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#CBD5E1",
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    content={
                      <PowerBITooltip />
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="estimated"
                    name="القيمة التقديرية"
                    fill="#315C8D"
                    barSize={16}
                  />

                  <Bar
                    dataKey="actual"
                    name="القيمة الفعلية"
                    fill="#118DFF"
                    barSize={16}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </Visual>

        </div>

        {/* =================================================
            BRANCH + FINANCIAL
        ================================================= */}

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">

          <Visual
            id="visual-branches"
            title="تحليل الفروع"
            subtitle="Branch Performance"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          >

            <div className="h-[320px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={branchData}
                  margin={{
                    top: 10,
                    right: 5,
                    left: -20,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    stroke="#273449"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 9,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 9,
                    }}
                  />

                  <Tooltip
                    content={
                      <PowerBITooltip />
                    }
                  />

                  <Bar
                    dataKey="count"
                    name="عدد الطلبات"
                    fill="#118DFF"
                    barSize={38}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </Visual>

          <Visual
            id="visual-financial"
            title="تحليل القيم المالية"
            subtitle="Financial Analysis"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          >

            <div className="h-[320px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={stageData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    stroke="#273449"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 9,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 9,
                    }}
                    tickFormatter={
                      formatNumber
                    }
                  />

                  <Tooltip
                    content={
                      <PowerBITooltip />
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="estimated"
                    name="التقديرية"
                    stroke="#64748B"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#64748B",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="الفعلية"
                    stroke="#118DFF"
                    strokeWidth={3}
                    dot={{
                      r: 3,
                      fill: "#118DFF",
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </Visual>

        </div>

        {/* =================================================
            MATRIX
        ================================================= */}

        <div className="mt-3">

          <Visual
            id="visual-matrix"
            title="التفاصيل"
            subtitle="Category Matrix"
            exportVisual={exportVisual}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          >

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-center">

                <thead>

                  <tr className="border-b border-slate-700 bg-[#101827]">

                    <th className="px-4 py-3 text-center text-[14px] font-semibold text-white">
                      الفئة
                    </th>

                    <th className="px-4 py-3 text-center text-[14px] font-semibold text-white">
                      الطلبات
                    </th>

                    <th className="px-4 py-3 text-center text-[14px] font-semibold text-white">
                      التقديرية
                    </th>

                    <th className="px-4 py-3 text-center text-[14px] font-semibold text-white">
                      الفعلية
                    </th>

                    <th className="px-4 py-3 text-center text-[14px] font-semibold text-white">
                      قيمة الأعمال
                    </th>

                    <th className="px-4 py-3 text-center text-[14px] font-semibold text-white">
                      التنفيذ
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {categories.map(
                    (category, index) => {

                      const stats =
                        category.stats?.total ||
                        {};

                      const execution =
                        percentage(
                          stats.actualValue,
                          stats.estimatedValue
                        );

                      return (
                        <tr
                          key={
                            category.categoryName
                          }
                          className="border-b border-slate-800 transition hover:bg-[#192438]"
                        >

                          <td className="px-4 py-3">

                            <div className="flex items-center gap-2">

                              <span
                                className="h-2 w-2"
                                style={{
                                  backgroundColor:
                                    COLORS[
                                      index %
                                        COLORS.length
                                    ],
                                }}
                              />

                              <span className="text-[14px] font-semibold text-slate-300">
                                {
                                  category.categoryName
                                }
                              </span>

                            </div>

                          </td>

                          <td className="px-4 py-3 text-[13px] text-slate-400">
                            {formatNumber(
                              stats.count
                            )}
                          </td>

                          <td className="px-4 py-3 text-[13px] text-blue-400">
                            {formatNumber(
                              stats.estimatedValue
                            )}
                          </td>

                          <td className="px-4 py-3 text-[13px] text-green-400">
                            {formatNumber(
                              stats.actualValue
                            )}
                          </td>

                          <td className="px-4 py-3 text-[13px] font-semibold text-white">
                            {formatNumber(
                              stats.totalWorksValue
                            )}
                          </td>

                          <td className="px-4 py-3">

                            <div className="flex items-center gap-2">

                              <div className="h-1.5 w-20 overflow-hidden bg-slate-800">

                                <div
                                  className="h-full bg-[#118DFF]"
                                  style={{
                                    width: `${Math.min(
                                      execution,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                              <span className="text-[12px] text-slate-400">
                                {execution}%
                              </span>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </Visual>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="flex items-center justify-between px-1 py-3 text-[9px] text-slate-600">

          <span>
            ASF Executive Operations Report
          </span>

          <span>
            Live Data
          </span>

        </footer>

      </div>
    </div>
  );
}