
const STORAGE_KEY = "user";

export function setUserSession(userData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return true;
  } catch (e) {
    // ممكن يحصل لو الخاصية متقفلة (وضع تصفح خاص في بعض المتصفحات القديمة)
    console.error("Failed to persist user session:", e);
    return false;
  }
}

export function getUserSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Corrupted user session, clearing it:", e);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearUserSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isUserSessionValid() {
  return getUserSession() !== null;
}

export function getUserToken() {
  const user = getUserSession();
  return user?.token || null;
}