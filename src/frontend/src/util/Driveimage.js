
export function getDriveImageUrl(url) {
  if (!url) return null;

  // لو مش لينك جوجل درايف أصلاً، رجّعه زي ما هو (سيرفر تاني مثلاً)
  if (!url.includes("drive.google.com")) return url;

  const match =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = match ? match[1] : null;

  if (!fileId) return url;

  // ملحوظة: صيغة uc?export=view أحيانًا بترجع صفحة تأكيد بدل الصورة
  // نفسها (خصوصًا مع الملفات الكبيرة)، فـ thumbnail أكتر ثباتًا كـ <img src>.
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
}