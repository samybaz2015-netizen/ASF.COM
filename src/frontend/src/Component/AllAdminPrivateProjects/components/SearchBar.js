import React from 'react';

const SearchBar = ({ searchParams, onSearchChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onSearchChange(name, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
        <input
          type="text"
          name="projectName"
          value={searchParams.projectName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن اسم المشروع..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
        <input
          type="text"
          name="projectPlace"
          value={searchParams.projectPlace}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن الموقع..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
        <input
          type="text"
          name="customer"
          value={searchParams.customer}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن العميل..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المستشار</label>
        <input
          type="text"
          name="consultant"
          value={searchParams.consultant}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن المستشار..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
        <input
          type="text"
          name="branchName"
          value={searchParams.branchName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن الفرع..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الحي</label>
        <input
          type="text"
          name="district"
          value={searchParams.district}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن الحي..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المقاول</label>
        <input
          type="text"
          name="contractor"
          value={searchParams.contractor}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن المقاول..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">رقم المحطة</label>
        <input
          type="text"
          name="stationNumber"
          value={searchParams.stationNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن رقم المحطة..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">وصف العمل</label>
        <input
          type="text"
          name="workDescription"
          value={searchParams.workDescription}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن وصف العمل..."
        />
      </div>
    </div>
  );
};

export default SearchBar; 