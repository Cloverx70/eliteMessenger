"use client";

import React, {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RiArrowDownSLine,
  RiCheckLine,
  RiOpenSourceFill,
} from "react-icons/ri";

type MediaSourceComboboxProps = {
  items: string[];
  value: string;
  onValueChange: (value: string) => void;
};

export const MediaSourceCombobox = ({
  items,
  value,
  onValueChange,
}: MediaSourceComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      item.toLowerCase().includes(normalizedSearch),
    );
  }, [items, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const selectedIndex = filteredItems.findIndex((item) => item === value);

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, filteredItems, value]);

  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex]);

  const openCombobox = () => {
    setIsOpen(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const selectItem = (item: string) => {
    onValueChange(item);
    setSearch("");
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        openCombobox();
        return;
      }

      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, filteredItems.length - 1),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openCombobox();
        return;
      }

      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (!isOpen) {
        openCombobox();
        return;
      }

      const highlightedItem = filteredItems[highlightedIndex];

      if (highlightedItem) {
        selectItem(highlightedItem);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setSearch("");
      inputRef.current?.blur();
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(0);
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(Math.max(filteredItems.length - 1, 0));
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex h-11 w-full items-center rounded-xl border bg-transperant transition-colors dark:bg-slate-950 ${
          isOpen
            ? "border-violet-500 ring-2 ring-violet-500/15"
            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
        }`}
      >
        <RiOpenSourceFill className="ml-3 shrink-0 text-lg text-violet-500" />

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          placeholder="Select media source"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="media-source-listbox"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          onFocus={openCombobox}
          onClick={openCombobox}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          aria-label="Toggle media sources"
          className="flex h-full w-10 items-center justify-center"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setSearch("");
            } else {
              openCombobox();
            }
          }}
        >
          <RiArrowDownSLine
            className={`text-xl text-slate-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          id="media-source-listbox"
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const isSelected = item === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    ref={(element) => {
                      itemRefs.current[index] = element;
                    }}
                    key={item}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      isHighlighted
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectItem(item)}
                  >
                    <span className="min-w-0 flex-1 truncate">{item}</span>

                    {isSelected && (
                      <RiCheckLine className="shrink-0 text-lg text-violet-500" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-8 text-center text-sm text-slate-500">
                No sources found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
