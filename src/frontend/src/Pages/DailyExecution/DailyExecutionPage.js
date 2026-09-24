import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileSignature,
  faFloppyDisk,
  faPaperPlane,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { getUserSession } from "../../function/AuthStorage";

import {
  fetchExecutionLogs,
  fetchWorkOrder,
  getTypeConfig,
  searchWorkOrder,
  searchWorkOrderAcrossTypes,
  submitDailyQuantities,
} from "../../services/DailyExecutionApi";

import { WorkOrderSearch } from "./components/WorkOrderSearch";
import { DailyItemsTable } from "./components/DailyItemsTable";
import {
  ExecutionPhotos,
  SupervisionForms,
} from "./components/DailyAttachments";
import { DailyUpdateHistory } from "./components/DailyUpdateHistory";
import {
  computeProgressBefore,
  computeWorkOrderProgress,
  formatCurrency,
  formatNumber,
  normalizeItem,
  validateDailyUpdate,
} from "./utils/calculations";

import "./DailyExecution.css";

let attachmentSeq = 0;
const nextId = () => `att-${++attachmentSeq}`;

function readItems(workOrder) {
  const candidates = [
    workOrder?.pricingItems,
    workOrder?.constructionPricingItems,
    workOrder?.maintenancePricingItems,
    workOrder?.emergencyPricingItems,
    workOrder?.projectPricingItems,
    workOrder?.items,
  ];
  const list = candidates.find((c) => Array.isArray(c) && c.length > 0) || [];
  return list.map(normalizeItem);
}

