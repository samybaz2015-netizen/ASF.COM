import React, { useMemo, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaBuilding,
  FaIdBadge,
  FaCamera,
  FaBriefcase,
  FaGraduationCap,
  FaCalendarAlt,
  FaFileAlt,
  FaFilePdf,
} from "react-icons/fa";
import { useBranches } from "../ProjectParties/hooks/useBranches";
import ImagePreview from "../../Component/ImagePreview/ImagePreview";
import { domain } from "../../function/FunctionApi";

const USER_TYPES = [
  { value: "eng", label: "مهندس" },
  { value: "contractor", label: "مقاول" },
];

// Google Drive روابط المشاركة العادية (`/file/d/ID/view`) مش قابلة للعرض
// جوه <img> مباشرة، لازم تتحول لصيغة thumbnail مباشرة
const resolveImageUrl = (raw) => {
  if (!raw) return null;

  const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w500`;
  }

  if (raw.startsWith("http")) return raw;
  return `${domain}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const toDateInputValue = (v) => {
  if (!v) return "";
  return typeof v === "string" && v.includes("T") ? v.split("T")[0] : v;
};

const FieldShell = ({ icon: Icon, label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
      <Icon className="text-slate-400" size={13} />
      {label}
    </label>
    {children}
  </div>
);

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition-colors " +
  "focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

const fileInputClass =
  "w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 " +
  "file:bg-slate-100 file:text-slate-700 file:text-xs file:font-semibold " +
  "hover:file:bg-slate-200 file:cursor-pointer cursor-pointer " +
  "border border-slate-200 rounded-lg py-1.5 pr-1.5";

const ProfileForm = ({ profile, files, handleChange, handleSubmit, isUpdating }) => {
  const { branches } = useBranches();
  const [showPassword, setShowPassword] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const imagePreview = useMemo(() => {
    if (files?.UserImage) return URL.createObjectURL(files.UserImage);
    return resolveImageUrl(profile.userImage);
  }, [files?.UserImage, profile.userImage]);

  const initials = (profile.displayName || profile.userName || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

    const office = branches
    .flatMap((branch) => branch.offices || [])
    .find((office) => office.id === profile.officeId);
   const branch = branches.find((b) => b.id === profile.branchId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* ── الصورة الشخصية ── */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5 flex-wrap sm:flex-nowrap">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-white text-2xl font-semibold ring-4 ring-slate-50">
            {imagePreview && !imageFailed ? (
              <ImagePreview
                src={imagePreview}
                
                alt="صورة المستخدم"
                className="w-full h-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              initials
            )}
          </div>
          <label
            htmlFor="userImageInput"
            className="absolute -bottom-1 -left-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer border-2 border-white hover:bg-slate-700 transition-colors"
            title="تغيير الصورة"
          >
            <FaCamera className="text-white" size={11} />
          </label>
          <input
            id="userImageInput"
            type="file"
            name="UserImage"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <p className="font-semibold text-slate-900">
            {profile.displayName || profile.userName}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
          {imageFailed && (
            <p className="text-[11px] text-red-500 mt-2">
              تعذّر عرض الصورة الحالية — اختر صورة جديدة من أيقونة الكاميرا
            </p>
          )}
          {!imageFailed && (
            <p className="text-[11px] text-slate-400 mt-2">
              اضغط على أيقونة الكاميرا لاختيار صورة جديدة
            </p>
          )}
        </div>
      </div>

      {/* ── بيانات الحساب ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mb-4">
          بيانات الحساب
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldShell icon={FaUser} label="الاسم الظاهر">
            <input
              type="text"
              name="displayName"
              value={profile.displayName || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="الاسم الظاهر"
            />
          </FieldShell>

          <FieldShell icon={FaUser} label="اسم المستخدم">
            <input
              type="text"
              name="userName"
              value={profile.userName || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="اسم المستخدم"
            />
          </FieldShell>

          <FieldShell icon={FaEnvelope} label="البريد الإلكتروني">
            <input
              type="email"
              name="email"
              value={profile.email || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="example@mail.com"
            />
          </FieldShell>

          <FieldShell icon={FaPhone} label="رقم الهاتف">
            <input
              type="tel"
              name="phoneNumber"
              value={profile.phoneNumber || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="05xxxxxxxx"
            />
          </FieldShell>

          <FieldShell icon={FaIdBadge} label="نوع الحساب">
            <select
              name="userType"
              value={profile.userType || ""}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                اختر نوع الحساب
              </option>
              {USER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FieldShell>

          <FieldShell icon={FaBuilding} label="الفرع">
            <select
              name="branchId"
              value={profile.branchId ?? ""}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                اختر الفرع
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FieldShell>

          <FieldShell icon={FaLock} label="كلمة المرور الجديدة">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={profile.password || ""}
                onChange={handleChange}
                className={`${inputClass} pl-10`}
                placeholder="اتركها فارغة لعدم التغيير"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                {showPassword ? "إخفاء" : "إظهار"}
              </button>
            </div>
          </FieldShell>
        </div>
      </div>

      {/* ── البيانات الوظيفية ── */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mb-4">
          البيانات الوظيفية
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldShell icon={FaBriefcase} label="المسمى الوظيفي">
            <input
              type="text"
              name="jobTitle"
              value={profile.jobTitle || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="المسمى الوظيفي"
            />
          </FieldShell>

          <FieldShell icon={FaGraduationCap} label="التخصص">
            <input
              type="text"
              name="specialization"
              value={profile.specialization || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="التخصص"
            />
          </FieldShell>

          <FieldShell icon={FaBriefcase} label="سنوات الخبرة">
            <input
              type="number"
              min="0"
              name="experienceYears"
              value={profile.experienceYears || ""}
              onChange={handleChange}
              className={inputClass}
              placeholder="سنوات الخبرة"
            />
          </FieldShell>
          <FieldShell icon={FaCalendarAlt} label="إجمالي رصيد الإجازات">
              <input
                type="text"
                value="21 يوم"
                disabled
                className={`${inputClass} bg-slate-100 cursor-not-allowed`}
              />
            </FieldShell>

            <FieldShell icon={FaCalendarAlt} label="الرصيد المتبقي">
              <input
                type="text"
                value={`${profile.annualLeaveBalance ?? 0} يوم`}
                disabled
                className={`${inputClass} bg-slate-100 cursor-not-allowed text-green-600 font-semibold`}
              />
            </FieldShell>

          <FieldShell icon={FaCalendarAlt} label="تاريخ الميلاد">
            <input
              type="date"
              name="dateOfBirth"
              value={toDateInputValue(profile.dateOfBirth)}
              onChange={handleChange}
              className={inputClass}
            />
          </FieldShell>

          <FieldShell icon={FaCalendarAlt} label="تاريخ التوظيف">
            <input
              type="date"
              name="hireDate"
              value={toDateInputValue(profile.hireDate)}
              onChange={handleChange}
              className={inputClass}
            />
          </FieldShell>

          <FieldShell icon={FaCalendarAlt} label="تاريخ انتهاء الإقامة">
            <input
              type="date"
              name="residenceExpiryDate"
              value={toDateInputValue(profile.residenceExpiryDate)}
              onChange={handleChange}
              className={inputClass}
            />
          </FieldShell>
        </div>

        <div className="mt-4">
          <FieldShell icon={FaFileAlt} label="السيرة الذاتية">
            <textarea
              name="bio"
              rows={4}
              value={profile.bio || ""}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
              placeholder="نبذة مختصرة..."
            />
          </FieldShell>
        </div>
      </div>

      {/* ── بيانات اضافيه ── */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mb-4">
          بيانات إضافية
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
         <FieldShell icon={FaBuilding} label="الفرع">
            <input
              type="text"
              value={branch?.name || ""}
              disabled
              className={`${inputClass} bg-slate-100 cursor-not-allowed`}
            />
          </FieldShell>

          <FieldShell icon={FaBuilding} label="المكتب">
            <input
              type="text"
              value={office?.name || ""}
              disabled
              className={`${inputClass} bg-slate-100 cursor-not-allowed`}
            />
          </FieldShell>

        <FieldShell icon={FaBriefcase} label="يمكن إنشاء مشروع خارج المدينة">
          <input
            type="text"
            value={profile.canCreateProjectOutsideCity ? "نعم" : "لا"}
            disabled
            className={`${inputClass} bg-slate-100 cursor-not-allowed`}
          />
        </FieldShell>

        <FieldShell icon={FaEnvelope} label="تأكيد البريد الإلكتروني">
          <input
            type="text"
            value={profile.emailConfirmed ? "تم التأكيد" : "غير مؤكد"}
            disabled
            className={`${inputClass} bg-slate-100 cursor-not-allowed`}
          />
        </FieldShell>

        <FieldShell icon={FaPhone} label="تأكيد رقم الهاتف">
          <input
            type="text"
            value={profile.phoneNumberConfirmed ? "تم التأكيد" : "غير مؤكد"}
            disabled
            className={`${inputClass} bg-slate-100 cursor-not-allowed`}
          />
        </FieldShell>
        </div>
      </div>

      {/* ── المستندات ── */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mb-4">
          المستندات
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldShell icon={FaGraduationCap} label="الشهادات">
            {profile.certifications ? (
              <a
                href={
                  profile.certifications.startsWith("http")
                    ? profile.certifications
                    : `${domain}${profile.certifications}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-blue-600 hover:underline"
              >
                عرض الشهادة
              </a>
            ) : (
              <div className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                لا توجد شهادة
              </div>
            )}
          </FieldShell>

          <FieldShell icon={FaFilePdf} label="مستندات إضافية">
            {profile.files1 ? (
              <a
                href={
                  profile.files1.startsWith("http")
                    ? profile.files1
                    : `${domain}${profile.files1}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-blue-600 hover:underline"
              >
                عرض الملف
              </a>
            ) : (
              <div className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                لا توجد مستندات
              </div>
            )}
          </FieldShell>
        </div>
      </div>

      {/* ── زر الحفظ ── */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUpdating}
          className="px-8 py-3 rounded-lg font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;