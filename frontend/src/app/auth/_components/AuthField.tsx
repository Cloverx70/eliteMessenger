"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    {
      id,
      label,
      icon: Icon,
      error,
      type = "text",
      className,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && visible ? "text" : type;
    const errorId = `${id}-error`;

    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>

        <div
          className={cn(
            "flex min-h-12 w-full min-w-0 items-center gap-3 rounded-2xl border bg-white px-3.5 transition focus-within:border-elitePurple focus-within:ring-4 focus-within:ring-elitePurple/10 dark:bg-slate-950",
            error
              ? "border-red-400"
              : "border-slate-200 dark:border-slate-800",
          )}
        >
          <Icon
            size={18}
            className={error ? "shrink-0 text-red-400" : "shrink-0 text-slate-400"}
          />

          <input
            {...props}
            ref={ref}
            id={id}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "h-12 min-w-0 flex-1 border-none bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white",
              className,
            )}
          />

          {isPassword ? (
            <button
              type="button"
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible((current) => !current)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-elitePurple dark:hover:bg-slate-900"
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          ) : null}
        </div>

        {error ? (
          <p
            id={errorId}
            className="mt-1.5 text-[11px] font-semibold text-red-500"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

AuthField.displayName = "AuthField";
