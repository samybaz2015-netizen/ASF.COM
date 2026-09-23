
import axiosInstance from "../../../api/apiClient";

const ENDPOINTS = {
  overview: "/dashboard/overview",
  jeddah: "/dashboard/branch/jeddah",
  riyadh: "/dashboard/branch/riyadh",
};

export const dashboardService = {

  getOverview: (filters = {}) =>
    axiosInstance.get(ENDPOINTS.overview, {
      params: filters,
    }),

  getJeddah: (filters = {}) =>
    axiosInstance.get(ENDPOINTS.jeddah, {
      params: filters,
    }),

  getRiyadh: (filters = {}) =>
    axiosInstance.get(ENDPOINTS.riyadh, {
      params: filters,
    }),

};

export default dashboardService;