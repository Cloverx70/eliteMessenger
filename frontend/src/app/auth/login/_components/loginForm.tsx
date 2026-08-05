"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";

import { AuthField } from "../../_components/AuthField";
import { getGoogleLoginUrl, login } from "../../actions";

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email cannot be empty")
    .email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginInputs = z.infer<typeof LoginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const googleLoginUrl = getGoogleLoginUrl();

  const form = useForm<LoginInputs>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["LOGIN"],
    mutationFn: (data: LoginInputs) => login(data.email, data.password),
    onSuccess: () => {
      toaster("Success", "Logged in successfully.");
      router.push("/");
      router.refresh();
    },
    onError: (error: unknown) => {
      toaster(
        "Error logging in",
        error instanceof Error ? error.message : "Could not log in.",
      );
    },
  });

  return (
    <div className="w-full space-y-5">
      <a
        href={googleLoginUrl}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:border-elitePurple/40 hover:bg-elitePurple/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:border-elitePurple/50 dark:hover:bg-elitePurple/10"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          or use email
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <form
        className="w-full space-y-5"
        noValidate
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <AuthField
          id="login-email"
          label="Email address"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        <AuthField
          id="login-password"
          label="Password"
          icon={LockKeyhole}
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />

        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-xs font-black text-elitePurple transition hover:opacity-75"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-elitePurple px-4 text-sm font-black text-white shadow-lg shadow-elitePurple/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Spinner />
          ) : (
            <>
              Continue to Elite
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.91A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.31-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.51l3.35-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z"
      />
    </svg>
  );
}
