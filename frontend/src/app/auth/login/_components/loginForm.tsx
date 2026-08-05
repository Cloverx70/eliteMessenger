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
import { login } from "../../actions";

const LoginSchema = z.object({
  email: z.string().trim().min(1, "Email cannot be empty").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginInputs = z.infer<typeof LoginSchema>;

export const LoginForm = () => {
  const router = useRouter();

  const form = useForm<LoginInputs>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["LOGIN"],
    mutationFn: (data: LoginInputs) => login(data.email, data.password),
    onSuccess: () => {
      toaster("Success", "Logged in successfully.");
      router.push("/");
    },
    onError: (error: unknown) => {
      toaster(
        "Error logging in",
        error instanceof Error ? error.message : "Could not log in.",
      );
    },
  });

  return (
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
  );
};
