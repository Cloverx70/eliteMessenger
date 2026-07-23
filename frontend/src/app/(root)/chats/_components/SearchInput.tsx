"use client";

import { CiSearch } from "react-icons/ci";
import React from "react";
import { SlidersHorizontal } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const SearchInput = ({ value, onChange }: SearchInputProps) => {
  return (
    <div className="relative flex h-9 w-full items-center justify-center gap-2">
      <div className="flex h-full w-full items-center justify-start gap-1 rounded-2xl bg-customGray px-3">
        <CiSearch size={20} className="text-slate-500" />

        <input
          placeholder="Search chats..."
          type="text"
          className="h-full flex-1 border-none bg-transparent pl-1 text-sm outline-none placeholder:text-slate-500"
          onChange={(e) => onChange(e.target.value)}
          value={value}
        />
      </div>

      <div className="cursor-pointer rounded-2xl text-slate-500">
        <SlidersHorizontal size={15} />
      </div>
    </div>
  );
};

export default SearchInput;
