"use client";

import Pill from "@/app/components/pill";
import { MediaFilterPills } from "@/app/constants";

const MediaFilter = () => {
  return (
    <div
      className="
        flex
        w-full
        items-center
        gap-2
        overflow-x-auto
        pb-1
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      {MediaFilterPills.map(
        (pill) => (
          <div
            key={pill.label}
            className="shrink-0"
          >
            <Pill
              text={pill.label}
              isDefault={pill.default}
            />
          </div>
        ),
      )}
    </div>
  );
};

export default MediaFilter;
