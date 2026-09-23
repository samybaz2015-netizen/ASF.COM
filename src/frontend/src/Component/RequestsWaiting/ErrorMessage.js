import React from 'react';

function ErrorMessage({ error, onRetry }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">خطأ!</strong>
      <span className="block sm:inline"> {error}</span>
      <button
        onClick={onRetry}
        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}

export default ErrorMessage; 