"use client";

import { Camera, Loader2, RotateCcw, Save, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ProfileScreenData, UpdateProfileInput } from "../types";

import toast from "react-hot-toast";
import { useUpdateMyProfile } from "@/app/hooks/use-profile";

interface EditProfileDialogProps {
  open: boolean;
  profile: ProfileScreenData;
  onClose: () => void;
}

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditProfileDialog({
  open,
  profile,
  onClose,
}: EditProfileDialogProps) {
  const updateMutation = useUpdateMyProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFirstname(profile.user.firstname);
    setLastname(profile.user.lastname);
    setUsername(profile.user.username);
    setBio(profile.user.bio ?? "");

    setProfilePicture(null);
    setPreviewUrl(profile.user.userPfpUrl ?? null);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !updateMutation.isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, updateMutation.isPending]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!open) return null;

  const selectProfilePicture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
      toast.error("Profile picture cannot exceed 5 MB");

      event.target.value = "";
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setProfilePicture(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetSelectedPicture = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setProfilePicture(null);
    setPreviewUrl(profile.user.userPfpUrl ?? null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: UpdateProfileInput = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      username: username.trim(),
      bio: bio.trim().length > 0 ? bio.trim() : null,
      profilePicture,
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
      // Your shared API helper displays the backend error.
    }
  };

  const initials = `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit profile dialog"
        onClick={() => {
          if (!updateMutation.isPending) {
            onClose();
          }
        }}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[26px] border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Edit profile
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Update your public information and profile picture.
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

        <div className="elite-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <section className="flex flex-col items-center rounded-[22px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile picture preview"
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-800"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-elitePurple text-2xl font-black text-white shadow-lg dark:border-slate-800">
                  {initials || "EM"}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={updateMutation.isPending}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-elitePurple text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 dark:border-slate-900"
                aria-label="Choose profile picture"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="mt-4 min-w-0 text-center sm:ml-5 sm:mt-0 sm:text-left">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Profile picture
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                JPEG, PNG, or WebP. Maximum size: 5 MB.
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateMutation.isPending}
                  className="h-9 rounded-xl bg-elitePurple px-4 text-xs font-black text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  Choose image
                </button>

                {profilePicture ? (
                  <button
                    type="button"
                    onClick={resetSelectedPicture}
                    disabled={updateMutation.isPending}
                    className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RotateCcw size={14} />
                    Undo
                  </button>
                ) : null}
              </div>

              {profilePicture ? (
                <p className="mt-2 max-w-xs truncate text-[11px] font-semibold text-elitePurple">
                  {profilePicture.name}
                </p>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={selectProfilePicture}
              className="hidden"
            />
          </section>

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
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
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
            className="flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-black text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
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
