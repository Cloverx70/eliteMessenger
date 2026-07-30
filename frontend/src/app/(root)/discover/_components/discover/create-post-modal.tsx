/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PostVisibility } from "../../types";
import { createPost } from "../../action";
import { discoverKeys } from "@/app/hooks/use-discover-posts";
import { toast } from "react-hot-toast";

interface SelectedMedia {
  id: string;
  file: File;
  previewUrl: string;
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (postId: string) => void;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function CreatePostModal({
  open,
  onClose,
  onCreated,
}: CreatePostModalProps) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState(PostVisibility.PUBLIC);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [media, setMedia] = useState<SelectedMedia[]>([]);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const canSubmit = useMemo(
    () => Boolean(caption.trim() || media.length > 0),
    [caption, media.length],
  );

  const mediaRef = useRef<SelectedMedia[]>([]);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const reset = () => {
    media.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setCaption("");
    setVisibility(PostVisibility.PUBLIC);
    setCommentsEnabled(true);
    setMedia([]);
    setProgress(0);
  };

  const close = () => {
    if (mutation.isPending) return;
    reset();
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (caption.trim()) formData.append("caption", caption.trim());
      formData.append("visibility", visibility);
      formData.append("commentsEnabled", String(commentsEnabled));
      media.forEach((item) => formData.append("attachments", item.file));
      return createPost(formData, setProgress);
    },
    onSuccess: async (post) => {
      toast.success("Post created.");
      await queryClient.invalidateQueries({ queryKey: discoverKeys.feeds });
      reset();
      onClose();
      onCreated?.(post.id);
    },
    onError: () => {
      setProgress(0);
      toast.error("Could not create the post.");
    },
  });

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";

    const accepted: SelectedMedia[] = [];
    for (const file of incoming) {
      if (media.length + accepted.length >= MAX_FILES) {
        toast.error(`You can upload up to ${MAX_FILES} files.`);
        break;
      }

      const allowed =
        file.type.startsWith("image/") || file.type.startsWith("video/");
      if (!allowed) {
        toast.error(`${file.name} is not an image or video.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 50 MB.`);
        continue;
      }

      accepted.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setMedia((current) => [...current, ...accepted]);
  };

  const removeMedia = (id: string) => {
    setMedia((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    setMedia((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Create post
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Share photos, videos, or a thought with Elite.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-5">
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={2200}
            placeholder="What do you want to share?"
            className="min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-relaxed outline-none transition focus:border-violet-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
          />
          <p className="mt-1 text-right text-[11px] font-medium text-slate-400">
            {caption.length}/2200
          </p>

          {media.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                >
                  {item.file.type.startsWith("image/") ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.previewUrl}
                      muted
                      className="h-full w-full object-cover"
                    />
                  )}

                  <span className="absolute left-2 top-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-black text-white">
                    {index + 1}
                  </span>

                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveMedia(index, -1)}
                        disabled={index === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/55 text-white disabled:opacity-30"
                      >
                        <ArrowLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMedia(index, 1)}
                        disabled={index === media.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/55 text-white disabled:opacity-30"
                      >
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 px-4 py-5 text-sm font-bold text-violet-700 transition hover:border-violet-500 hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-300"
          >
            <ImagePlus size={20} />
            Add photos or videos
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={addFiles}
            className="hidden"
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Visibility
              </span>
              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as PostVisibility)
                }
                className="mt-1 w-full bg-transparent text-sm font-bold text-slate-800 outline-none dark:text-white"
              >
                <option value={PostVisibility.PUBLIC}>Public</option>
                <option value={PostVisibility.FRIENDS}>Friends</option>
              </select>
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Comments
                </span>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                  Allow comments
                </p>
              </div>
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(event) => setCommentsEnabled(event.target.checked)}
                className="h-5 w-5 accent-violet-600"
              />
            </label>
          </div>

          {mutation.isPending ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Uploading media...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mutation.isPending ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            Publish post
          </button>
        </div>
      </div>
    </div>
  );
}
