import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/apiClient';
import {
  FaRobot, FaUser, FaPaperPlane, FaSpinner, FaTimes,
  FaCopy, FaCheck, FaCalendar, FaMapMarkerAlt, FaUsers,
  FaTools, FaFileAlt, FaCamera, FaShieldAlt, FaChartBar,
  FaExclamationTriangle, FaCheckCircle, FaArchive
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const projectTypes = [
  { id: 'construction', label: 'الإنشاءات', icon: '🏗️' },
  { id: 'emergency', label: 'الطوارئ', icon: '🚨' },
  { id: 'maintenance', label: 'الصيانة', icon: '🔧' },
  { id: 'rehabilitation_work', label: 'أعمال التأهيل', icon: '🏠' }
];

/* ─────────────────────────────────────────────────────────────
   Helper components
───────────────────────────────────────────────────────────── */

const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red:    'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    gray:   'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
    <span className="text-gray-500 flex items-center gap-2">
      {Icon && <Icon className="text-gray-400 text-xs" />}
      {label}
    </span>
    <span className="font-medium text-gray-800 text-left">{value ?? 'غير متوفر'}</span>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, iconColor = 'text-mainColor' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
      {Icon && <Icon className={`text-sm ${iconColor}`} />}
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="px-4 py-1">{children}</div>
  </div>
);

