import axiosInstance from "../../../api/apiClient";

export const getBranches = async () => {
  const res = await axiosInstance.get("/Branch");
  return res.data?.data || [];
};