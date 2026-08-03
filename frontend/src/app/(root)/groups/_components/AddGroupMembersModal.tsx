"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  AddGroupMembers,
  IGroupUser,
} from "../group-action";

type AddGroupMembersModalProps = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  availableUsers: IGroupUser[];
  existingUserIds: string[];
};

const AddGroupMembersModal = ({
  open,
  onClose,
  groupId,
  availableUsers,
  existingUserIds,
}: AddGroupMembersModalProps) => {
  const queryClient =
    useQueryClient();

  const [search, setSearch] =
    useState("");
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const candidates = useMemo(() => {
    const existing = new Set(
      existingUserIds,
    );

    const normalized = search
      .trim()
      .toLowerCase();

    return availableUsers.filter(
      (user) => {
        if (existing.has(user.id)) {
          return false;
        }

        if (!normalized) {
          return true;
        }

        return [
          user.username,
          user.firstname,
          user.lastname,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      },
    );
  }, [
    availableUsers,
    existingUserIds,
    search,
  ]);

  const resetAndClose = () => {
    if (
      addMutation.isPending
    ) {
      return;
    }

    setSearch("");
    setSelectedIds([]);
    onClose();
  };

  const addMutation = useMutation({
    mutationFn: () =>
      AddGroupMembers(
        groupId,
        selectedIds,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "GROUP_INFO",
            groupId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "GROUP_AND_MESSAGES",
            groupId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        }),
      ]);

      setSearch("");
      setSelectedIds([]);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !addMutation.isPending
      ) {
        resetAndClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    open,
    addMutation.isPending,
  ]);

  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-[90]
        flex
        items-end
        justify-center
        bg-black/50
        p-0
        backdrop-blur-sm
        sm:items-center
        sm:p-4
      "
      onClick={resetAndClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-members-title"
        className="
          flex
          max-h-[92dvh]
          w-full
          flex-col
          overflow-hidden
          rounded-t-3xl
          bg-white
          shadow-2xl
          dark:bg-slate-950
          sm:max-h-[82dvh]
          sm:max-w-lg
          sm:rounded-3xl
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-200
            px-4
            py-4
            dark:border-slate-800
            sm:px-6
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
              <UserPlus size={20} />
            </span>

            <div className="min-w-0">
              <h2
                id="add-members-title"
                className="truncate text-lg font-black text-slate-900 dark:text-white"
              >
                Add members
              </h2>

              <p className="text-xs text-slate-500">
                {selectedIds.length} selected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close add members"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-700
              dark:bg-slate-900
              dark:text-white
            "
          >
            <X size={20} />
          </button>
        </header>

        <div className="shrink-0 p-4 pb-2 sm:px-6 sm:pt-5">
          <label
            className="
              flex
              h-12
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              px-4
              dark:border-slate-700
            "
          >
            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search users"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-sm
                text-slate-900
                outline-none
                dark:text-white
              "
            />
          </label>
        </div>

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            p-4
            pt-2
            sm:px-6
          "
        >
          <div className="space-y-2">
            {candidates.length > 0 ? (
              candidates.map(
                (user) => {
                  const selected =
                    selectedIds.includes(
                      user.id,
                    );

                  const initials =
                    `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase();

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        setSelectedIds(
                          (
                            previous,
                          ) =>
                            selected
                              ? previous.filter(
                                  (
                                    id,
                                  ) =>
                                    id !==
                                    user.id,
                                )
                              : [
                                  ...previous,
                                  user.id,
                                ],
                        )
                      }
                      className={`
                        flex
                        min-h-16
                        w-full
                        min-w-0
                        items-center
                        justify-between
                        gap-3
                        rounded-2xl
                        border
                        p-3
                        text-left
                        transition
                        ${
                          selected
                            ? "border-elitePurple bg-elitePurple/5"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                        }
                      `}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elitePurple/10 text-xs font-black text-elitePurple">
                          {user.userPfpUrl ? (
                            <img
                              src={
                                user.userPfpUrl
                              }
                              alt={
                                user.username
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials ||
                            "U"
                          )}
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-slate-900 dark:text-white">
                            {
                              user.firstname
                            }{" "}
                            {
                              user.lastname
                            }
                          </span>

                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            @
                            {
                              user.username
                            }
                          </span>
                        </span>
                      </div>

                      <span
                        className={`
                          flex
                          h-5
                          w-5
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
                          ${
                            selected
                              ? "border-elitePurple bg-elitePurple text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }
                        `}
                      >
                        {selected ? (
                          <Check
                            size={13}
                          />
                        ) : null}
                      </span>
                    </button>
                  );
                },
              )
            ) : (
              <div className="flex min-h-44 items-center justify-center px-6 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No available users found.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer
          className="
            shrink-0
            border-t
            border-slate-200
            bg-white
            p-4
            pb-[max(1rem,env(safe-area-inset-bottom))]
            dark:border-slate-800
            dark:bg-slate-950
            sm:p-5
          "
        >
          <button
            type="button"
            disabled={
              selectedIds.length === 0 ||
              addMutation.isPending
            }
            onClick={() =>
              addMutation.mutate()
            }
            className="
              min-h-12
              w-full
              rounded-xl
              bg-elitePurple
              px-4
              py-3
              text-sm
              font-black
              text-white
              transition
              hover:brightness-110
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {addMutation.isPending
              ? "Adding..."
              : `Add ${selectedIds.length} member${
                  selectedIds.length === 1
                    ? ""
                    : "s"
                }`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddGroupMembersModal;
