import React, { useEffect, useState } from "react";
import axios from "../../api/apiClient";
import Swal from "sweetalert2";
import axiosInstance from "../../api/apiClient";

export default function CustodiesEngContent() {
  const [custodies, setCustodies] = useState([]);
  const [loading, setLoading] = useState(true);
const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
const [activeCustody, setActiveCustody] = useState(null);

const [invoiceForm, setInvoiceForm] = useState({
  invoiceNumber: "",
  invoiceDate: "",
  itemDescription: "",
  quantity: 1,
  unitPrice: 0,
  vatRatePercent: 15,
});

  const fetchMyCustodies = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/custodies/my");
      setCustodies(res.data.data || []);
    } catch (err) {
      Swal.fire("خطأ", "فشل تحميل العهد", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCustodies();
  }, []);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
    }).format(v || 0);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return <div className="text-center py-20">⏳ جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-8" dir="rtl">
      <h1 className="text-3xl font-bold">عُهدي المالية</h1>

      {custodies.map((c) => (
        <div
          key={c.id}
          className="bg-white rounded-xl shadow-lg border overflow-hidden"
        >
          {/* ===== Header ===== */}
          <div className="bg-gradient-to-r from-mainColor to-hoverColor text-white p-6 flex justify-between">
            <button
              onClick={() => {
                setActiveCustody(c);
                setInvoiceModalOpen(true);
              }}
              className="bg-white text-mainColor px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              ➕ صرف فاتورة
            </button>

            {/* <div className="bg-gradient-to-r from-mainColor to-hoverColor text-white p-6 flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">رقم العهدة</p>
                <p className="text-2xl font-bold">#{c.id}</p>
              </div>

              <div className="flex gap-3 items-center">
                <span className="px-4 py-1 rounded-full bg-green-500 text-sm font-bold">
                  مفتوحة
                </span>

                <button
                  onClick={() => {
                    setActiveCustody(c);
                    setInvoiceModalOpen(true);
                  }}
                  className="bg-white text-mainColor px-4 py-2 rounded-lg font-semibold"
                >
                  ➕ صرف فاتورة
                </button>
              </div>
            </div> */}

           
            <span
              className={`px-4 py-1 rounded-full text-sm font-bold flex justify-center items-center ${
                c.status === "Open"
                  ? "bg-green-500"
                  : "bg-gray-500"
              }`}
            >
              {c.status === "Open" ? "مفتوحة" : "مغلقة"}
            </span>
          </div>

          {/* ===== Info ===== */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Info label="اسم الأمين" value={c.custodianName} />
            <Info label="تاريخ الإنشاء" value={formatDate(c.createdAt)} />
            <Info label="المقدم" value={formatCurrency(c.advanceAmount)} />
            <Info
              label="المتبقي"
              value={formatCurrency(c.remainingToSettle)}
              highlight={c.remainingToSettle < 0}
            />
          </div>

          {/* ===== Summary ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-6">
            <Summary
              label="قبل الضريبة"
              value={formatCurrency(c.subtotalBeforeVat)}
              color="blue"
            />
            <Summary
              label="الضريبة"
              value={formatCurrency(c.totalVat)}
              color="orange"
            />
            <Summary
              label="الإجمالي"
              value={formatCurrency(c.grandTotal)}
              color="purple"
            />
          </div>

          {/* ===== Notes ===== */}
          {c.notes && (
            <div className="mx-6 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <b>📝 ملاحظات:</b> {c.notes}
            </div>
          )}

          {/* ===== Invoices ===== */}
          <div className="px-6 pb-6">
            <h3 className="text-xl font-bold mb-3">
              الفواتير ({c.invoicesCount})
            </h3>

            {c.invoices.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">رقم الفاتورة</th>
                      <th className="text-center">التاريخ</th>
                      <th className="text-center">الوصف</th>
                      <th className="text-center">الكمية</th>
                      <th className="text-center">سعر الوحدة</th>
                      <th className="text-center">الضريبة %</th>
                      <th className="text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.invoices.map((inv) => (
                      <tr key={inv.id} className="border-t text-center">
                        <td>{inv.sequenceNo}</td>
                        <td className="font-semibold text-blue-600">
                          {inv.invoiceNumber}
                        </td>
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
      ))}

      {invoiceModalOpen && activeCustody && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl">
         
            <div className="flex justify-start gap-3 mt-4 mr-5">
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                إلغاء
              </button>
            </div>


            {/* Body */}
            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();

                try {
                  await axios.post(
                    `/api/custodies/${activeCustody.id}/invoices`,
                    {
                      ...invoiceForm,
                      quantity: Number(invoiceForm.quantity),
                      unitPrice: Number(invoiceForm.unitPrice),
                      vatRatePercent: Number(invoiceForm.vatRatePercent),
                    }
                  );

                  Swal.fire("تم", "تم صرف الفاتورة بنجاح", "success");

                  setInvoiceModalOpen(false);
                  setInvoiceForm({
                    invoiceNumber: "",
                    invoiceDate: "",
                    itemDescription: "",
                    quantity: 1,
                    unitPrice: 0,
                    vatRatePercent: 15,
                  });

                  fetchMyCustodies(); 
                } catch (err) {
                  Swal.fire(
                    "خطأ",
                    err.response?.data?.message || "فشل صرف الفاتورة",
                    "error"
                  );
                }
              }}
            >

              <FormField label="رقم الفاتورة" hint="رقم الفاتورة كما هو في الإيصال">
                <input
                  className="w-full input border"
                  required
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
                  }
                />
              </FormField>


              <FormField label="تاريخ الفاتورة">
              <input
                type="date"
                className="w-full input border"
                required
                value={invoiceForm.invoiceDate}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })
                }
              />
            </FormField>


              <FormField label="وصف الصنف / الخدمة" >
                <textarea
                  className="w-full input border"
                  required
                  rows={3}
                  value={invoiceForm.itemDescription}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, itemDescription: e.target.value })
                  }
                />
              </FormField>


              <div className="grid grid-cols-2 gap-4">
                  <FormField label="الكمية">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className="input border"
                      value={invoiceForm.quantity}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, quantity: Number(e.target.value) })
                      }
                    />
                  </FormField>

                  <FormField label="سعر الوحدة" hint="بدون ضريبة">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input border"
                      value={invoiceForm.unitPrice}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, unitPrice: e.target.value })
                      }
                    />
                  </FormField>
          

              </div>

              <FormField label="نسبة الضريبة (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="input border"
                  value={invoiceForm.vatRatePercent}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, vatRatePercent: e.target.value })
                  }
                />
              </FormField>


              <button
                type="submit"
                className="w-full bg-mainColor text-white py-3 rounded-lg font-bold hover:bg-hoverColor"
              >
                صرف الفاتورة
              </button>
            </form>
            <div className="bg-gray-50 border rounded-lg p-4 text-sm">
            <p>
              <b>الإجمالي المتوقع:</b>{" "}
              {formatCurrency(
                invoiceForm.quantity *
                invoiceForm.unitPrice *
                (1 + invoiceForm.vatRatePercent / 100)
              )}
            </p>
          </div>

          </div>
        </div>
      )}


    </div>
  );
}

/* ===== Small Components ===== */

const Info = ({ label, value, highlight }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`font-bold ${highlight ? "text-red-600" : ""}`}>
      {value}
    </p>
  </div>
);

const Summary = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <p className="text-sm">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

const FormField = ({ label, children, hint }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-gray-700">
      {label}
    </label>
    {children}
    {hint && (
      <p className="text-xs text-gray-400">{hint}</p>
    )}
  </div>
);
