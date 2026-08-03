"use client";

import { SlidersHorizontal } from "lucide-react";
import { CiSearch } from "react-icons/ci";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const SearchInput = ({
  value,
  onChange,
}: SearchInputProps) => {
  return (
    <div className="flex h-11 w-full min-w-0 items-center gap-2">
      <label
        className="
          flex
          h-full
          min-w-0
          flex-1
          items-center
          gap-2
          rounded-2xl
          bg-customGray
          px-3
          dark:bg-slate-900
        "
      >
        <CiSearch
          size={20}
          className="shrink-0 text-slate-500"
        />

        <input
          placeholder="Search chats..."
          type="search"
          className="
            h-full
            min-w-0
            flex-1
            border-none
            bg-transparent
            text-sm
            text-slate-900
            outline-none
            placeholder:text-slate-500
            dark:text-white
          "
          onChange={(event) =>
            onChange(event.target.value)
          }
          value={value}
        />
      </label>

      <button
        type="button"
        aria-label="Filter conversations"
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-2xl
          text-slate-500
          transition
          hover:bg-slate-100
          hover:text-elitePurple
          dark:hover:bg-slate-900
        "
      >
        <SlidersHorizontal size={18} />
      </button>
    </div>
  );
};

export default SearchInput;
