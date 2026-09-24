import Swal from "sweetalert2";
import { updateExecutedQuantity } from "../../../services/ExecutedQuantityApi";
import { useCallback, useState } from "react";
import useDebouncedCallback from "../../../hooks/UseDebouncedCallback";
import { qtyInputStyle } from "../Helpers";

export function ExecutedQuantityCell({
  pricingItemId, value, entityType, projectId, token, onLocalChange, onSaved,
}) {
  const [status, setStatus] = useState("idle");
  const isLive = Boolean(projectId);

  const save = useCallback(async (val, note = "") => {
    if (!isLive) return;
    const delta = parseFloat(val) || 0;
    setStatus("saving");
    try {
      const response = await updateExecutedQuantity({
        entityType, projectId, pricingItemId,
        executedQuantity: delta, note, token,
      });
      setStatus("saved");

      const serverTotal = response?.data?.totalExecutedQuantity ?? null;

      onSaved(pricingItemId, delta, serverTotal);

      Swal.fire({
        toast: true, position: "top-end", icon: "success",
        title: "تم حفظ التعديل بنجاح",
        showConfirmButton: false, timer: 1800, timerProgressBar: true,
      });
      setTimeout(() => setStatus("idle"), 1800);
    } catch (err) {
      setStatus("error");
      Swal.fire({
        icon: "error",
        title: "فشل حفظ الكمية المنفذة",
        text: err.response?.data?.message || "يرجى المحاولة مرة أخرى.",
      });
    }
  }, [isLive, entityType, projectId, pricingItemId, token, onSaved]);

  const promptAndSave = useDebouncedCallback(async (val) => {
    if (!isLive) return;

    const { value: note, isConfirmed } = await Swal.fire({
      title: "تأكيد تعديل الكمية المنفذة",
      html: `الكمية الجديدة: <b>${val || 0}</b>`,
      input: "textarea",
      inputPlaceholder: "سبب التعديل (اختياري)...",
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
    });

    if (isConfirmed) {
      save(val, note || "");
    }
  }, 700);

  const handleChange = (val) => {
    onLocalChange(pricingItemId, "executedQuantity", val);
    if (isLive) promptAndSave(val);
  };

  const statusIcon = { saving: "⏳", saved: "✅", error: "⚠️" }[status];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
      <input
        type="number" min="0" step="0.01" placeholder="0"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        style={qtyInputStyle("#dcfce7", "#16a34a")}
      />
      {isLive && (
        <span title={status} style={{ fontSize: "12px", width: "14px" }}>{statusIcon}</span>
      )}
    </div>
  );
}
