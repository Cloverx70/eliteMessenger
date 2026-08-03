"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { ProfileScreenData, UpdateProfileInput } from "../types";

import toast from "react-hot-toast";
import { useUpdateMyProfile } from "@/app/hooks/use-profile";

interface EditProfileDialogProps {
  open: boolean;
  profile: ProfileScreenData;
  onClose: () => void;
}

export default function EditProfileDialog({
  open,
  profile,
  onClose,
}: EditProfileDialogProps) {
  const updateMutation = useUpdateMyProfile();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!open) return;

    setFirstname(profile.user.firstname);
    setLastname(profile.user.lastname);
    setUsername(profile.user.username);
    setBio(profile.user.bio ?? "");
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !updateMutation.isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose, updateMutation.isPending]);

  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: UpdateProfileInput = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      username: username.trim(),
      bio: bio.trim() || null,
    };

    if (!input.firstname || !input.lastname || !input.username) {
      toast.error("First name, last name, and username are required");
      return;
    }

    try {
      await updateMutation.mutateAsync(input);
      toast.success("Profile updated successfully");
      onClose();
    } catch {
      // The shared API helper already displays the backend error.
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit profile dialog"
        onClick={() => {
          if (!updateMutation.isPending) onClose();
        }}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[26px] border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Edit profile
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Update the information shown across Elite Messenger.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              label="First name"
              value={firstname}
              onChange={setFirstname}
              maxLength={50}
              autoComplete="given-name"
            />

            <ProfileField
              label="Last name"
              value={lastname}
              onChange={setLastname}
              maxLength={50}
              autoComplete="family-name"
            />
          </div>

          <ProfileField
            label="Username"
            value={username}
            onChange={setUsername}
            maxLength={30}
            autoComplete="username"
            helper="Letters, numbers, underscores, and periods only."
          />

          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-200">
              Bio
              <span className="font-semibold text-slate-400">
                {bio.length}/300
              </span>
            </span>

            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={300}
              rows={5}
              placeholder="Tell people something about yourself..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950"
            />
          </label>

          <div className="rounded-2xl bg-violet-50 p-4 text-xs leading-5 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
            Your profile picture keeps using the current account image. This
            dialog updates the fields already present in your User entity
            without requiring a database migration.
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-black text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Save changes
          </button>
        </footer>
      </form>
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  autoComplete?: string;
  helper?: string;
}

function ProfileField({
  label,
  value,
  onChange,
  maxLength,
  autoComplete,
  helper,
}: ProfileFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-200">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950"
      />

      {helper ? (
        <span className="mt-1.5 block text-[11px] text-slate-400">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
