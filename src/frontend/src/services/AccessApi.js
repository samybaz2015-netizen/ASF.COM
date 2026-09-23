import axiosInstance from "../api/apiClient";

/**
 * طبقة الاتصال بمنظومة الصلاحيات.
 *
 * تستخدم نفس نقاط النهاية التي تستخدمها نافذة الصلاحيات في صفحة الحسابات،
 * فلا توجد منظومتا صلاحيات متوازيتان (البند 56 من المواصفة).
 *
 * ما تدعمه الخلفية اليوم: صلاحيات على مستوى المستخدم فقط، كنصوص مسطّحة
 * بصيغة {Module}.{Action}. لا ربط أدوار بصلاحيات، ولا منع صريح، ولا نطاق
 * بيانات، ولا سجل تغييرات — راجع docs/access-management.md
 */

function unwrap(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "data" in payload) {
    return payload.data;
  }
  return payload;
}

/** كتالوج الصلاحيات المتاحة: { Module: [code, ...] } */
export async function fetchAvailablePermissions() {
  const { data } = await axiosInstance.get("Permissions/available");
  return data?.modules || unwrap(data) || {};
}

/** صلاحيات مستخدم بعينه. */
export async function fetchUserPermissions(userId) {
  const { data } = await axiosInstance.get(`Permissions/user/${userId}`);
  const payload = unwrap(data);
  if (Array.isArray(payload)) return payload;
  return payload?.permissions ?? [];
}

/** صلاحيات المستخدم الحالي — تُستخدم لحراسة هذه الصفحة نفسها. */
export async function fetchMyPermissions() {
  const { data } = await axiosInstance.get("Permissions/my");
  const payload = unwrap(data);
  if (Array.isArray(payload)) return payload;
  return payload?.permissions ?? [];
}

/**
 * استبدال صلاحيات المستخدم بالكامل في نداء واحد.
 * مفضّل على assign + revoke لأنه ذرّي: لا تبقى حالة وسيطة إن فشل أحدهما.
 */
export async function replaceUserPermissions(userId, permissions) {
  const { data } = await axiosInstance.put("Permissions/replace", {
    userId,
    permissions: [...permissions],
  });
  return unwrap(data);
}

/** قائمة المستخدمين لجدول التبويب الأول. */
export async function fetchUsers() {
  const { data } = await axiosInstance.get("Account/all-user");
  const payload = unwrap(data);
  return Array.isArray(payload) ? payload : payload?.items ?? [];
}

/** أدوار Identity المعرّفة — بالاسم فقط، بلا صلاحيات مرتبطة. */
export async function fetchRoles() {
  const { data } = await axiosInstance.get("Account/roles");
  const payload = unwrap(data);
  if (Array.isArray(payload)) return payload;
  return payload?.roles ?? [];
}

/** إسناد دور لمستخدم — الخلفية تستقبل البريد واسم الدور كمعاملات استعلام. */
export async function assignRole(email, roleName) {
  const { data } = await axiosInstance.post(
    `Account/assign-role?email=${encodeURIComponent(email)}&roleName=${encodeURIComponent(roleName)}`
  );
  return unwrap(data);
}

/**
 * مكان الصلاحية — ما تدعمه الخلفية اليوم.
 *
 * المستخدم مرتبط بإدارة ومكتب في حسابه، ولا يوجد سوى مفتاح واحد يوسّع نطاقه:
 * السماح بالعمل خارج إدارته. لا يوجد نطاق متعدد الإدارات ولا نطاق حسب نوع
 * أمر العمل — راجع docs/access-management.md القسم 3.3
 */
export async function setOutsideBranchAccess(userId, allowed) {
  const { data } = await axiosInstance.put("Account/users/update-permission", {
    engineerId: userId,
    canCreateOutsideCity: allowed,
  });
  return unwrap(data);
}

/** قائمة الإدارات لاختيار نطاق المستخدم. */
export async function fetchBranchList() {
  const { data } = await axiosInstance.get("Branch");
  const payload = unwrap(data);
  return Array.isArray(payload) ? payload : [];
}

/**
 * نقل المستخدم إلى إدارة أخرى — وهو عملياً تغيير نطاق بياناته.
 *
 * يُرسل البريد ومعرّف الإدارة فقط. تحققنا محلياً أن التحديث الجزئي لا يمسح
 * بقية حقول الحساب (الاسم والهاتف والنوع بقيت كما هي).
 */
export async function setUserBranch(email, branchId) {
  const form = new FormData();
  form.append("email", email);
  form.append("BranchId", String(branchId));

  const { data } = await axiosInstance.put("Account/update-account", form);
  return unwrap(data);
}

/* ────────────────────────────────────────────────────────────────────────────
 * صلاحيات الأدوار والتجاوزات الصريحة — نقاط أُضيفت إلى الخلفية
 * ──────────────────────────────────────────────────────────────────────────── */

/** الصلاحيات الفعّالة لمستخدم مع مصدر كل صلاحية: Role أو UserAllow أو UserDeny. */
export async function fetchEffectivePermissions(userId) {
  const { data } = await axiosInstance.get(`Permissions/effective/${userId}`);
  return unwrap(data);
}

/** كل الأدوار مع صلاحياتها وعدد مستخدميها. */
export async function fetchRolePermissions() {
  const { data } = await axiosInstance.get("Permissions/roles");
  const payload = unwrap(data);
  return Array.isArray(payload) ? payload : [];
}

/** استبدال صلاحيات دور بالكامل — يرثها كل مستخدميه فوراً. */
export async function setRolePermissions(roleName, permissions) {
  const { data } = await axiosInstance.put("Permissions/roles", {
    roleName,
    permissions: [...permissions],
  });
  return unwrap(data);
}

/**
 * سماح أو منع صريح لمستخدم.
 * المنع يتقدّم على ما يرثه من دوره، والسماح يضيف فوقه.
 */
export async function setPermissionOverride({ userId, permissionName, isGranted, reason }) {
  const { data } = await axiosInstance.post("Permissions/override", {
    userId,
    permissionName,
    isGranted,
    reason: reason || null,
  });
  return unwrap(data);
}

/** إزالة التجاوز فيعود المستخدم لما يرثه من أدواره. */
export async function clearPermissionOverride(userId, permissionName) {
  const { data } = await axiosInstance.delete("Permissions/override", {
    params: { userId, permissionName },
  });
  return unwrap(data);
}
