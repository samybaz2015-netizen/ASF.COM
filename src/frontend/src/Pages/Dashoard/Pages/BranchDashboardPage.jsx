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
  FiMoreVertical,
  FiRefreshCw,
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
   TOOLTIP
========================================================= */

const PowerBITooltip = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="min-w-[200px] border border-slate-700 bg-[#182235] p-3 shadow-2xl"
    >
      <div className="mb-2 border-b border-slate-700 pb-2 text-xs font-bold text-white">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-5 py-1.5"
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

          <strong className="text-[11px] text-white">
            {formatNumber(item.value)}
          </strong>
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

      <div className="absolute left-0 top-9 z-[100] w-40 border border-slate-700 bg-[#182235] p-1 shadow-2xl">
        <button
          onClick={onPdf}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <FiDownload size={13} />

          تصدير PDF
        </button>

        <button
          onClick={onExcel}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <FiDownload size={13} />

          تصدير Excel
        </button>
      </div>
    </>
  );
}

/* =========================================================
   VISUAL WRAPPER
========================================================= */

function Visual({
  id,
  title,
  subtitle,
  children,
  menuOpen,
  setMenuOpen,
  exportVisual,
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
          <h2 className="text-[16px] font-semibold text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-0.5 text-[12px] text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setMenuOpen(
                open ? null : id
              )
            }
            className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <FiMoreVertical size={16} />
          </button>

          <VisualMenu
            open={open}
            onClose={() =>
              setMenuOpen(null)
            }
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
   KPI
========================================================= */

