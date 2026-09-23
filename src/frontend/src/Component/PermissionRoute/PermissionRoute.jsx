import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getUserSession } from "../../function/AuthStorage";

export function getUserPermissions() {
  const user = getUserSession();
  return user?.permissions || [];
}

export function getUserType() {
  const user = getUserSession();
  return user?.userType || null;
}

export function hasPermission(permission) {
  return getUserPermissions().includes(permission);
}

export function hasAnyPermission(permissions) {
  const userPerms = getUserPermissions();
  return permissions.some((p) => userPerms.includes(p));
}

function showDeniedAlert() {
  Swal.fire({
    icon: "warning",
    title: "غير مصرّح لك",
    text: "معندكش صلاحية الوصول لهذه الصفحة",
    confirmButtonText: "تمام",
    confirmButtonColor: "#2A385B",
  });
}

/**
 * PermissionRoute
 *
 * Props:
 *   adminOnly  - true → يدخل Admin بس، أي حد تاني يتمنع حتى لو عنده permissions
 *   permission - single permission string
 *   anyOf      - array of permissions (any one is enough)
 *   fallback   - redirect if denied (default: "/home-page")
 *   children   - component to render if allowed
 */
export default function PermissionRoute({
  permission,
  anyOf,
  adminOnly = false,
  fallback = "/home-page",
  children,
}) {
  const userType = getUserType();

  let allowed;
  if (adminOnly) {
    allowed = userType === "admin";
  } else if (userType === "admin") {
    allowed = true;
  } else if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(anyOf);
  } else {
    allowed = false;
  }

  useEffect(() => {
    if (!allowed) showDeniedAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return allowed ? children : <Navigate to={fallback} replace />;
}