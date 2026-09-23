import React, { useState, useEffect } from 'react';
import { fetchDataWithRetries } from '../../function/FunctionApi';
import { MdAccountBalance, MdReceipt, MdAttachMoney, MdTrendingUp, MdTrendingDown, MdExpandMore, MdExpandLess, MdSearch, MdPrint, MdFileDownload, MdAdd, MdLock } from 'react-icons/md';
import Swal from 'sweetalert2';
import apiClient from '../../api/apiClient';
import * as XLSX from "xlsx-js-style";
import CreateCustodyModal from './CreateCustodyModal';
import axiosInstance from '../../api/apiClient';

function CustodiesContent() {
  const [custodies, setCustodies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCustodies, setSelectedCustodies] = useState(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustody, setSelectedCustody] = useState(null);

  const fetchCustodies = async () => {
    try {
      setLoading(true);
      await fetchDataWithRetries(
        'custodies',
        (apiResp) => {
          const list = Array.isArray(apiResp) ? apiResp : (apiResp?.data ?? []);
          console.log(list)
          const normalized = list.map((custody) => ({
            id: custody.id,
            status: custody.status,
            createdAt: custody.createdAt,
            custodianName: custody.custodianName || custody.custodian?.userName || custody.custodian?.name || "—",
            advanceAmount: Number(custody.advanceAmount ?? 0),
            subtotalBeforeVat: Number(custody.subtotalBeforeVat ?? 0),
            totalVat: Number(custody.totalVat ?? 0),
            grandTotal: Number(custody.grandTotal ?? 0),
            remainingToSettle: Number(custody.remainingToSettle ?? 0),
            invoices: Array.isArray(custody.invoices) ? custody.invoices : [],
            invoicesCount: custody.invoicesCount ?? (Array.isArray(custody.invoices) ? custody.invoices.length : 0),
            notes: custody.notes ?? "",
          }));

          setCustodies(normalized);
        },
        (status) => {
          console.log('Custodies API Status:', status);
        }
      );
    } catch (error) {
      console.error('Error fetching custodies:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ في تحميل بيانات العهد',
        confirmButtonText: 'موافق'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustodies();
  }, []);

  const calculateStats = () => {
    if (!custodies || custodies.length === 0) {
      return {
        totalCustodies: 0,
        totalAdvanceAmount: 0,
        totalGrandTotal: 0,
        totalRemaining: 0,
        openCustodies: 0,
        closedCustodies: 0,
        averageAdvanceAmount: 0,
        totalInvoices: 0
      };
    }

    const stats = custodies.reduce((acc, custody) => {
      acc.totalCustodies += 1;
      acc.totalAdvanceAmount += custody.advanceAmount || 0;
      acc.totalGrandTotal += custody.grandTotal || 0;
      acc.totalRemaining += custody.remainingToSettle || 0;
      acc.totalInvoices += custody.invoicesCount || 0;
      
      if (custody.status === 'Open') {
        acc.openCustodies += 1;
      } else if (custody.status === 'Closed') {
        acc.closedCustodies += 1;
      }
      
      return acc;
    }, {
      totalCustodies: 0,
      totalAdvanceAmount: 0,
      totalGrandTotal: 0,
      totalRemaining: 0,
      openCustodies: 0,
      closedCustodies: 0,
      totalInvoices: 0
    });

    stats.averageAdvanceAmount = stats.totalCustodies > 0 ? stats.totalAdvanceAmount / stats.totalCustodies : 0;
    return stats;
  };
  

  const stats = calculateStats();

  const filteredAndSortedCustodies = () => {
    let filtered = custodies.filter(custody => {
      const matchesSearch = custody.custodianName?.toLowerCase().trim().includes(searchTerm.toLowerCase().trim()) ||
                           custody.notes?.toLowerCase().trim().includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === 'all' || custody.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const toggleRowExpansion = (custodyId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(custodyId)) {
      newExpanded.delete(custodyId);
    } else {
      newExpanded.add(custodyId);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Open':
        return 'مفتوح';
      case 'Closed':
        return 'مغلق';
      default:
        return status;
    }
  };

const exportCustodies = (exportData) => {
  const wb = XLSX.utils.book_new();

  exportData.forEach((custody) => {

    const wsData = [
      ["تفاصيل العهدة"],
      [],
      ["رقم العهدة", custody.id],
      ["اسم الأمين", custody.custodianName],
      ["الحالة", getStatusText(custody.status)],
      ["تاريخ الإنشاء", formatDate(custody.createdAt)],
      ["المبلغ المقدم", custody.advanceAmount],
      ["إجمالي الفواتير", custody.grandTotal],
      ["المتبقي للتسوية", custody.remainingToSettle],
      ["عدد الفواتير", custody.invoicesCount],
      ["ملاحظات", custody.notes || "—"],
      [],
      ["#", "رقم الفاتورة", "التاريخ", "الوصف", "الكمية", "سعر الوحدة", "الضريبة %", "الإجمالي"],
      ...custody.invoices.map((inv, i) => ([
        i + 1,
        inv.invoiceNumber,
        formatDate(inv.invoiceDate),
        inv.itemDescription,
        inv.quantity,
        inv.unitPrice,
        inv.vatRatePercent,
        inv.lineTotal
      ]))
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    /* ===== Styles ===== */
    const headerStyle = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };

    const cellBorder = {
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };

    /* Title */
    ws["A1"].s = {
      font: { bold: true, sz: 18 },
      alignment: { horizontal: "center" }
    };
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    /* Invoice Header */
    const headerRowIndex = 12;
    for (let c = 0; c < 8; c++) {
      const cell = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      ws[cell].s = headerStyle;
    }

    /* Borders for table */
    const tableStart = 12;
    const tableEnd = tableStart + custody.invoices.length;

    for (let r = tableStart + 1; r <= tableEnd; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = XLSX.utils.encode_cell({ r, c });
        if (ws[cell]) ws[cell].s = cellBorder;
      }
    }

    ws["!rows"] = [
  { hpt: 40 }, // العنوان
  {},
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
  { hpt: 28 },
];
    ws["!cols"] = [
  { wch: 8 },
  { wch: 28 },
  { wch: 22 },
  { wch: 50 },
  { wch: 18 },
  { wch: 20 },
  { wch: 18 },
  { wch: 24 }
];

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `Custody_${custody.id}`.substring(0, 31)
    );
  });

  XLSX.writeFile(wb, "Custodies_Report.xlsx");
};


  const handleExport = () => {
    const visibleData = filteredAndSortedCustodies();

    if (selectedCustodies.size > 0) {
      const selectedData = visibleData.filter(c => selectedCustodies.has(c.id));
      exportCustodies(selectedData);
      return;
    }

    Swal.fire({
      icon: "question",
      title: "لم يتم اختيار عهد",
      text: "هل تريد تصدير كل العهد الظاهرة؟",
      showCancelButton: true,
      confirmButtonText: "نعم",
      cancelButtonText: "إلغاء",
    }).then(res => {
      if (res.isConfirmed) {
        exportCustodies(visibleData);
      }
    });
  };

  const toggleCustodySelection = (id) => {
    const newSet = new Set(selectedCustodies);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedCustodies(newSet);
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredAndSortedCustodies().map(c => c.id);
    if (selectedCustodies.size === visibleIds.length) {
      setSelectedCustodies(new Set());
    } else {
      setSelectedCustodies(new Set(visibleIds));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateSuccess = () => {
    fetchCustodies();
  };


const handleCloseCustody = async (custody) => {
  const result = await Swal.fire({
    title: "قفل العهدة",
    text: "هل أنت متأكد من قفل هذه العهدة؟ لا يمكن التراجع.",
    icon: "warning",
    input: "textarea",
    inputLabel: "ملاحظات (اختياري)",
    inputPlaceholder: "اكتب سبب القفل أو أي ملاحظات...",
    showCancelButton: true,
    confirmButtonText: "نعم، اقفل العهدة",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#d33",
  });

  if (!result.isConfirmed) return;

  try {
    await axiosInstance.put(
      `/custodies/${custody.id}/close`,
      {
        notes: result.value || "",
        closedAt: new Date().toISOString(),
      }
    );

    Swal.fire("تم", "تم قفل العهدة بنجاح", "success");
    fetchCustodies();

  } catch (err) {
    Swal.fire(
      "خطأ",
      err.response?.data?.message || "فشل قفل العهدة",
      "error"
    );
  }
};


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainColor"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">

      {/* Header */}
<div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">إدارة العهد</h1>
          <p className="text-gray-600 text-sm sm:text-base">عرض وإدارة جميع العهد المالية</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-mainColor text-white rounded-lg hover:bg-hoverColor transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
        >
          <MdAdd size={24} />
          <span className="font-semibold whitespace-nowrap">إنشاء عهدة جديدة</span>
        </button>
      </div>

      {/* Statistics Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-r-4 border-mainColor">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">إجمالي العهد</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stats.totalCustodies}</p>
            </div>
            <MdAccountBalance className="h-8 w-8 text-mainColor shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-r-4 border-mainColor">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">إجمالي المقدم</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalAdvanceAmount)}</p>
            </div>
            <MdAttachMoney className="h-8 w-8 text-mainColor shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-r-4 border-mainColor">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">إجمالي الفواتير</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalGrandTotal)}</p>
            </div>
            <MdReceipt className="h-8 w-8 text-mainColor shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-r-4 border-mainColor">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">المتبقي للتسوية</p>
              <p className={`text-xl sm:text-2xl font-bold truncate ${stats.totalRemaining >= 0 ? 'text-mainColor' : 'text-red-600'}`}>
                {formatCurrency(stats.totalRemaining)}
              </p>
            </div>
            {stats.totalRemaining >= 0 ? (
              <MdTrendingUp className="h-8 w-8 text-mainColor shrink-0" />
            ) : (
              <MdTrendingDown className="h-8 w-8 text-red-500 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">عهد مفتوحة</p>
              <p className="text-xl font-bold text-green-600">{stats.openCustodies}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full shrink-0"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">عهد مغلقة</p>
              <p className="text-xl font-bold text-gray-600">{stats.closedCustodies}</p>
            </div>
            <div className="w-3 h-3 bg-gray-500 rounded-full shrink-0"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">متوسط المقدم</p>
              <p className="text-xl font-bold text-mainColor truncate">{formatCurrency(stats.averageAdvanceAmount)}</p>
            </div>
            <MdAttachMoney className="h-6 w-6 text-mainColor shrink-0" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative w-full md:flex-1 md:max-w-md">
              <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في العهد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="Open">مفتوح</option>
              <option value="Closed">مغلق</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mainColor focus:border-transparent"
            >
              <option value="createdAt-desc">تاريخ الإنشاء (الأحدث)</option>
              <option value="createdAt-asc">تاريخ الإنشاء (الأقدم)</option>
              <option value="advanceAmount-desc">المقدم (الأكبر)</option>
              <option value="advanceAmount-asc">المقدم (الأصغر)</option>
              <option value="grandTotal-desc">إجمالي الفواتير (الأكبر)</option>
              <option value="grandTotal-asc">إجمالي الفواتير (الأصغر)</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-mainColor text-white rounded-lg hover:bg-hoverColor transition-colors whitespace-nowrap"
            >
              <MdFileDownload />
              تصدير
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-mainColor text-white rounded-lg hover:bg-hoverColor transition-colors whitespace-nowrap"
            >
              <MdPrint />
              طباعة
            </button>
          </div>
        </div>
      </div>

      {/* Custodies Table */}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-mainColor text-white">
              <tr>
                <th className="px-4 py-3 text-right">
                  <input
                    type="checkbox"
                    checked={selectedCustodies.size === filteredAndSortedCustodies().length && filteredAndSortedCustodies().length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-right font-semibold">رقم العهدة</th>
                <th className="px-4 py-3 text-right font-semibold">اسم الأمين</th>
                <th className="px-4 py-3 text-right font-semibold">المبلغ المقدم</th>
                <th className="px-4 py-3 text-right font-semibold">إجمالي الفواتير</th>
                <th className="px-4 py-3 text-right font-semibold">المتبقي</th>
                <th className="px-4 py-3 text-right font-semibold">عدد الفواتير</th>
                <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right font-semibold">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCustodies().map((custody, index) => (
                <React.Fragment key={custody.id}>
                  <tr className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCustodies.has(custody.id)}
                        onChange={() => toggleCustodySelection(custody.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-mainColor">#{custody.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{custody.custodianName}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{formatCurrency(custody.advanceAmount)}</td>
                    <td className="px-4 py-3 text-purple-600 font-semibold">{formatCurrency(custody.grandTotal)}</td>
                    <td className={`px-4 py-3 font-bold ${custody.remainingToSettle >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(custody.remainingToSettle)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-200 px-3 py-1 rounded-full text-sm font-semibold">
                        {custody.invoicesCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(custody.status)}`}>
                        {getStatusText(custody.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(custody.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">

                        {/* عرض التفاصيل */}
                        <button
                          onClick={() => setSelectedCustody(custody)}
                          className="p-2 rounded-lg text-mainColor hover:bg-gray-100 hover:text-hoverColor transition"
                          title="عرض التفاصيل"
                        >
                          <MdExpandMore size={22} />
                        </button>

                        {/* قفل العهدة */}
                        {custody.status === "Open" && (
                          <button
                            onClick={() => handleCloseCustody(custody)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                            title="قفل العهدة"
                          >
                            <MdLock size={22} />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>

                
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedCustodies().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">لا توجد عهد تطابق البحث</p>
          </div>
        )}

      </div>

      {/* Create Custody Modal */}
      <CreateCustodyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

       {/* Details Custody Modal */}

      {selectedCustody && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[90vh]  overflow-y-auto rounded-xl shadow-xl">

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b bg-mainColor text-white">
              <h2 className="text-2xl font-bold">
                تفاصيل العهدة #{selectedCustody.id}
              </h2>
              <button
                onClick={() => setSelectedCustody(null)}
                className="text-white text-2xl"
              >
                ✖
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">قبل الضريبة</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedCustody.subtotalBeforeVat)}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">الضريبة</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(selectedCustody.totalVat)}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">الإجمالي</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(selectedCustody.grandTotal)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedCustody.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold mb-1">📝 ملاحظات</p>
                  <p>{selectedCustody.notes}</p>
                </div>
              )}

              {/* Invoices */}
              {selectedCustody.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th>#</th>
                        <th>رقم الفاتورة</th>
                        <th>التاريخ</th>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>الضريبة</th>
                        <th>الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustody.invoices.map(inv => (
                        <tr key={inv.id} className="border-t">
                          <td>{inv.sequenceNo}</td>
                          <td>{inv.invoiceNumber}</td>
                          <td>{formatDate(inv.invoiceDate)}</td>
                          <td>{inv.itemDescription}</td>
                          <td>{inv.quantity.toFixed(3)}</td>
                          <td>{formatCurrency(inv.unitPrice)}</td>
                          <td>{inv.vatRatePercent}%</td>
                          <td className="font-bold text-green-600">
                            {formatCurrency(inv.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  📭 لا توجد فواتير
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustodiesContent;