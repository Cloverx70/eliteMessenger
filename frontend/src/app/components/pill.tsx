import React from "react";

interface PillProps {
  text: string;
  isDefault?: boolean;
}

const Pill: React.FC<PillProps> = ({ text, isDefault }) => {
  return (
    <div
      className={`w-auto h-auto cursor-pointer text-sm px-4 py-1  rounded-full border ${
        isDefault ? "bg-elitePurplePressed border-none text-white" : ""
      }`}
    >
      {text}
    </div>
  );
};

export default Pill;
