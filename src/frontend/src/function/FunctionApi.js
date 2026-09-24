import axiosInstance from "../api/apiClient";
import { Url, domain } from "../util/Apiconfig"; // عدّل المسار حسب مكان الملف عندك

// إعادة تصدير للحفاظ على التوافق مع كل الملفات اللي بتستورد
// Url / domain من هنا تاريخيًا (backward compatibility)
export { Url, domain };

/**
 * كل الدوال هنا بتستخدم axiosInstance الموحّد اللي فيه الـ interceptor
 * المسؤول الوحيد عن إرفاق التوكن (Authorization header).
 */

export async function fetchDataWithRetries(URL, setApiData, status) {
  try {
    const response = await axiosInstance.get(URL);
    setApiData(response.data);
    if (typeof status === "function") {
      status(response.status);
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export async function postData(APiURL, userData, setError) {
  try {
    const response = await axiosInstance.post(APiURL, userData);
    return response;
  } catch (error) {
    console.error(error);
    if (error.response && error.response.status === 401) {
      setError("كلمة السر أو البريد الإلكتروني غير صحيح");
    } else if (error.response && error.response.status === 405) {
      setError("الطلب غير مسموح.");
    } else {
      setError("حدث خطأ ما. حاول مرة أخرى لاحقاً.");
    }
    throw error;
  }
}

export async function postDatatoQueryParams(APiURL, params, setError) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await axiosInstance.post(`${APiURL}?${queryParams}`, null);
    return response;
  } catch (error) {
    setError(error);
    console.error(error);
    throw error;
  }
}

export async function putDataToQueryParams(APiURL, params) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await axiosInstance.put(`${APiURL}?${queryParams}`, null);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteFunction(APiURL) {
  try {
    const response = await axiosInstance.delete(APiURL, {
      headers: {
        "X-Request-With": "XMLHttpRequest",
      },
    });
    return response;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`Resource not found: ${APiURL}`);
    } else {
      console.error(`Error deleting resource: ${APiURL}`, error);
    }
  }
}