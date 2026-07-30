"use client";

import { MediaFilterPills } from "@/app/constants";
import Pill from "@/app/components/pill";

const MediaFilter = () => {
  return (
    <div className=" flex gap-3 items-center justify-start">
      {MediaFilterPills.map((pill) => (
        <div key={pill.label}>
          <Pill text={pill.label} isDefault={pill.default} />
        </div>
      ))}
    </div>
  );
};

export default MediaFilter;
