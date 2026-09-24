import React from 'react';
import { FaFilter } from 'react-icons/fa';

const FilterBar = ({ filter, setFilter }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-8">
      <button
        onClick={() => setFilter('all')}
        className={`px-6 py-2 rounded-xl transition-all duration-300 ${
          filter === 'all'
            ? 'bg-mainColor text-white shadow-lg'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-mainColor hover:text-mainColor'
        }`}
      >
        الكل
      </button>
      <button
        onClick={() => setFilter('active')}
        className={`px-6 py-2 rounded-xl transition-all duration-300 ${
          filter === 'active'
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-green-500 hover:text-green-500'
        }`}
      >
        نشط
      </button>
      <button
        onClick={() => setFilter('inactive')}
        className={`px-6 py-2 rounded-xl transition-all duration-300 ${
          filter === 'inactive'
            ? 'bg-red-500 text-white shadow-lg'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-red-500 hover:text-red-500'
        }`}
      >
        غير نشط
      </button>
      <button
        onClick={() => setFilter('onLeave')}
        className={`px-6 py-2 rounded-xl transition-all duration-300 ${
          filter === 'onLeave'
            ? 'bg-yellow-500 text-white shadow-lg'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-500 hover:text-yellow-500'
        }`}
      >
        في إجازة
      </button>
    </div>
  );
};

export default FilterBar; 