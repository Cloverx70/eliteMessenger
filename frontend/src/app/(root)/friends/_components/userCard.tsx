"use client";

import Image from "next/image";
import Spinner from "@/app/components/spinner";
import { useRouter } from "next/navigation";

export interface IUserCardUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl?: string | null;
}

interface UserCardProps {
  user: IUserCardUser;

  requestSent?: boolean;
  isPending?: boolean;

  onAdd: (userId: string) => void;
  onCancel: (userId: string) => void;
}

const UserCard = ({
  user,
  requestSent = false,
  isPending = false,
  onAdd,
  onCancel,
}: UserCardProps) => {
  const router = useRouter();
  const fullName = `${user.firstname} ${user.lastname}`.trim();

  const initials = `${user.firstname?.[0] ?? ""}${
    user.lastname?.[0] ?? ""
  }`.toUpperCase();

  return (
    <div
      onClick={() => router.push(`/profile/${user.username}`)}
      className="flex h-24 w-full items-center justify-between border-t px-10 py-2 cursor-pointer hover:bg-elitePurpleHover/10 transition-all duration-100 ease-linear"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-[2.5px] ring-elitePurple dark:bg-neutral-700">
          {user.userPfpUrl ? (
            <Image
              src={user.userPfpUrl}
              alt={`${user.username}'s profile picture`}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
              {initials || "U"}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-medium">{user.username}</h2>

          <p className="truncate text-xs text-neutral-400">{fullName}</p>
        </div>
      </div>

      {!requestSent ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd(user.id);
          }}
          disabled={isPending}
          className="flex min-w-24 items-center justify-center rounded-sm font-bold bg-elitePurple px-10 py-2 text-xs text-white transition-colors active:bg-elitePurplePressed disabled:cursor-not-allowed disabled:bg-elitePurplePressed"
        >
          {isPending ? <Spinner /> : "Add"}
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel(user.id);
          }}
          disabled={isPending}
          className="flex min-w-24 items-center justify-center rounded-sm font-bold bg-neutral-500 px-10 py-2  text-xs text-white transition-colors active:bg-neutral-600 disabled:cursor-not-allowed disabled:bg-neutral-600"
        >
          {isPending ? <Spinner /> : "Cancel"}
        </button>
      )}
    </div>
  );
};

export default UserCard;
