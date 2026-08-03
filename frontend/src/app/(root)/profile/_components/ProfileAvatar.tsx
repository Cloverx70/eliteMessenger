"use client";

import { ProfilePerson } from "../types";

interface ProfileAvatarProps {
  person: ProfilePerson;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-32 w-32 text-3xl sm:h-36 sm:w-36",
};

export default function ProfileAvatar({
  person,
  size = "md",
  showStatus = false,
  className = "",
}: ProfileAvatarProps) {
  const initials = `${person.firstname?.[0] ?? ""}${
    person.lastname?.[0] ?? ""
  }`.toUpperCase();

  return (
    <span
      className={`relative inline-flex shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-200 to-fuchsia-200 font-black text-violet-800 ring-1 ring-black/5 dark:from-violet-900 dark:to-fuchsia-950 dark:text-violet-100">
        {person.userPfpUrl ? (
          <img
            src={person.userPfpUrl}
            alt={`${person.firstname} ${person.lastname}`}
            className="h-full w-full object-cover"
          />
        ) : (
          initials || "E"
        )}
      </span>

      {showStatus && person.isActive ? (
        <span className="absolute bottom-[5%] right-[5%] h-[20%] w-[20%] rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
      ) : null}
    </span>
  );
}