const ProgressBar = ({ label, value, max, percent, color = 'bg-blue-500' }) => (
  <div className="py-2.5 border-b border-gray-100 last:border-0">
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{parseFloat(percent).toFixed(2)}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(parseFloat(percent), 100)}%` }}
      />
    </div>
    {max && (
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>المنجز: {value?.toLocaleString()} م</span>
        <span>المشروع: {max?.toLocaleString()} م</span>
      </div>
    )}
  </div>
);

const MetricCard = ({ label, value, sub, highlight }) => (
  <div className={`rounded-xl p-3 ${highlight ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
    <div className={`text-xs mb-1 ${highlight ? 'text-red-500' : 'text-gray-500'}`}>{label}</div>
    <div className={`text-xl font-bold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

const FileChip = ({ name, count }) => (
  <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm">
    <div className="flex items-center gap-2 text-gray-600">
      <FaFileAlt className="text-gray-400 text-xs" />
      {name}
    </div>
    <span className="bg-mainColor text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Project data card — full layout
───────────────────────────────────────────────────────────── */

const ProjectDataCard = ({ data, onCopy }) => {
  if (!data) return <p className="text-sm text-gray-500 p-4">لم يتم العثور على بيانات المشروع</p>;

  const fmt = (dateStr) => {
    if (!dateStr || dateStr.startsWith('0001')) return 'غير متوفر';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  const plainText = `
📋 معلومات الطلب الأساسية:
• رقم الطلب: ${data.orderCode || 'غير متوفر'}
• نوع الطلب: ${data.workOrderType || 'غير متوفر'}
• نوع المشروع: ${data.type || 'غير متوفر'}
• رقم أمر العمل: ${data.faultNumber || 'غير متوفر'}
• رقم المحطة: ${data.stationNumber || 'غير متوفر'}

📝 تفاصيل العمل:
• وصف العمل: ${data.workDescription || 'غير متوفر'}
• مرحلة التنفيذ: ${data.implementationPhase || 'غير متوفر'}
• مدة التنفيذ: ${data.durationOfImplementation || 'غير متوفر'} يوم

📍 الموقع والمنطقة:
• المنطقة: ${data.district || 'غير متوفر'}
• المكتب: ${data.office || 'غير متوفر'}
• الفرع: ${data.branchName || 'غير متوفر'}

👥 المسؤولون:
• المقاول: ${data.contractor || 'غير متوفر'}
• المستشار: ${data.consultant || 'غير متوفر'}
• المستخدم: ${data.userName || 'غير متوفر'}

📅 التواريخ:
• تاريخ الطلب: ${fmt(data.orderDate)}
• تاريخ الاستلام: ${fmt(data.receiveDateTime)}
• تاريخ البدء: ${fmt(data.createAt)}
• تاريخ الانتهاء: ${fmt(data.completionDate)}

⚡ معلومات التنفيذ:
• الحالة: ${data.situation || 'غير متوفر'}
• عدد أيام التأخير: ${data.numberOfDaysDelayed || '0'} يوم
• عدد الأيام المتبقية: ${data.numberOfDaysRemaining || '0'} يوم
• حالة الموافقة: ${data.isApprove ? 'تمت الموافقة' : 'لم تتم الموافقة'}

🏗️ معلومات الحفر:
• طول حفر المشروع: ${data.projectExcavationLength || '0'} متر
• طول الحفر المنجز: ${data.excavationLength || '0'} متر
• نسبة إنجاز الحفر: ${data.completionStatusReport || 'غير متوفر'}

🔌 معلومات الكابلات:
• نسبة إنجاز الكابلات: ${data.cableCompletion || 'غير متوفر'}
• طول كابلات المشروع: ${data.projectCableLength || '0'} متر
• طول الكابلات المنجز: ${data.cableLength || '0'} متر
`;

  return (
    <div className="space-y-3 relative group">
      {/* Copy button */}
      <button
        onClick={() => onCopy(plainText)}
        className="absolute -top-1 -left-1 z-10 p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        title="نسخ البيانات"
      >
        <FaCopy className="text-gray-500 text-xs" />
      </button>

      {/* Header */}
      <div className="bg-gradient-to-l from-mainColor/10 to-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="text-xl font-bold text-gray-900">{data.orderCode}</div>
            <div className="text-sm text-gray-600 mt-0.5">{data.workDescription} — {data.workOrderType}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge color="blue">{data.type}</Badge>
              <Badge color="purple">{data.orderType}</Badge>
              {data.isApprove && <Badge color="green"><FaCheckCircle className="text-xs" /> موافق عليه</Badge>}
              {data.isArchived && <Badge color="gray"><FaArchive className="text-xs" /> مؤرشف</Badge>}
              {data.safetyViolationsExist && <Badge color="red"><FaExclamationTriangle className="text-xs" /> مخالفات سلامة</Badge>}
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500">القيمة التقديرية</div>
            <div className="text-lg font-bold text-gray-800">
              {data.estimatedValue ? Number(data.estimatedValue).toLocaleString() : 'غير متوفر'} ﷼
            </div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricCard label="مدة التنفيذ" value={`${data.durationOfImplementation} يوم`} />
        <MetricCard label="أيام التأخير" value={data.numberOfDaysDelayed} sub="يوم" highlight={parseInt(data.numberOfDaysDelayed) > 0} />
        <MetricCard label="أيام متبقية" value={data.numberOfDaysRemaining} sub="يوم" />
        <MetricCard label="عدد المعدات" value={data.numberOfEquipment} />
      </div>

      {/* Progress bars */}
      <SectionCard title="نسب الإنجاز" icon={FaChartBar}>
        <ProgressBar
          label="الحفر"
          percent={data.completionStatusReport}
          value={data.excavationLength}
          max={data.projectExcavationLength}
          color="bg-blue-500"
        />
        <ProgressBar
          label="الكابلات"
          percent={data.cableCompletion}
          value={data.cableLength}
          max={data.projectCableLength}
          color="bg-green-500"
        />
      </SectionCard>

      {/* Excavation + Cable side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SectionCard title="معلومات الحفر" icon={FaTools}>
          <InfoRow label="طول المشروع" value={`${data.projectExcavationLength?.toLocaleString()} م`} />
          <InfoRow label="المنجز" value={`${data.excavationLength?.toLocaleString()} م`} />
          <InfoRow label="الطول اليومي" value={`${data.dailyExcavationLength?.toLocaleString()} م`} />
        </SectionCard>
        <SectionCard title="معلومات الكابلات" icon={FaTools} iconColor="text-green-500">
          <InfoRow label="طول المشروع" value={`${data.projectCableLength?.toLocaleString()} م`} />
          <InfoRow label="المنجز" value={`${data.cableLength?.toLocaleString()} م`} />
          <InfoRow label="الطول اليومي" value={`${data.dailyCableLength?.toLocaleString()} م`} />
        </SectionCard>
      </div>

      {/* Project info */}
      <SectionCard title="معلومات المشروع" icon={FaFileAlt}>
        <InfoRow label="رقم أمر العمل" value={data.faultNumber} />
        <InfoRow label="رقم المحطة" value={data.stationNumber} />
        <InfoRow label="مرحلة التنفيذ" value={data.implementationPhase} />
        <InfoRow label="الحالة" value={data.situation} />
        <InfoRow label="نوع الفحص" value={data.typeOfStomachTest} />
        {data.note && <InfoRow label="ملاحظات" value={data.note} />}
      </SectionCard>

      {/* Location */}
      <SectionCard title="الموقع والمنطقة" icon={FaMapMarkerAlt} iconColor="text-red-400">
        <InfoRow label="الحي" value={data.district} />
        <InfoRow label="المكتب" value={data.office} />
        <InfoRow label="الفرع" value={data.branchName} />
        {data.projectPlace && <InfoRow label="موقع المشروع" value={data.projectPlace} />}
        {data.coordinates && <InfoRow label="الإحداثيات" value={data.coordinates} />}
      </SectionCard>

      {/* People */}
      <SectionCard title="المسؤولون" icon={FaUsers} iconColor="text-purple-400">
        <InfoRow label="المقاول" value={data.contractor} />
        <InfoRow label="المستشار" value={data.consultant} />
        <InfoRow label="المستخدم" value={data.userName} />
      </SectionCard>

      {/* Dates */}
      <SectionCard title="التواريخ" icon={FaCalendar} iconColor="text-amber-500">
        <InfoRow label="تاريخ الطلب" value={fmt(data.orderDate)} />
        <InfoRow label="تاريخ الاستلام" value={fmt(data.receiveDateTime)} />
        <InfoRow label="تاريخ البدء" value={fmt(data.createAt)} />
        <InfoRow label="تاريخ الانتهاء" value={fmt(data.completionDate)} />
      </SectionCard>

      {/* Safety */}
      <SectionCard
        title={`السلامة ${data.safetyViolationsExist ? '⚠️ توجد مخالفات' : '✅ لا توجد مخالفات'}`}
        icon={FaShieldAlt}
        iconColor={data.safetyViolationsExist ? 'text-red-400' : 'text-green-400'}
      >
        {data.descriptionViolation && data.descriptionViolation !== 'null' && (
          <InfoRow label="وصف المخالفة" value={data.descriptionViolation} />
        )}
        {!data.safetyViolationsExist && (
          <p className="text-sm text-green-600 py-2 flex items-center gap-2">
            <FaCheckCircle /> لا توجد مخالفات سلامة مسجلة
          </p>
        )}
      </SectionCard>

      {/* Attachments */}
      <SectionCard title="المرفقات والملفات" icon={FaCamera} iconColor="text-indigo-400">
        <div className="py-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.testModels?.length > 0 && <FileChip name="نماذج الاختبار" count={data.testModels.length} />}
          {data.modelPhotos?.length > 0 && <FileChip name="صور النماذج" count={data.modelPhotos.length} />}
          {data.sitePhotos?.length > 0 && <FileChip name="صور الموقع" count={data.sitePhotos.length} />}
          {data.safetyWastePhotos?.length > 0 && <FileChip name="صور السلامة" count={data.safetyWastePhotos.length} />}
          {data.testModels?.length === 0 && data.modelPhotos?.length === 0 && data.sitePhotos?.length === 0 && (
            <p className="text-sm text-gray-400 col-span-2 py-2">لا توجد مرفقات</p>
          )}
        </div>
      </SectionCard>

      {/* Rejection info */}
      {data.rejectionReason && data.rejectionReason !== 'null' && (
        <SectionCard title="سبب الرفض" icon={FaExclamationTriangle} iconColor="text-red-400">
          <p className="text-sm text-red-600 py-2">{data.rejectionReason}</p>
        </SectionCard>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

const BootInfoContent = () => {
  const [messages, setMessages] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([
      { type: 'bot', content: 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك اليوم؟', timestamp: new Date() },
      { type: 'bot', content: 'الرجاء اختيار نوع المشروع الذي تريد الاستفسار عنه:', timestamp: new Date() }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (content, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', content, timestamp: new Date() }]);
      setIsTyping(false);
    }, delay);
  };

  const handleProjectTypeSelect = (type) => {
    setSelectedType(type);
    setMessages(prev => [...prev, { type: 'user', content: `نوع المشروع: ${type.label}`, timestamp: new Date() }]);
    addBotMessage('الرجاء إدخال رقم المشروع:');
    setTimeout(() => inputRef.current?.focus(), 1400);
  };

  const handleCopyData = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        title: 'تم النسخ بنجاح!',
        text: 'تم نسخ بيانات المشروع إلى الحافظة',
        icon: 'success',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        showConfirmButton: false,
        toast: true,
      });
    }).catch(() => {
      Swal.fire({
        title: 'خطأ!',
        text: 'حدث خطأ أثناء نسخ البيانات',
        icon: 'error',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        showConfirmButton: false,
        toast: true,
      });
    });
  };

  const handleProjectIdSubmit = async (e) => {
    e.preventDefault();
    if (!projectId.trim()) return;

    setLoading(true);
    setMessages(prev => [...prev, { type: 'user', content: `رقم المشروع: ${projectId}`, timestamp: new Date() }]);

    try {
      const response = await axiosInstance.get(`/Search/bot?orderId=${projectId}&type=${selectedType.id}`);
      const projectData = response.data.data;

      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: <ProjectDataCard data={projectData} onCopy={handleCopyData} />,
            timestamp: new Date()
          }
        ]);
        setIsTyping(false);
      }, 1500);
    } catch {
      addBotMessage('عذراً، لم يتم العثور على المشروع. يرجى التحقق من الرقم والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      setProjectId('');
    }
  };

  const resetChat = () => {
    setSelectedType(null);
    setProjectId('');
    setMessages([
      { type: 'bot', content: 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك اليوم؟', timestamp: new Date() },
      { type: 'bot', content: 'الرجاء اختيار نوع المشروع الذي تريد الاستفسار عنه:', timestamp: new Date() }
    ]);
  };

  return (
    <div className="max-w-[94vw] mt-32 mx-auto p-2 sm:p-4 h-[calc(100vh-200px)] flex flex-col bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mainColor flex items-center justify-center">
            <FaRobot className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">المساعد الذكي</h2>
            <p className="text-sm text-gray-500">متصل</p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="إعادة المحادثة"
        >
          <FaTimes className="text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2 sm:p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                message.type === 'user'
                  ? 'bg-mainColor text-white rounded-tr-none'
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.type === 'bot' ? (
                  <div className="w-8 h-8 rounded-full bg-mainColor flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white text-sm" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-gray-600 text-sm" />
                  </div>
                )}
                <span className="font-semibold text-sm">
                  {message.type === 'bot' ? 'المساعد الذكي' : 'أنت'}
                </span>
              </div>
              <div className="text-sm leading-relaxed">
                {typeof message.content === 'string'
                  ? <span className="whitespace-pre-line">{message.content}</span>
                  : message.content
                }
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-mainColor flex items-center justify-center">
                  <FaRobot className="text-white text-sm" />
                </div>
                <span className="font-semibold text-sm">المساعد الذكي</span>
              </div>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Project type selector */}
        {!selectedType && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 animate-fade-in">
            {projectTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleProjectTypeSelect(type)}
                className="p-4 sm:p-6 border border-gray-200 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 text-right bg-gray-50 group"
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {type.icon}
                </div>
                <div className="font-semibold text-gray-800">{type.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* ID input */}
        {selectedType && !loading && (
          <form onSubmit={handleProjectIdSubmit} className="mt-4 animate-fade-in">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="أدخل رقم المشروع"
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mainColor focus:border-transparent shadow-sm"
                dir="rtl"
              />
              <button
                type="submit"
                className="bg-mainColor text-white p-3 rounded-xl hover:bg-secondaryColor transition-all shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center items-center py-4">
            <FaSpinner className="text-mainColor text-2xl animate-spin" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default BootInfoContent;