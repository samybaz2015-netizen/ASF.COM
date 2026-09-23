import React from "react";
import { FaSearch, FaPlus } from "react-icons/fa";

const SearchBar = ({ searchTerm, onSearchChange, onAddClick }) => {
  return (
    <div className="relative w-full flex justify-between max-w-md mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث عن موظف..."
          className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 focus:border-mainColor focus:ring-2 focus:ring-mainColor/20 transition-all duration-300 text-gray-800 placeholder-gray-400"
        />
        <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
};

export default SearchBar;
