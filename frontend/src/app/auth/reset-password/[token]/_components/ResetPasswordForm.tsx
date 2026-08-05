"use client";

import { ArrowRight, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";

import { AuthField } from "../../../_components/AuthField";
import { verifyResetPassword } from "@/app/auth/actions";

const Schema = z
  .object({
    newpassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmnewpassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newpassword === data.confirmnewpassword, {
    message: "Passwords do not match",
    path: ["confirmnewpassword"],
  });

type Inputs = z.infer<typeof Schema>;

export const ResetPasswordForm = ({
  token,
}: {
  token: string;
}) => {
  const router = useRouter();
  const safeToken = token.trim();

  const form = useForm<Inputs>({
    resolver: zodResolver(Schema),
    defaultValues: {
      newpassword: "",
      confirmnewpassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["VERIFY_RESET_PASSWORD", safeToken],
    mutationFn: (data: Inputs) =>
      verifyResetPassword(
        safeToken,
        data.newpassword,
        data.confirmnewpassword,
      ),
    onSuccess: (data) => {
      toaster(
        "Password reset successfully",
        data?.message ?? "You can now sign in.",
      );
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      toaster(
        "Could not reset password",
        error instanceof Error ? error.message : "Reset failed.",
      );
    },
  });

  if (!safeToken) {
    return (
      <div className="rounded-[26px] border border-red-200 bg-red-50 p-5 dark:border-red-950 dark:bg-red-950/20">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white">
          <TriangleAlert size={23} />
        </span>
        <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
          Invalid reset link
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Request a fresh password reset link and try again.
        </p>
        <Link
          href="/auth/reset-password"
          className="mt-5 flex min-h-11 items-center justify-center rounded-2xl bg-elitePurple px-4 text-xs font-black text-white"
        >
          Request another link
        </Link>
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
        id="reset-new-password"
        label="New password"
        icon={LockKeyhole}
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={form.formState.errors.newpassword?.message}
        {...form.register("newpassword")}
      />

      <AuthField
        id="reset-confirm-password"
        label="Confirm new password"
        icon={ShieldCheck}
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your new password"
        error={form.formState.errors.confirmnewpassword?.message}
        {...form.register("confirmnewpassword")}
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
            Update password
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
};
