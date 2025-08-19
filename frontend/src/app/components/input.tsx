"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  labelClassName?: string;
  name: string;
}

const Input: React.FC<InputProps> = ({
  label,
  className = "",
  labelClassName = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        id={props.id || label}
        className={cn(
          className,
          "peer w-full h-7 bg-transparent border-b border-gray-400 focus:border-black transition-all duration-300 outline-none px-1.5 placeholder-transparent text-xs"
        )}
        placeholder=" "
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => setIsFocused(e.target.value !== "")}
        autoComplete="off"
      />
      <label
        htmlFor={props.id || label}
        className={cn(
          `absolute left-2 text-gray-400 transition-all 
          ${
            isFocused
              ? "-top-3 text-xs text-gray-800"
              : "top-2 text-sm text-gray-500"
          }
          peer-placeholder-shown:top-2 peer-placeholder-shown:text-xs
          peer-placeholder-shown:text-gray-500
          peer-focus:-top-3 peer-focus:text-xs peer-focus:text-gray-800`,
          labelClassName
        )}
      >
        {label}
      </label>
    </div>
  );
};

export default Input;
