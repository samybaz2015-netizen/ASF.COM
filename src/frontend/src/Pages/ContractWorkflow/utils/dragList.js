/**
 * سحب وإفلات بالمعرّفات، بلا مكتبة خارجية.
 *
 * يعتمد على سحب HTML الأصلي، فيعمل في الاتجاهين (يمين‑يسار ويسار‑يمين) بلا
 * إعداد إضافي. الناتج دائماً قائمة معرّفات بالترتيب الجديد، وهو ما تنتظره
 * الخلفية تماماً.
 */

/** يعيد قائمة جديدة بعد نقل العنصر من موضع إلى آخر. */
export function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * خصائص السحب لعنصر في قائمة.
 *
 * @param index ترتيب العنصر الحالي
 * @param dragIndex الموضع المسحوب حالياً (من حالة الصفحة)
 * @param setDragIndex محدّث تلك الحالة
 * @param onDrop تُستدعى بالترتيب الجديد عند الإفلات
 * @param items القائمة الحالية
 */
export function dragProps({ index, dragIndex, setDragIndex, onDrop, items, disabled }) {
  if (disabled) return {};

  return {
    draggable: true,
    onDragStart: (event) => {
      setDragIndex(index);
      event.dataTransfer.effectAllowed = "move";
      // بعض المتصفحات لا تبدأ السحب بلا بيانات.
      event.dataTransfer.setData("text/plain", String(index));
    },
    onDragOver: (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event) => {
      event.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      onDrop(moveItem(items, dragIndex, index));
      setDragIndex(null);
    },
    onDragEnd: () => setDragIndex(null),
  };
}

/** نقل بلوحة المفاتيح، للوصول بلا فأرة. */
export function keyboardMove(event, { index, items, onDrop }) {
  const back = event.key === "ArrowUp" || event.key === "ArrowRight";
  const forward = event.key === "ArrowDown" || event.key === "ArrowLeft";
  if ((!back && !forward) || !event.altKey) return false;

  event.preventDefault();
  const target = back ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return false;

  onDrop(moveItem(items, index, target));
  return true;
}