function DailyExecutionPage() {
  const { t } = useTranslation();
  const user = useMemo(() => getUserSession() || {}, []);
  const permissions = useMemo(() => user.permissions || [], [user]);
  const isAdmin = user.userType === "admin";

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [typeKey, setTypeKey] = useState(null);
  const [workOrder, setWorkOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [dailyQuantities, setDailyQuantities] = useState({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [forms, setForms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // البند 6: منع الإرسال المزدوج عند الضغط المتكرر
  const inFlight = useRef(false);

  const hasPermission = useCallback(
    (suffix) => {
      if (isAdmin) return true;
      const prefix = getTypeConfig(typeKey)?.permissionPrefix;
      return prefix ? permissions.includes(`${prefix}.${suffix}`) : false;
    },
    [isAdmin, permissions, typeKey],
  );

  const canUpdate = hasPermission("Update");
  const canExceedPlanned =
    isAdmin || permissions.includes("DailyExecution.ExceedPlanned");

  const progress = useMemo(
    () => computeWorkOrderProgress(items, dailyQuantities),
    [items, dailyQuantities],
  );
  const progressBefore = useMemo(() => computeProgressBefore(items), [items]);

  const touchedCount = useMemo(
    () =>
      Object.values(dailyQuantities).filter((v) => parseFloat(v) > 0).length,
    [dailyQuantities],
  );

  const validation = useMemo(
    () =>
      validateDailyUpdate({
        items,
        dailyQuantities,
        canExceedPlanned,
        photoCount: photos.length,
      }),
    [items, dailyQuantities, canExceedPlanned, photos.length],
  );

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, [photos]);

  const loadWorkOrder = useCallback(async (hit) => {
    setTypeKey(hit.type);
    setDailyQuantities({});
    setPhotos([]);
    setForms([]);
    setNotes("");

    try {
      const full = await fetchWorkOrder({
        type: hit.type,
        id: hit.workOrder.id ?? hit.workOrder.orderId,
      });
      const resolved = full || hit.workOrder;
      setWorkOrder(resolved);
      setItems(readItems(resolved));
    } catch {
      setWorkOrder(hit.workOrder);
      setItems(readItems(hit.workOrder));
    }

    setLoadingLogs(true);
    try {
      const history = await fetchExecutionLogs({
        type: hit.type,
        id: hit.workOrder.id ?? hit.workOrder.orderId,
      });
      setLogs(Array.isArray(history) ? history : []);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const handleSearch = useCallback(
    async ({ orderNumber, type }) => {
      setSearching(true);
      setResults([]);
      setWorkOrder(null);
      setItems([]);

      try {
        let hits;
        if (type) {
          const found = await searchWorkOrder({ orderId: orderNumber, type });
          const record = Array.isArray(found) ? found[0] : found;
          hits = record ? [{ type, workOrder: record }] : [];
        } else {
          hits = await searchWorkOrderAcrossTypes(orderNumber);
        }

        setResults(hits);

        if (hits.length === 0) {
          Swal.fire({
            icon: "info",
            title: "لا توجد نتائج",
            text: "لم يُعثر على أمر عمل بهذا الرقم ضمن صلاحياتك.",
          });
        } else if (hits.length === 1) {
          await loadWorkOrder(hits[0]);
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "تعذّر البحث",
          text: error?.response?.data?.message || error.message,
        });
      } finally {
        setSearching(false);
      }
    },
    [loadWorkOrder],
  );

  const handleQuantityChange = useCallback((pricingItemId, value) => {
    setDailyQuantities((prev) => ({ ...prev, [pricingItemId]: value }));
  }, []);

  const addPhotos = useCallback((files) => {
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: nextId(),
        file,
        previewUrl: URL.createObjectURL(file),
        description: "",
        category: "During",
        pricingItemId: null,
      })),
    ]);
  }, []);

  const addForms = useCallback((files) => {
    setForms((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: nextId(),
        file,
        formName: file.name.replace(/\.[^.]+$/, ""),
        formType: "",
        formDate: new Date().toISOString().slice(0, 10),
        notes: "",
      })),
    ]);
  }, []);

  const updateIn = (setter) => (id, patch) =>
    setter((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );

  const removeFrom = (setter) => (id) =>
    setter((prev) => prev.filter((entry) => entry.id !== id));

  const handleSubmit = useCallback(async () => {
    if (inFlight.current) return;

    if (!validation.valid) {
      Swal.fire({
        icon: "warning",
        title: "لا يمكن الإرسال",
        html: `<ul style="text-align:right;padding-inline-start:1.2rem">${validation.errors
          .map((e) => `<li>${e}</li>`)
          .join("")}</ul>`,
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد تحديث التنفيذ اليومي",
      html:
        `<div style="text-align:right">` +
        `عدد البنود: <b>${validation.touched.length}</b><br/>` +
        `قيمة تنفيذ اليوم: <b>${formatCurrency(progress.totalDailyValue)}</b><br/>` +
        `نسبة الإنجاز: <b>${formatNumber(progressBefore, 1)}%</b> ← ` +
        `<b>${formatNumber(progress.progressPercentage, 1)}%</b>` +
        `</div>`,
      showCancelButton: true,
      confirmButtonText: "إرسال",
      cancelButtonText: "إلغاء",
    });
    if (!confirm.isConfirmed) return;

    inFlight.current = true;
    setSubmitting(true);

    try {
      await submitDailyQuantities({
        type: typeKey,
        id: workOrder.id ?? workOrder.orderId,
        items: validation.touched,
        note: notes,
      });

      Swal.fire({
        icon: "success",
        title: "تم حفظ التحديث اليومي",
        text: "حُدّث أمر العمل وبنوده ونِسَب الإنجاز.",
        timer: 2400,
        showConfirmButton: false,
      });

      await loadWorkOrder({ type: typeKey, workOrder });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "فشل حفظ التحديث",
        text:
          error?.response?.data?.message ||
          "حدث خطأ أثناء الإرسال. لم تُحفظ أي كمية.",
      });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, [
    validation,
    progress,
    progressBefore,
    typeKey,
    workOrder,
    notes,
    loadWorkOrder,
  ]);

  return (
    <>
      
      <main className="de-page">

      <WorkOrderSearch
        onSearch={handleSearch}
        searching={searching}
        results={results}
        onSelect={loadWorkOrder}
        selected={workOrder}
        typeKey={typeKey}
      />

      {workOrder && (
        <>
          {!canUpdate && (
            <p className="de-warning">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              لا تملك صلاحية تحديث هذا النوع من أوامر العمل — العرض فقط.
            </p>
          )}

          <section className="de-card">
            <h2 className="de-card__title">بنود الأعمال والكميات</h2>

                <p className="de-warning de-warning--info">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  القيم المعروضة محسوبة بأسعار وحدات المقايسة، وهي قيمة الأعمال
                  المنفذة ميدانياً — وليست مستحق الاستشاري. مستحق الإشراف يُحسب
                  بسعر وحدة الإشراف، ولا يوجد له مصدر في النظام حتى الآن.
                </p>
            <DailyItemsTable
              items={items}
              dailyQuantities={dailyQuantities}
              onChange={handleQuantityChange}
              canExceedPlanned={canExceedPlanned}
              disabled={!canUpdate || submitting}
            />

            <div className="de-summary">
              <Summary label="بنود محدَّثة اليوم" value={touchedCount} />
              <Summary
                label="قيمة أعمال اليوم (مقايسة)"
                value={formatCurrency(progress.totalDailyValue)}
              />
              <Summary
                label="إجمالي قيمة الأعمال (مقايسة)"
                value={formatCurrency(progress.totalExecutedValue)}
              />
              <Summary
                label="نسبة إنجاز أمر العمل"
                value={`${formatNumber(progressBefore, 1)}% ← ${formatNumber(progress.progressPercentage, 1)}%`}
              />
              <Summary label="مستحق الإشراف لهذا التحديث" value="غير متاح" />
            </div>
          </section>

          <ExecutionPhotos
            photos={photos}
            onAdd={addPhotos}
            onUpdate={updateIn(setPhotos)}
            onRemove={removeFrom(setPhotos)}
            items={items}
            required={touchedCount > 0}
            disabled={!canUpdate || submitting}
          />

          <SupervisionForms
            forms={forms}
            onAdd={addForms}
            onUpdate={updateIn(setForms)}
            onRemove={removeFrom(setForms)}
            disabled={!canUpdate || submitting}
          />

          <section className="de-card">
            <h2 className="de-card__title">الملاحظات</h2>
            <textarea
              className="de-notes"
              rows={3}
              value={notes}
              disabled={!canUpdate || submitting}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات على تنفيذ اليوم…"
            />
          </section>

          <div className="de-actions">
            <button type="button" className="de-btn de-btn--ghost" disabled>
              <FontAwesomeIcon icon={faFloppyDisk} />
              حفظ كمسودة
            </button>

            <button
              type="button"
              className="de-btn de-btn--primary"
              onClick={handleSubmit}
              disabled={!canUpdate || submitting || !validation.valid}
            >
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} />
              )}
              إرسال التحديث
            </button>
          </div>

          {!validation.valid &&
            validation.errors.length > 0 &&
            touchedCount > 0 && (
              <ul className="de-errors">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

          <p className="de-hint de-hint--block">
            «حفظ كمسودة» ودورة الاعتماد (إرسال للمراجعة ← اعتماد / إعادة
            للتعديل) تحتاج كيانات وحالات في الواجهة الخلفية غير موجودة بعد. في
            الوضع الحالي يُطبَّق التحديث على أمر العمل فور الإرسال، كما يفعل
            النظام اليوم. التفاصيل في
            <code> docs/daily-execution-update.md</code>.
          </p>

          <DailyUpdateHistory logs={logs} loading={loadingLogs} />
        </>
        )}
      </main>
    </>
  );
}

function Summary({ label, value }) {
  return (
    <div className="de-summary__item">
      <span className="de-summary__label">{label}</span>
      <span className="de-summary__value">{value}</span>
    </div>
  );
}

export default DailyExecutionPage;
