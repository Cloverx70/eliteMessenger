"use client";

import { CreateGroup, IGroupUser } from "../group-action";
import React, { useMemo, useState } from "react";
import { UsersRound, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "next/navigation";

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
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return availableUsers;

    return availableUsers.filter((user) =>
      [user.username, user.firstname, user.lastname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [availableUsers, search]);

  const createMutation = useMutation({
    mutationFn: () =>
      CreateGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedIds,
      }),
    onSuccess: (group) => {
      if (!group) return;
      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
      onClose();
      setName("");
      setDescription("");
      setSelectedIds([]);
      router.push(`/groups/${group.id}`);
    },
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-elitePurple/10 p-2 text-elitePurple">
              <UsersRound size={20} />
            </div>
            <h2 className="text-lg font-bold">Create group</h2>
          </div>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="Group name"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-elitePurple"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            placeholder="Description (optional)"
            className="min-h-20 resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-elitePurple"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search friends"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-elitePurple"
          />

          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {filteredUsers.map((user) => {
              const selected = selectedIds.includes(user.id);

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() =>
                    setSelectedIds((previous) =>
                      selected
                        ? previous.filter((id) => id !== user.id)
                        : [...previous, user.id],
                    )
                  }
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-elitePurple bg-elitePurple/5"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.userPfpUrl || "/default-avatar.png"}
                      alt={user.username}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {user.firstname} {user.lastname}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`h-4 w-4 rounded-full border ${
                      selected
                        ? "border-elitePurple bg-elitePurple"
                        : "border-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t p-5">
          <button
            type="button"
            disabled={
              !name.trim() ||
              selectedIds.length === 0 ||
              createMutation.isPending
            }
            onClick={() => createMutation.mutate()}
            className="w-full rounded-xl bg-elitePurple px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending
              ? "Creating..."
              : `Create group with ${selectedIds.length} member${
                  selectedIds.length === 1 ? "" : "s"
                }`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
