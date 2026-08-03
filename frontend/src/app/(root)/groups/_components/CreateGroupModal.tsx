"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  CreateGroup,
  IGroupUser,
} from "../group-action";

type CreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
  availableUsers: IGroupUser[];
};

const CreateGroupModal = ({
  open,
  onClose,
  availableUsers,
}: CreateGroupModalProps) => {
  const router = useRouter();
  const queryClient =
    useQueryClient();

  const [name, setName] =
    useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [search, setSearch] =
    useState("");
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const filteredUsers =
    useMemo(() => {
      const normalized = search
        .trim()
        .toLowerCase();

      if (!normalized) {
        return availableUsers;
      }

      return availableUsers.filter(
        (user) =>
          [
            user.username,
            user.firstname,
            user.lastname,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalized),
      );
    }, [
      availableUsers,
      search,
    ]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSearch("");
    setSelectedIds([]);
  };

  const closeModal = () => {
    if (
      createMutation.isPending
    ) {
      return;
    }

    resetForm();
    onClose();
  };

  const createMutation =
    useMutation({
      mutationFn: () =>
        CreateGroup({
          name: name.trim(),
          description:
            description.trim() ||
            undefined,
          memberIds: selectedIds,
        }),
      onSuccess: (group) => {
        if (!group) return;

        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        });

        resetForm();
        onClose();

        router.push(
          `/groups/${group.id}`,
        );
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
        !createMutation.isPending
      ) {
        closeModal();
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
    createMutation.isPending,
  ]);

  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-[80]
        flex
        items-end
        justify-center
        bg-black/50
        p-0
        backdrop-blur-sm
        sm:items-center
        sm:p-4
      "
      onClick={closeModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        className="
          flex
          max-h-[94dvh]
          w-full
          flex-col
          overflow-hidden
          rounded-t-3xl
          bg-white
          shadow-2xl
          dark:bg-slate-950
          sm:max-h-[86dvh]
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
              <UsersRound size={20} />
            </span>

            <div className="min-w-0">
              <h2
                id="create-group-title"
                className="truncate text-lg font-black text-slate-900 dark:text-white"
              >
                Create group
              </h2>

              <p className="text-xs text-slate-500">
                {selectedIds.length} selected
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close create group"
            onClick={closeModal}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-700
              transition
              hover:bg-slate-200
              dark:bg-slate-900
              dark:text-white
            "
          >
            <X size={20} />
          </button>
        </header>

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            p-4
            sm:p-6
          "
        >
          <div className="space-y-4">
            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              maxLength={100}
              placeholder="Group name"
              className="
                h-12
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                text-slate-900
                outline-none
                transition
                focus:border-elitePurple
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
              "
            />

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={500}
              placeholder="Description (optional)"
              className="
                min-h-24
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                transition
                focus:border-elitePurple
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
              "
            />

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
                className="shrink-0 text-slate-400"
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

          <div className="mt-4 space-y-2">
            {filteredUsers.length >
            0 ? (
              filteredUsers.map(
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
              <div className="flex min-h-36 items-center justify-center text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No users found.
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
              !name.trim() ||
              selectedIds.length ===
                0 ||
              createMutation.isPending
            }
            onClick={() =>
              createMutation.mutate()
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
            {createMutation.isPending
              ? "Creating..."
              : `Create group with ${selectedIds.length} member${
                  selectedIds.length ===
                  1
                    ? ""
                    : "s"
                }`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CreateGroupModal;
