"use client";

import { FilterPillsLabels } from "@/app/constants";
import Pill from "@/app/components/pill";
import React from "react";

export type ChatFilter = "all" | "unread";

type FilterPillsProps = {
  filter: ChatFilter;
  onChange: (filter: ChatFilter) => void;
};

const FilterPills = ({ filter, onChange }: FilterPillsProps) => {
  return (
    <div className="flex w-full items-center justify-start gap-3">
      {FilterPillsLabels.map((pill) => {
        const pillValue = pill.label.toLowerCase() as ChatFilter;

        return (
          <button
            key={pill.label}
            type="button"
            onClick={() => onChange(pillValue)}
          >
            <Pill text={pill.label} isDefault={filter === pillValue} />
          </button>
        );
      })}
    </div>
  );
};

export default FilterPills;
