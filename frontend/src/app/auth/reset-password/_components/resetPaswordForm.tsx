"use client";

import { CheckCircle2, Mail, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";

import { AuthField } from "../../_components/AuthField";
import { requestResetPassword } from "../../actions";

const Schema = z.object({
  email: z.string().trim().min(1, "Email cannot be empty").email("Enter a valid email address"),
});

type Inputs = z.infer<typeof Schema>;

export const ResetPasswordForm = () => {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<Inputs>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["REQUEST_RESET_PASSWORD"],
    mutationFn: (data: Inputs) => requestResetPassword(data.email),
    onSuccess: (_data, variables) => {
      setSubmittedEmail(variables.email);
      toaster(
        "Check your inbox",
        "If the account exists, a reset link has been sent.",
      );
    },
    onError: (error: unknown) => {
      toaster(
        "Could not send link",
        error instanceof Error ? error.message : "Could not request a reset.",
      );
    },
  });

  if (submittedEmail) {
    return (
      <div className="rounded-[26px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
          <CheckCircle2 size={24} />
        </span>
        <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          If an account exists for{" "}
          <span className="font-black text-slate-900 dark:text-white">
            {submittedEmail}
          </span>
          , a secure reset link is on its way.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSubmittedEmail(null)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            Send again
          </button>
          <Link
            href="/auth/login"
            className="flex min-h-11 items-center justify-center rounded-2xl bg-elitePurple px-4 text-xs font-black text-white"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="w-full space-y-5"
      noValidate
      onSubmit={form.handleSubmit((data) => mutate(data))}
    >
      <AuthField
        id="reset-request-email"
        label="Email address"
        icon={Mail}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-elitePurple px-4 text-sm font-black text-white shadow-lg shadow-elitePurple/20 transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? (
          <Spinner />
        ) : (
          <>
            Send reset link
            <Send size={17} />
          </>
        )}
      </button>
    </form>
  );
};
