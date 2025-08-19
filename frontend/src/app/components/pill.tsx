import React from "react";

interface pillProps {
  text: string;
}

const Pill: React.FC<pillProps> = ({ text }) => {
  return (
    <div className="w-auto h-auto text-sm px-6 py-1 active:bg-customOlive active:border-none active:text-white rounded-full border">
      {text}
    </div>
  );
};
export default Pill;
