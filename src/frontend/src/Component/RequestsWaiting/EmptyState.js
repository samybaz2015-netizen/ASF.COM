import React from 'react';

function EmptyState() {
  return (
    <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-md">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-2 text-lg font-medium text-gray-900">لا توجد طلبات في انتظار الموافقة</h3>
      <p className="mt-1 text-sm text-gray-500">جميع الطلبات تمت الموافقة عليها.</p>
    </div>
  );
}

export default EmptyState; 