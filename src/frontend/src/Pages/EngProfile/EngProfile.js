import React, { useEffect, useState, useCallback, memo } from "react";
import ProfileForm from "./ProfileForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../api/apiClient";
import Swal from "sweetalert2";
import { LoadingModal } from "../../Component/Common/ModelComponents";
import { motion } from "framer-motion";

const toIsoOrNull = (v) => (v ? new Date(v).toISOString() : null);

const EngProfile = () => {
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState({
    UserImage: null,
    Certifications: null,
    Files1: null,
  });
  const queryClient = useQueryClient();

  // ── جلب بيانات الحساب ─────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["accountProfile"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          "/Account/get-engineer-profile"
        );
        return response.data.data;
      } catch (err) {
        throw new Error(
          err.response?.data?.message || "تعذر تحميل بيانات الحساب"
        );
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (data) setProfile(data);
  }, [data]);

  // ── تحديث الحساب ───────────────────────────────────────────────
  const { mutate: updateAccount, isPending: isUpdating } = useMutation({
    mutationFn: async (updated) => {
      const formData = new FormData();

      formData.append("Email", updated.email ?? "");
      formData.append("UserName", updated.userName ?? "");
      formData.append("PhoneNumber", updated.phoneNumber ?? "");
      formData.append("BranchId", updated.branchId ?? "");
      formData.append("UserType", updated.userType ?? "");
      formData.append("DisplayName", updated.displayName ?? "");
      formData.append("Specialization", updated.specialization ?? "");
      formData.append("ExperienceYears", updated.experienceYears ?? "");
      formData.append("Bio", updated.bio ?? "");
      formData.append("JobTitle", updated.jobTitle ?? "");

      if (updated.dateOfBirth)
        formData.append("DateOfBirth", toIsoOrNull(updated.dateOfBirth));
      if (updated.hireDate)
        formData.append("HireDate", toIsoOrNull(updated.hireDate));
      if (updated.residenceExpiryDate)
        formData.append(
          "ResidenceExpiryDate",
          toIsoOrNull(updated.residenceExpiryDate)
        );

      if (updated.password) formData.append("Password", updated.password);

      if (files.UserImage) formData.append("UserImage", files.UserImage);
      if (files.Certifications)
        formData.append("Certifications", files.Certifications);
      if (files.Files1) formData.append("Files1", files.Files1);

      const response = await axiosInstance.put(
        "/Account/update-account",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountProfile"] });
      setFiles({ UserImage: null, Certifications: null, Files1: null });
      Swal.fire({
        title: "تم التحديث",
        text: "تم تحديث بيانات الحساب بنجاح",
        icon: "success",
        confirmButtonText: "تمام",
        customClass: {
          popup: "rounded-2xl shadow-xl",
          confirmButton:
            "bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg transition-all duration-300",
        },
      });
    },
    onError: (err) => {
      Swal.fire({
        title: "حدث خطأ",
        text: err.message || "تعذر تحديث بيانات الحساب، حاول مرة أخرى",
        icon: "error",
        confirmButtonText: "إغلاق",
        customClass: {
          popup: "rounded-2xl shadow-xl",
          confirmButton:
            "bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg transition-all duration-300",
        },
      });
    },
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, files: fileList } = e.target;

    if (type === "file") {
      const file = fileList?.[0];
      if (file) setFiles((prev) => ({ ...prev, [name]: file }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!profile) return;
      updateAccount(profile);
    },
    [profile, updateAccount]
  );

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <LoadingModal />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-10 rounded-2xl shadow-lg border border-red-100 max-w-md w-full text-center"
        >
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
            حدث خطأ
          </h3>
          <p className="text-red-500 text-sm">
            {error.message || "حدث خطأ أثناء تحميل البيانات"}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">
              إعدادات الحساب
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              الملف الشخصي
            </h1>
          </div>

          {profile && (
            <ProfileForm
              profile={profile}
              files={files}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              isUpdating={isUpdating}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default memo(EngProfile);