function KpiVisual({
  id,
  title,
  value,
  subtitle,
  color,
  menuOpen,
  setMenuOpen,
  exportVisual,
}) {
  const open = menuOpen === id;

  return (
    <section
      id={id}
      className="relative border border-slate-700/80 bg-[#151E2E] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500">
            {title}
          </p>

          <p
            className="mt-2 text-[26px] font-bold tracking-tight"
            style={{ color }}
          >
            {value}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">
            {subtitle}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setMenuOpen(
                open ? null : id
              )
            }
            className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <FiMoreVertical size={16} />
          </button>

          <VisualMenu
            open={open}
            onClose={() =>
              setMenuOpen(null)
            }
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
   VALUE VISUAL
========================================================= */

function ValueVisual({
  id,
  title,
  estimated,
  actual,
  menuOpen,
  setMenuOpen,
  exportVisual,
}) {
  return (
    <Visual
      id={id}
      title={title}
      subtitle="Estimated vs Actual"
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      exportVisual={exportVisual}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-[14px] text-white">
            القيمة التقديرية
          </p>

          <p className="mt-2 text-lg font-bold text-blue-400">
            {formatNumber(estimated)}
          </p>
        </div>

        <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[14px] text-white">
            القيمة الفعلية
          </p>

          <p className="mt-2 text-lg font-bold text-emerald-400">
            {formatNumber(actual)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[14px] text-white">
            نسبة التنفيذ
          </span>

          <span className="text-[10px] font-bold text-white">
            {percentage(
              actual,
              estimated
            )}
            %
          </span>
        </div>

        <div className="h-1.5 bg-slate-800">
          <div
            className="h-full bg-[#118DFF]"
            style={{
              width: `${Math.min(
                percentage(
                  actual,
                  estimated
                ),
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </Visual>
  );
}

/* =========================================================
   OFFICE ROW
========================================================= */

function OfficeRow({
  office,
  index,
}) {
  const share = percentage(
    office.count,
    office.totalCount
  );

  return (
    <div className="border-b border-slate-800 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#118DFF]/10 text-[10px] font-bold text-[#118DFF]">
          {String(index + 1).padStart(
            2,
            "0"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[11px] font-semibold text-slate-300">
              {office.label}
            </span>

            <span className="text-[11px] font-bold text-white">
              {formatNumber(
                office.count
              )}
            </span>
          </div>

          <div className="mt-2 h-1.5 bg-slate-800">
            <div
              className="h-full bg-[#118DFF]"
              style={{
                width: `${share}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 pr-11">
        <div>
          <span className="text-[8px] text-slate-600">
            التقديرية
          </span>

          <p className="mt-0.5 text-[10px] text-blue-400">
            {formatNumber(
              office.estimatedValue
            )}
          </p>
        </div>

        <div>
          <span className="text-[8px] text-slate-600">
            الفعلية
          </span>

          <p className="mt-0.5 text-[10px] text-emerald-400">
            {formatNumber(
              office.actualValue
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function BranchDashboardPage({
  branch,
}) {
  const reportRef = useRef(null);

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(null);

  /* =======================================================
     BRANCH
  ======================================================= */

  const branchName =
    branch === "jeddah"
      ? "جدة"
      : "الرياض";

  /* =======================================================
     LOAD
  ======================================================= */

  const loadBranch = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        branch === "jeddah"
          ? await dashboardService.getJeddah()
          : await dashboardService.getRiyadh();

      setData(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          `حدث خطأ أثناء تحميل بيانات فرع ${branchName}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, [branch]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-[#0B1220] text-slate-400"
      >
        <div className="h-8 w-8 animate-spin border-2 border-slate-700 border-t-[#118DFF]" />

        <p className="mt-4 text-xs">
          جاري تحميل بيانات فرع{" "}
          {branchName}...
        </p>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#0B1220] p-5"
      >
        <div className="w-full max-w-md border border-red-500/20 bg-[#151E2E] p-6 text-center">
          <p className="text-sm font-bold text-red-400">
            حدث خطأ
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {error}
          </p>

          <button
            onClick={loadBranch}
            className="mt-5 bg-[#118DFF] px-5 py-2 text-[10px] font-semibold text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  /* =======================================================
     RESPONSE DATA
  ======================================================= */

  const overall =
    data.overall || {};

  const total =
    overall.total || {};

  const finished =
    overall.finished || {};

  const unfinished =
    overall.unfinished || {};

  const offices =
    data.officeBreakdown || [];

  const stages =
    data.stageBreakdown || [];

  const categories =
    data.categories || [];

  const totalWorksValue =
    data.summaryMatrix?.total
      ?.totalWorksValue ||
    data.summaryMatrix
      ?.totalWorksValue ||
    total.totalWorksValue ||
    0;

  /* =======================================================
     CHART DATA
  ======================================================= */

const stageData = stages.map((item) => ({
  name: item.label,

  count: Number(item.count || 0),

  estimated: Number(
    item.estimatedValue || 0
  ),

  actual: Number(
    item.actualValue || 0
  ),
}));

const categoryData = categories.map(
  (category) => {
    const stats =
      category.stats?.total || {};

    return {
      name: category.categoryName,

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
  }
);

const officeData = offices.map(
  (office) => ({
    ...office,

    count: Number(
      office.count || 0
    ),

    estimatedValue: Number(
      office.estimatedValue || 0
    ),

    actualValue: Number(
      office.actualValue || 0
    ),

    totalCount: Number(
      total.count || 0
    ),
  })
);

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

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  const exportExcel = (
    visualId = "all"
  ) => {
    const workbook =
      XLSX.utils.book_new();

    /* ---------------------------------------------
       WHOLE REPORT
    --------------------------------------------- */

    if (visualId === "all") {
      const overviewRows = [
        ["ASF Branch Executive Report"],
        [`فرع ${data.branchName || branchName}`],
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
          "قيمة الأعمال",
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

      /* Offices */

      const officeRows = [
        [
          "المكتب",
          "عدد الطلبات",
          "القيمة التقديرية",
          "القيمة الفعلية",
        ],

        ...officeData.map(
          (office) => [
            office.label,
            office.count,
            office.estimatedValue,
            office.actualValue,
          ]
        ),
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(
          officeRows
        ),
        "Offices"
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
          (stage) => [
            stage.name,
            stage.count,
            stage.estimated,
            stage.actual,
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
          (category) => [
            category.name,
            category.count,
            category.estimated,
            category.actual,
            category.works,
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

      XLSX.writeFile(
        workbook,
        `ASF-${branchName}-Executive-Report.xlsx`
      );

      return;
    }

    /* ---------------------------------------------
       INDIVIDUAL VISUAL
    --------------------------------------------- */

    let rows = [];
    let sheetName = "Visual";

    switch (visualId) {
      case "branch-kpi-total":
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

      case "branch-kpi-finished":
        rows = [
          ["المؤشر", "القيمة"],

          [
            "الطلبات المنتهية",
            finished.count || 0,
          ],

          [
            "القيمة التقديرية",
            finished.estimatedValue || 0,
          ],

          [
            "القيمة الفعلية",
            finished.actualValue || 0,
          ],
        ];

        sheetName = "Finished";
        break;

      case "branch-kpi-unfinished":
        rows = [
          ["المؤشر", "القيمة"],

          [
            "الطلبات غير المنتهية",
            unfinished.count || 0,
          ],

          [
            "القيمة التقديرية",
            unfinished.estimatedValue || 0,
          ],

          [
            "القيمة الفعلية",
            unfinished.actualValue || 0,
          ],
        ];

        sheetName = "Unfinished";
        break;

      case "branch-kpi-value":
        rows = [
          ["المؤشر", "القيمة"],

          [
            "إجمالي قيمة الأعمال",
            totalWorksValue || 0,
          ],
        ];

        sheetName = "Works Value";
        break;

      case "branch-stages":
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

      case "branch-status":
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

      case "branch-offices":
        rows = [
          [
            "المكتب",
            "عدد الطلبات",
            "التقديرية",
            "الفعلية",
          ],

          ...officeData.map(
            (office) => [
              office.label,
              office.count,
              office.estimatedValue,
              office.actualValue,
            ]
          ),
        ];

        sheetName = "Offices";
        break;

      case "branch-categories":
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

      case "branch-values-total":
        rows = [
          [
            "المؤشر",
            "التقديرية",
            "الفعلية",
          ],

          [
            "إجمالي الطلبات",
            total.estimatedValue ||
              0,
            total.actualValue || 0,
          ],
        ];

        sheetName = "Total Values";
        break;

      case "branch-values-finished":
        rows = [
          [
            "المؤشر",
            "التقديرية",
            "الفعلية",
          ],

          [
            "الطلبات المنتهية",
            finished.estimatedValue ||
              0,
            finished.actualValue ||
              0,
          ],
        ];

        sheetName =
          "Finished Values";
        break;

      case "branch-values-unfinished":
        rows = [
          [
            "المؤشر",
            "التقديرية",
            "الفعلية",
          ],

          [
            "الطلبات غير المنتهية",
            unfinished.estimatedValue ||
              0,
            unfinished.actualValue ||
              0,
          ],
        ];

        sheetName =
          "Unfinished Values";
        break;

      default:
        rows = [
          ["ASF Branch Report"],
        ];
    }

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      sheetName
    );

    XLSX.writeFile(
      workbook,
      `ASF-${branchName}-${sheetName}.xlsx`
    );
  };

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  const exportPdf = async (
    visualId = "all"
  ) => {
    try {
      const element =
        visualId === "all"
          ? reportRef.current
          : document.getElementById(
              visualId
            );

      if (!element) return;

      const canvas =
        await html2canvas(element, {
          scale: 2,
          backgroundColor: "#0B1220",
          useCORS: true,
        });

      const image =
        canvas.toDataURL(
          "image/png"
        );

      const landscape =
        canvas.width >= canvas.height;

      const pdf = new jsPDF({
        orientation: landscape
          ? "landscape"
          : "portrait",

        unit: "px",

        format: [
          canvas.width,
          canvas.height,
        ],
      });

      pdf.addImage(
        image,
        "PNG",
        0,
        0,
        canvas.width,
        canvas.height
      );

      pdf.save(
        visualId === "all"
          ? `ASF-${branchName}-Executive-Report.pdf`
          : `ASF-${branchName}-${visualId}.pdf`
      );
    } catch (err) {
      console.error(
        "PDF export error:",
        err
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
    }

    if (type === "excel") {
      exportExcel(visualId);
    }
  };

  /* =======================================================
     PERCENTAGES
  ======================================================= */

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
     UI
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
            HEADER
        ================================================= */}

        <header className="border border-slate-700/80 bg-[#111827]">

          <div className="flex flex-col gap-4 border-b border-slate-700/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center bg-[#118DFF]">
                <FiActivity size={19} />
              </div>

              <div>

                <p className="text-[9px] uppercase tracking-[0.2em] text-[#118DFF]">
                  ASF • POWER BI REPORT
                </p>

                <h1 className="mt-1 text-[20px] font-bold">
                  لوحة فرع{" "}
                  {data.branchName ||
                    branchName}
                </h1>

                <p className="mt-1 text-[9px] text-slate-500">
                  Branch Executive
                  Operations Report
                </p>

              </div>

            </div>

            {/* GLOBAL EXPORT */}

            <div className="relative">

              <button
                onClick={() =>
                  setMenuOpen(
                    menuOpen ===
                      "branch-global"
                      ? null
                      : "branch-global"
                  )
                }
                className="flex h-9 items-center gap-2 border border-slate-700 bg-[#182235] px-4 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <FiMoreVertical size={15} />

                خيارات التقرير
              </button>

              <VisualMenu
                open={
                  menuOpen ===
                  "branch-global"
                }
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

            </div>

          </div>

          {/* HEADER SUMMARY */}

          <div className="grid grid-cols-2 bg-[#0F1727] md:grid-cols-4">

            <div className="border-l border-slate-800 p-4">

              <p className="text-[14px] text-white">
                إجمالي الطلبات
              </p>

              <p className="mt-1 text-xl font-bold text-white">
                {formatNumber(
                  total.count
                )}
              </p>

            </div>

            <div className="border-l border-slate-800 p-4">

              <p className="text-[14px] text-white">
                منتهية
              </p>

              <p className="mt-1 text-xl font-bold text-green-400">
                {formatNumber(
                  finished.count
                )}
              </p>

            </div>

            <div className="border-l border-slate-800 p-4">

              <p className="text-[14px] text-white">
                غير منتهية
              </p>

              <p className="mt-1 text-xl font-bold text-orange-400">
                {formatNumber(
                  unfinished.count
                )}
              </p>

            </div>

            <div className="p-4">

              <p className="text-[14px] text-white">
                قيمة الأعمال
              </p>

              <p className="mt-1 text-xl font-bold text-cyan-400">
                {formatNumber(
                  totalWorksValue
                )}
              </p>

            </div>

          </div>

        </header>

        {/* =================================================
            KPI ROW
        ================================================= */}

        {/* <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">

          <KpiVisual
            id="branch-kpi-total"
            title="إجمالي الطلبات"
            value={formatNumber(
              total.count
            )}
            subtitle="Total Orders"
            color="#118DFF"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

          <KpiVisual
            id="branch-kpi-finished"
            title="الطلبات المنتهية"
            value={formatNumber(
              finished.count
            )}
            subtitle={`${finishedPercentage}% من إجمالي الطلبات`}
            color="#22C55E"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

          <KpiVisual
            id="branch-kpi-unfinished"
            title="الطلبات غير المنتهية"
            value={formatNumber(
              unfinished.count
            )}
            subtitle={`${unfinishedPercentage}% من إجمالي الطلبات`}
            color="#F59E0B"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

          <KpiVisual
            id="branch-kpi-value"
            title="إجمالي قيمة الأعمال"
            value={formatNumber(
              totalWorksValue
            )}
            subtitle="Total Works Value"
            color="#A855F7"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

        </div> */}

        {/* =================================================
            VALUE ANALYSIS
        ================================================= */}

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">

          <ValueVisual
            id="branch-values-total"
            title="إجمالي الطلبات"
            estimated={
              total.estimatedValue
            }
            actual={
              total.actualValue
            }
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

          <ValueVisual
            id="branch-values-finished"
            title="الطلبات المنتهية"
            estimated={
              finished.estimatedValue
            }
            actual={
              finished.actualValue
            }
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

          <ValueVisual
            id="branch-values-unfinished"
            title="الطلبات غير المنتهية"
            estimated={
              unfinished.estimatedValue
            }
            actual={
              unfinished.actualValue
            }
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          />

        </div>

        {/* =================================================
            OFFICES + STATUS
        ================================================= */}

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">

          {/* OFFICES */}

          <Visual
            id="branch-offices"
            title={`مكاتب فرع ${
              data.branchName ||
              branchName
            }`}
            subtitle="Office Performance"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
            className="xl:col-span-7"
          >

            {officeData.length ? (
              <div className="max-h-[360px] overflow-y-auto pr-1">

                {officeData.map(
                  (office, index) => (
                    <OfficeRow
                      key={`${office.label}-${index}`}
                      office={office}
                      index={index}
                    />
                  )
                )}

              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-xs text-slate-600">
                لا توجد بيانات للمكاتب
              </div>
            )}

          </Visual>

          {/* STATUS */}

          <Visual
            id="branch-status"
            title="حالة التنفيذ"
            subtitle="Finished vs Unfinished"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
            className="xl:col-span-5"
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
            STAGE ANALYSIS
        ================================================= */}

        <div className="mt-3">

          <Visual
            id="branch-stages"
            title="تحليل حالات الطلبات"
            subtitle="Actual vs Estimated by Stage"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          >

            <div className="h-[380px]">

              {stageData.length ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={stageData}
                    margin={{
                      top: 15,
                      right: 10,
                      left: -15,
                      bottom: 30,
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
                      name="القيمة التقديرية"
                      fill="#315C8D"
                      barSize={26}
                    />

                    <Bar
                      dataKey="actual"
                      name="القيمة الفعلية"
                      fill="#118DFF"
                      barSize={26}
                    />

                  </BarChart>

                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  لا توجد بيانات للحالات
                </div>
              )}

            </div>

          </Visual>

        </div>

        {/* =================================================
            CATEGORY ANALYSIS
        ================================================= */}

        <div className="mt-3">

          <Visual
            id="branch-categories"
            title="تحليل الفئات"
            subtitle="Categories Performance"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          >

            <div className="h-[350px]">

              {categoryData.length ? (
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
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-600">
                  لا توجد بيانات للفئات
                </div>
              )}

            </div>

          </Visual>

        </div>

        {/* =================================================
            CATEGORY MATRIX
        ================================================= */}

        <div className="mt-3">

          <Visual
            id="branch-matrix"
            title="التفاصيل المالية"
            subtitle="Category Matrix"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            exportVisual={exportVisual}
          >

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>

                  <tr className="border-b border-slate-700 bg-[#101827]">

                    <th className="px-4 py-3 text-right text-[14px] font-semibold text-white">
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

                  {categoryData.map(
                    (category, index) => {

                      const execution =
                        percentage(
                          category.actual,
                          category.estimated
                        );

                      return (
                        <tr
                          key={
                            category.name
                          }
                          className="border-b border-slate-800 hover:bg-[#192438]"
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

                              <span className="text-[13px] text-right font-semibold text-slate-300">
                                {
                                  category.name
                                }
                              </span>

                            </div>

                          </td>

                          <td className="px-4 py-3 text-center text-[13px] text-slate-400">
                            {formatNumber(
                              category.count
                            )}
                          </td>

                          <td className="px-4 py-3 text-center text-[13px] text-blue-400">
                            {formatNumber(
                              category.estimated
                            )}
                          </td>

                          <td className="px-4 py-3 text-center text-[13px] text-green-400">
                            {formatNumber(
                              category.actual
                            )}
                          </td>

                          <td className="px-4 py-3 text-center text-[13px] font-semibold text-white">
                            {formatNumber(
                              category.works
                            )}
                          </td>

                          <td className="px-4 py-3 text-left">

                            <div className="flex items-center gap-2">

                              <div className="h-1.5 w-20 bg-slate-800">

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

                              <span className="text-[12px] text-slate-500">
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
            ASF • Branch Executive Report
          </span>

          <span>
            فرع {data.branchName ||
              branchName}
          </span>

        </footer>

      </div>
    </div>
  );
}