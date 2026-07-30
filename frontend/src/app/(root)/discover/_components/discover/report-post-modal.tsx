"use client";

import { LoaderCircle, X } from "lucide-react";

import { PostReportReason } from "../../types";
import { reportPost } from "../../action";
import { toast } from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface ReportPostModalProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

const reasons = [
  { value: PostReportReason.SPAM, label: "Spam" },
  { value: PostReportReason.HARASSMENT, label: "Harassment" },
  { value: PostReportReason.INAPPROPRIATE, label: "Inappropriate content" },
  {
    value: PostReportReason.FALSE_INFORMATION,
    label: "False information",
  },
  { value: PostReportReason.OTHER, label: "Other" },
];

export function ReportPostModal({
  postId,
  open,
  onClose,
}: ReportPostModalProps) {
  const [reason, setReason] = useState(PostReportReason.SPAM);
  const [details, setDetails] = useState("");

  const mutation = useMutation({
    mutationFn: () => reportPost(postId, reason, details),
    onSuccess: () => {
      toast.success("Report submitted.");
      setDetails("");
      onClose();
    },
    onError: () => toast.error("Could not submit the report."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Report post
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Tell us what is wrong with this post.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X size={19} />
          </button>
        </header>

        <div className="mt-5 space-y-2">
          {reasons.map((item) => (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                reason === item.value
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <input
                type="radio"
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                className="accent-violet-600"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
            </label>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={1000}
          placeholder="Optional details..."
          className="mt-4 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-violet-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />

        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : null}
          Submit report
        </button>
      </div>
    </div>
  );
}
