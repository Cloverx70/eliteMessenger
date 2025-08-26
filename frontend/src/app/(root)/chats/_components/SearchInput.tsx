"use client";
import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";

const SearchInput = () => {
  const [value, setValue] = useState<string>("");

  // const debouncedValue = useDebounce(value, 300);

  return (
    <div className="relative w-full h-9 border rounded-xl p-1 flex items-center justify-center px-4">
      <div className="w-full flex justify-start items-center">
        <input
          placeholder="Search here.."
          type="text"
          className="flex-1 h-full text-sm bg-transparent border-none outline-none"
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <IoSearch />
      </div>
    </div>
  );
};

export default SearchInput;
